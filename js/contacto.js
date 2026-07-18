// Envío del formulario de contacto contra /api/contacto (backend propio).
// La notificación reutiliza el estilo del aviso "código privado" (.aviso-toast)
// pero se muestra por JS (.aviso-visible) en vez de por :target. El toast se
// genera aquí para no duplicar su markup en cada página con formulario.

(function () {
    'use strict';

    function crearToast() {
        var aviso = document.createElement('aside');
        aviso.className = 'aviso-toast aviso-js';
        aviso.setAttribute('role', 'alert');
        aviso.innerHTML =
            '<div class="border-4 border-on-surface bg-inverse-surface shadow-[8px_8px_0px_0px_rgba(30,28,17,1)]">' +
            '<div class="bg-surface-variant px-4 py-1 flex items-center justify-between gap-4 border-b-2 border-on-surface">' +
            '<span class="aviso-titulo font-label-sm text-label-sm text-on-surface font-bold"></span>' +
            '<button type="button" class="material-symbols-outlined text-on-surface hover:text-error" aria-label="Cerrar aviso">close</button>' +
            '</div>' +
            '<div class="p-4 font-label-sm text-label-sm text-secondary-fixed">' +
            '<p class="aviso-comando text-on-primary-container"></p>' +
            '<p class="aviso-lineas mt-2"></p>' +
            '<div class="mt-2 flex items-center gap-2"><span>$</span><span class="cursor"></span></div>' +
            '</div></div>';
        aviso.querySelector('button').addEventListener('click', function () {
            aviso.classList.remove('aviso-visible');
        });
        document.body.appendChild(aviso);
        return aviso;
    }

    var toast = null;
    var toastTimer = null;

    function mostrarAviso(titulo, comando, lineas, esError) {
        toast = toast || crearToast();
        toast.querySelector('.aviso-titulo').textContent = titulo;
        toast.querySelector('.aviso-comando').textContent = comando;
        var cuerpo = toast.querySelector('.aviso-lineas');
        cuerpo.innerHTML = '';
        lineas.forEach(function (linea) {
            var p = document.createElement('p');
            p.textContent = '> ' + linea;
            cuerpo.appendChild(p);
        });
        cuerpo.className = 'aviso-lineas mt-2 ' + (esError ? 'text-error-container' : '');
        toast.classList.remove('aviso-visible');
        void toast.offsetWidth; // reinicia la animación si ya estaba visible
        toast.classList.add('aviso-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('aviso-visible');
        }, 8000);
    }

    function cargarCaptcha(form) {
        var pregunta = form.querySelector('.captcha-pregunta');
        return fetch('/api/contacto/captcha')
            .then(function (r) { return r.json(); })
            .then(function (d) {
                pregunta.textContent = d.pregunta + ' = ?';
                form.dataset.captchaToken = d.token;
            })
            .catch(function () {
                pregunta.textContent = 'sin conexión con la API';
            });
    }

    document.querySelectorAll('form[data-contacto]').forEach(function (form) {
        cargarCaptcha(form);

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var boton = form.querySelector('button[type="submit"]');
            var textoBoton = boton.textContent;
            boton.disabled = true;
            boton.textContent = 'Enviando...';

            fetch('/api/contacto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: form.nombre.value,
                    email: form.email.value,
                    mensaje: form.mensaje.value,
                    captcha: form.captcha.value,
                    token: form.dataset.captchaToken || '',
                    web: form.web.value
                })
            })
                .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, datos: d }; }); })
                .then(function (res) {
                    if (res.ok) {
                        form.reset();
                        mostrarAviso('MAIL.LOG', '$ mail --send', [
                            'Estado: entregado ✓',
                            'Gracias por escribirme.',
                            'Te responderé pronto.'
                        ], false);
                    } else {
                        mostrarAviso('ERROR.LOG', '$ mail --send', [
                            'fatal: ' + (res.datos.error || 'error desconocido'),
                            'Vuelve a intentarlo.'
                        ], true);
                    }
                })
                .catch(function () {
                    mostrarAviso('ERROR.LOG', '$ mail --send', [
                        'fatal: sin conexión con el servidor',
                        'Vuelve a intentarlo en un momento.'
                    ], true);
                })
                .finally(function () {
                    boton.disabled = false;
                    boton.textContent = textoBoton;
                    form.captcha.value = '';
                    cargarCaptcha(form); // el token es de un solo uso
                });
        });
    });
})();
