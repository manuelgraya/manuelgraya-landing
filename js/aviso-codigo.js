// Aviso "código privado": al pulsar el botón "Código" de un proyecto privado
// ([data-aviso-codigo]) muestra el toast .aviso-toast por JS (clase
// .aviso-visible, mismo mecanismo que js/contacto.js). No hay ningún enlace con
// hash, así que la URL NUNCA cambia. El aviso se auto-oculta a los 6 s y también
// se cierra con la X ([data-aviso-cerrar]). El toast vive fuera del <main> para
// que position:fixed lo ancle al viewport (dentro de .entra-pagina el transform
// lo desplazaba al final del contenido).

(function () {
    'use strict';

    var toast = document.querySelector('.aviso-toast');
    if (!toast) return;

    var timer = null;

    function mostrar() {
        toast.classList.remove('aviso-visible');
        void toast.offsetWidth; // reinicia la animación si ya estaba visible
        toast.classList.add('aviso-visible');
        clearTimeout(timer);
        timer = setTimeout(ocultar, 6000);
    }

    function ocultar() {
        clearTimeout(timer);
        toast.classList.remove('aviso-visible');
    }

    // Enter/Espacio sobre elementos con role="button" que no son <button> nativos.
    function activarConTeclado(handler) {
        return function (e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                handler();
            }
        };
    }

    document.querySelectorAll('[data-aviso-codigo]').forEach(function (boton) {
        boton.addEventListener('click', mostrar);
        boton.addEventListener('keydown', activarConTeclado(mostrar));
    });

    var cerrar = toast.querySelector('[data-aviso-cerrar]');
    if (cerrar) {
        cerrar.addEventListener('click', ocultar);
        cerrar.addEventListener('keydown', activarConTeclado(ocultar));
    }
})();
