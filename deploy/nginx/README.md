# Configuración de nginx — landing (servidor `manuel`, 192.168.0.16)

Copia versionada de la config de nginx que sirve la landing, más el endurecimiento
de seguridad aplicado el **2026-07-25**. La fuente de verdad sigue siendo el
servidor; estos ficheros son el respaldo/referencia para reproducirla o auditarla.

## Arquitectura

```
Internet ──► Cloudflare edge ──► cloudflared (túnel) ──► 127.0.0.1 ──► nginx
                                                                        ├─ :8090  landing        → /srv/landing            (estático)
                                                                        │           /api/contacto → 127.0.0.1:8091          (Python, systemd: landing-contacto.service)
                                                                        └─ :80    angelagarciapsicologia.com (web de la psicóloga — NO TOCAR)
```

- Hay **dos túneles cloudflared**: uno permanente (`/etc/cloudflared/config.yml`, dominio
  de la psicóloga) y un *quick tunnel* que expone la landing
  (`cloudflared tunnel --url http://localhost:8090` → URL `*.trycloudflare.com`).
- Como todo el tráfico llega vía `cloudflared` desde `127.0.0.1`, la IP de origen
  real del visitante **no** es el `$remote_addr` — viene en la cabecera
  `CF-Connecting-IP` (ver `real_ip` más abajo).
- La API de contacto es **un solo proceso `python3`** con backlog de conexiones = 5.
  Es el eslabón débil ante saturación → de ahí el rate limit.

## Ficheros

| Fichero | Destino en el servidor |
|---|---|
| `landing.conf` | `/etc/nginx/sites-enabled/landing` |
| `hardening-http.snippet` | dentro del bloque `http { }` de `/etc/nginx/nginx.conf` |

> ⚠️ `nginx.conf` incluye `sites-enabled/*` (glob de **todo**). No dejes backups
> (`landing.bak.*`) dentro de `sites-enabled/`: nginx los cargaría como config y
> daría `conflicting server name "_" on 0.0.0.0:8090`. Guárdalos en `/etc/nginx/backups/`.

## Endurecimiento aplicado (2026-07-25)

Contexto: se observó en el log sondeo de endpoints (`GET /api/users/`, `/api/user/`,
`/api/contacto` → 404) además del ruido habitual de bots de WordPress. No fue un DoS,
pero destapó que la landing **no tenía ninguna defensa**. Cambios:

1. **IP real del cliente** (`real_ip` + `CF-Connecting-IP`): los logs y el backend
   de contacto pasan a ver la IP real en vez de `127.0.0.1`.
2. **Rate limiting** (`limit_req`):
   - `landing_general`: 30 r/s (burst 60) para todo el sitio — corta floods sin
     molestar una carga normal (una página tira ~15 assets de golpe).
   - `landing_api`: 5 r/s (burst 10) en `/api/contacto` → responde **429** al saturar,
     protegiendo el Python de contacto.
3. **Log propio**: `/var/log/nginx/landing.access.log` (antes se mezclaba con la
   web de la psicóloga en el `access.log` común).

## Aplicar / reproducir

```sh
# 1. Backups (FUERA de sites-enabled)
sudo mkdir -p /etc/nginx/backups
sudo cp /etc/nginx/nginx.conf            /etc/nginx/backups/nginx.conf.bak.$(date +%F-%H%M%S)
sudo cp /etc/nginx/sites-enabled/landing /etc/nginx/backups/landing.bak.$(date +%F-%H%M%S)

# 2. Insertar las directivas http (solo si no están ya)
sudo grep -q 'Hardening landing' /etc/nginx/nginx.conf \
  || sudo sed -i '/^http {/r /ruta/a/hardening-http.snippet' /etc/nginx/nginx.conf

# 3. Instalar el sitio
sudo cp landing.conf /etc/nginx/sites-enabled/landing

# 4. Validar y recargar (si el test falla, NO recarga → la web sigue intacta)
sudo nginx -t && sudo systemctl reload nginx
```

## Rollback

```sh
sudo cp /etc/nginx/backups/landing.bak.<fecha> /etc/nginx/sites-enabled/landing
sudo cp /etc/nginx/backups/nginx.conf.bak.<fecha> /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

## Ver logs / peticiones en vivo

```sh
# API de contacto (peticiones reales de usuarios, sin sudo)
ssh 192.168.0.16 'journalctl -u landing-contacto.service -f'

# Accesos de la landing (necesita sudo o pertenecer al grupo http)
ssh -t 192.168.0.16 'sudo tail -f /var/log/nginx/landing.access.log'
```
