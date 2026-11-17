// Vídeos con autoplay (artículos de /proyectos/<slug>/ y avatar del index):
// con prefers-reduced-motion se pausan y quedan como imagen fija (el póster en
// los artículos, que conservan los controles para reproducirlos a mano). Si la
// preferencia cambia con la página abierta, se pausan o se reanudan.
// /sobre-mi/ no carga este script: su avatar lo gestiona js/sobre-mi.js.

(function () {
    'use strict';

    var videos = Array.prototype.slice.call(document.querySelectorAll('video[autoplay]'));
    if (!videos.length || !window.matchMedia) return;

    var reducir = window.matchMedia('(prefers-reduced-motion: reduce)');

    function aplicar() {
        videos.forEach(function (video) {
            if (reducir.matches) {
                video.removeAttribute('autoplay');
                video.pause();
            } else {
                video.setAttribute('autoplay', '');
                var reproduccion = video.play();
                // play() devuelve una promesa que se rechaza si el navegador
                // bloquea la reproducción: no es un error de la página.
                if (reproduccion && reproduccion.catch) reproduccion.catch(function () {});
            }
        });
    }

    aplicar();
    if (reducir.addEventListener) reducir.addEventListener('change', aplicar);
    else if (reducir.addListener) reducir.addListener(aplicar); // Safari < 14
})();
