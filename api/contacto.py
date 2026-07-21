#!/usr/bin/env python3
"""API de contacto de la landing. Solo stdlib: sin pip, sin venv.

Endpoints (nginx los proxya desde /api/contacto):
  GET  /api/contacto/captcha  -> {"pregunta": "7 + 3", "token": "..."}
  POST /api/contacto          -> envía el mensaje por SMTP de Gmail

El captcha es aritmético y sin estado: el token lleva HMAC(respuesta|ts) con
un secreto del servidor, así no hace falta guardar nada entre peticiones.

Configuración por variables de entorno (EnvironmentFile del servicio systemd):
  CONTACTO_GMAIL_USER      cuenta Gmail que envía Y recibe
  CONTACTO_GMAIL_PASSWORD  contraseña de aplicación (16 caracteres, sin espacios)
  CONTACTO_SECRET          secreto aleatorio para firmar los tokens del captcha
  CONTACTO_PORT            puerto de escucha (por defecto 8091, solo localhost)
"""

import hashlib
import hmac
import json
import os
import random
import re
import smtplib
import threading
import time
from collections import defaultdict, deque
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

GMAIL_USER = os.environ["CONTACTO_GMAIL_USER"]
GMAIL_PASSWORD = os.environ["CONTACTO_GMAIL_PASSWORD"]
SECRET = os.environ["CONTACTO_SECRET"].encode()
PORT = int(os.environ.get("CONTACTO_PORT", "8091"))

CAPTCHA_TTL = 15 * 60  # segundos de validez del token
RATE_LIMIT = 5         # envíos por IP...
RATE_WINDOW = 3600     # ...por hora

_envios_por_ip = defaultdict(deque)
_tokens_usados = {}  # token -> ts, para impedir reutilizarlos dentro del TTL
_lock = threading.Lock()  # protege el estado compartido entre hilos


def _firma(respuesta: str, ts: str, nonce: str) -> str:
    return hmac.new(SECRET, f"{respuesta}|{ts}|{nonce}".encode(), hashlib.sha256).hexdigest()[:32]


def nuevo_captcha() -> dict:
    a, b = random.randint(2, 9), random.randint(2, 9)
    if random.random() < 0.5:
        pregunta, respuesta = f"{a} + {b}", a + b
    else:
        a, b = max(a, b), min(a, b)
        pregunta, respuesta = f"{a} - {b}", a - b
    ts = str(int(time.time()))
    nonce = os.urandom(4).hex()
    return {"pregunta": pregunta, "token": f"{ts}.{nonce}.{_firma(str(respuesta), ts, nonce)}"}


def captcha_valido(token: str, respuesta: str) -> bool:
    try:
        ts, nonce, sig = token.split(".")
        ts_int = int(ts)
    except ValueError:
        return False
    if time.time() - ts_int > CAPTCHA_TTL:
        return False
    if not hmac.compare_digest(sig, _firma(respuesta.strip(), ts, nonce)):
        return False
    ahora = time.time()
    with _lock:  # check-then-insert atómico: cierra la carrera de reutilización
        if token in _tokens_usados:
            return False
        _tokens_usados[token] = ahora
        for t, usado_en in list(_tokens_usados.items()):
            if ahora - usado_en > CAPTCHA_TTL:
                del _tokens_usados[t]
    return True


def dentro_del_limite(ip: str) -> bool:
    ahora = time.time()
    with _lock:
        # purga global: descarta envíos caducados y elimina las IPs que se
        # quedan sin ninguno, para que el diccionario no crezca sin límite
        for otra_ip in list(_envios_por_ip):
            cola = _envios_por_ip[otra_ip]
            while cola and ahora - cola[0] > RATE_WINDOW:
                cola.popleft()
            if not cola:
                del _envios_por_ip[otra_ip]
        envios = _envios_por_ip[ip]
        if len(envios) >= RATE_LIMIT:
            return False
        envios.append(ahora)
        return True


def enviar_correo(nombre: str, email: str, mensaje: str) -> None:
    msg = EmailMessage()
    msg["From"] = GMAIL_USER
    msg["To"] = GMAIL_USER
    msg["Reply-To"] = email
    msg["Subject"] = f"Nuevo mensaje desde la landing — {nombre}"
    msg.set_content(f"Nombre: {nombre}\nEmail: {email}\n\n{mensaje}\n")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as smtp:
        smtp.login(GMAIL_USER, GMAIL_PASSWORD)
        smtp.send_message(msg)


class Handler(BaseHTTPRequestHandler):
    def _json(self, codigo: int, cuerpo: dict) -> None:
        datos = json.dumps(cuerpo).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(datos)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(datos)

    def do_GET(self):
        if self.path == "/api/contacto/captcha":
            self._json(200, nuevo_captcha())
        else:
            self._json(404, {"error": "no encontrado"})

    def do_POST(self):
        if self.path != "/api/contacto":
            self._json(404, {"error": "no encontrado"})
            return
        try:
            longitud = max(0, min(int(self.headers.get("Content-Length", 0)), 64 * 1024))
            datos = json.loads(self.rfile.read(longitud))
        except (ValueError, json.JSONDecodeError):
            self._json(400, {"error": "petición inválida"})
            return

        if datos.get("web"):  # honeypot: los humanos no ven este campo
            self._json(200, {"ok": True})
            return

        nombre = str(datos.get("nombre", "")).strip()[:100].replace("\n", " ").replace("\r", " ")
        email = str(datos.get("email", "")).strip()[:200]
        mensaje = str(datos.get("mensaje", "")).strip()[:5000]
        if not nombre or not mensaje or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            self._json(400, {"error": "revisa los campos del formulario"})
            return

        if not captcha_valido(str(datos.get("token", "")), str(datos.get("captcha", ""))):
            self._json(400, {"error": "captcha incorrecto o caducado"})
            return

        ip = self.headers.get("X-Real-IP", self.client_address[0])
        if not dentro_del_limite(ip):
            self._json(429, {"error": "demasiados envíos, prueba más tarde"})
            return

        try:
            enviar_correo(nombre, email, mensaje)
        except Exception as e:
            print(f"error enviando correo: {e}", flush=True)
            self._json(502, {"error": "no se pudo enviar el mensaje"})
            return
        self._json(200, {"ok": True})

    def log_message(self, formato, *args):
        print(f"{self.headers.get('X-Real-IP', self.client_address[0])} {formato % args}", flush=True)


if __name__ == "__main__":
    print(f"API de contacto escuchando en 127.0.0.1:{PORT}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
