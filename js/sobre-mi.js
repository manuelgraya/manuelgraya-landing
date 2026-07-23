/*
 * /sobre-mi/ — Diálogo estilo juego antiguo (Pokémon / Zelda 2D).
 *
 * Pantalla única: avatar animado a la izquierda + caja de diálogo a la derecha.
 * El usuario elige una pregunta en una CAJA DE OPCIONES con un cursor (▶) que se
 * mueve con el ratón o con las flechas ↑/↓ + Enter. El avatar "teclea" la
 * respuesta con efecto máquina de escribir dentro de una caja de ALTURA FIJA;
 * si el texto no cabe, se pagina (no se estira la caja) y se puede ir y volver
 * entre páginas.
 *
 * Diseño agnóstico al medio: el avatar es una máquina de estados
 * (idle / escribiendo / hablando) y cada estado mapea a un recurso en
 * MEDIOS_AVATAR. Hoy solo existe el vídeo idle (assets/avatar-idle.webm|mp4);
 * las poses/animaciones nuevas se enchufan aquí sin tocar la lógica.
 */
(function () {
  'use strict';

  // ---- Contenido -----------------------------------------------------------
  // Preguntas ordenadas por relevancia. `texto` admite saltos de párrafo con
  // una línea en blanco (\n\n). Única fuente de verdad del diálogo.
  const DIALOGOS = [
    {
      id: 'sobre-mi',
      etiqueta: '¡Cuéntame sobre ti!',
      // Animación de tecleo en portátil (assets/avatar-teclear.*): es la de por
      // defecto y la comparten las preguntas sin animación propia (estudios,
      // estilo, redes). Al acabar vuelve al idle con el "cambio de canal" de TV.
      animacion: '/assets/avatar-teclear',
      texto:
        'Soy Manuel Graya, ingeniero informático. Desde pequeño las matemáticas, ' +
        'resolver problemas y conectar con la gente han sido lo mío. La física me ' +
        'apasionaba, pero la informática ganó la partida, aquí no hay límites para ' +
        'la creatividad ni para la curiosidad.\n\n' +
        'Empecé a programar en 2020 y poco después dejé Windows para adentrarme en ' +
        'el software libre. Descubrir el Open Source me demostró que, cuando la ' +
        'humanidad se une con un propósito común, logra avances impresionantes.\n\n' +
        'Hoy estamos viviendo con la IA una revolución equiparable al nacimiento de ' +
        'la web, y no quiero ser un mero espectador, me he subido a la ola para ' +
        'vivirla en primera línea.',
    },
    {
      id: 'estudios',
      etiqueta: '¿Qué has estudiado?',
      animacion: '/assets/avatar-teclear',
      texto:
        'Vengo del mundo de la Ingeniería Informática, que estudié en la ' +
        'Universidad de Cádiz. Me formé tocando de todo: sistemas y bajo nivel ' +
        '(C, C++, Linux), backend (Java/Spring, PHP/Laravel, Python), bases de ' +
        'datos relacionales (PostgreSQL, MySQL) y algo de IA clásica con sistemas ' +
        'expertos (CLIPS).\n\n' +
        'Pero mi formación de verdad es diaria y autodidacta: dotfiles, la terminal, ' +
        'la documentación y los proyectos reales han sido mi mejor aula.',
    },
    {
      id: 'estilo',
      etiqueta: '¿Cómo definirías tu estilo?',
      animacion: '/assets/avatar-teclear',
      texto:
        'Terminal-first y pragmático. Prefiero entornos reproducibles (Docker), ' +
        'automatizar lo repetitivo (Bash, CI/CD) y dejar el sistema como código.\n\n' +
        'Priorizo la transparencia y la simplicidad, soluciones que impacten de ' +
        'verdad, sin dependencias propietarias opacas. Creo en el software libre, en ' +
        'el trabajo en equipo (Scrum, DevOps) y en desplegar rápido sin sacrificar ' +
        'estabilidad.\n\n' +
        'Ahora mismo me estoy formando a fondo en el uso de la IA: Claude Code, ' +
        'Gemini, GPT, modelos locales en mi propio servidor... la integro en el día ' +
        'a día para ir más rápido sin perder el control del código.',
    },
    {
      id: 'juego',
      etiqueta: '¿Juego favorito?',
      // Animación de Link alzando la Master Sword (assets/avatar-zelda.*); al
      // acabar vuelve al idle, con el mismo "cambio de canal" de TV.
      animacion: '/assets/avatar-zelda',
      texto:
        '¿Uno solo? Ocarina of Time. Pero me quedo con la saga The Legend of Zelda ' +
        'al completo: juntan música, aventura, puzzles mentales y exploración como ' +
        'nadie. Son capaces de captar toda mi atención.\n\n' +
        'Menciones especiales para Red Dead Redemption 2, Clair Obscur: ' +
        'Expedition 33, Kingdom Come: Deliverance 2 (me pareció espectacular), ' +
        'The Witcher 3 y Super Mario Odyssey.',
    },
    {
      id: 'hobbies',
      etiqueta: '¿Cuáles son tus hobbies?',
      // Al elegir esta pregunta el avatar cambia de "canal" y reproduce una
      // animación de boxeo (assets/avatar-boxeo.*); al terminar vuelve al idle.
      animacion: '/assets/avatar-boxeo',
      texto:
        'Me encanta el gimnasio, entreno musculación cada semana y el deporte en ' +
        'general me pierde. También practico boxeo.\n\n' +
        'Y, por supuesto, juego a videojuegos, creo proyectos y aprendo tecnologías ' +
        'nuevas. Sobre todo, disfruto de mi familia y mis amigos todo cuanto puedo.',
    },
    {
      id: 'redes',
      etiqueta: '¿Redes sociales?',
      animacion: '/assets/avatar-teclear',
      texto:
        'Aunque aquí me veas como un avatar, en mi Instagram puedes ver mis fotos ' +
        'de verdad. Me encuentras en:\n\n' +
        '> GitHub — manuelgraya\n' +
        '> LinkedIn — Manuel García\n' +
        '> Instagram — manuel.graya\n\n' +
        '¿Prefieres escribirme? Pásate por /contacto/.',
    },
  ];

  // Estado del avatar -> recurso. De momento todos reutilizan el vídeo idle;
  // cuando existan poses/animaciones nuevas se referencian aquí.
  const MEDIOS_AVATAR = {
    idle: { tipo: 'video' },
    escribiendo: { tipo: 'video' }, // TODO: animación/pose de tecleo
    hablando: { tipo: 'video' }, // TODO: pose hablando
  };

  // Velocidad del tecleo (ms por carácter). Rápido pero legible.
  const MS_CARACTER = 8;
  const MS_PAUSA_PUNTUACION = 70;

  // ---- Arranque ------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    const escena = document.querySelector('[data-dialogo]');
    if (!escena) return;

    const elMarco = escena.querySelector('[data-avatar-marco]');
    const elVideo = escena.querySelector('[data-avatar-video]');
    const elTexto = escena.querySelector('[data-dialogo-texto]');
    const elMedidor = escena.querySelector('[data-dialogo-medidor]');
    const elPagina = escena.querySelector('[data-dialogo-pagina]');
    const elPrompt = escena.querySelector('[data-dialogo-prompt]');
    const elPrev = escena.querySelector('[data-dialogo-prev]');
    const elNext = escena.querySelector('[data-dialogo-next]');
    const elMenu = escena.querySelector('[data-dialogo-menu]');
    const elCaja = escena.querySelector('[data-dialogo-caja]');

    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let paginas = [];
    let paginaActual = 0;
    let textoActual = ''; // texto completo en curso, para repaginar si cambia la métrica
    let tecleando = false;
    let saltar = false; // petición de completar la página al instante
    let temporizador = null;
    let botones = []; // botones del menú
    let indiceSel = 0; // opción resaltada por el cursor

    // Animación puntual del avatar (p. ej. boxeo en hobbies): mientras está
    // activa, el vídeo NO es el idle, así que no le tocamos el playbackRate.
    let animacionActiva = false;
    let tCanal = null; // timeout del swap dentro del cambio de canal
    // Fuentes originales del idle, para poder volver tras la animación.
    const FUENTES_IDLE = elVideo
      ? Array.prototype.map.call(elVideo.querySelectorAll('source'), function (s) {
          return { src: s.getAttribute('src'), type: s.type };
        })
      : [];

    // -- Máquina de estados del avatar --------------------------------------
    function setEstado(estado) {
      if (elMarco) elMarco.dataset.estado = estado;
      const medio = MEDIOS_AVATAR[estado] || MEDIOS_AVATAR.idle;
      if (medio.tipo === 'video' && elVideo && !reducir && !animacionActiva) {
        // El vídeo idle "acelera" un pelín al escribir para sugerir actividad.
        elVideo.playbackRate = estado === 'escribiendo' ? 1.4 : 1;
      }
    }

    // -- Cambio de canal / animaciones del avatar ---------------------------
    // Reemplaza las <source> del vídeo y recarga.
    function ponFuentes(fuentes) {
      if (!elVideo) return;
      while (elVideo.firstChild) elVideo.removeChild(elVideo.firstChild);
      fuentes.forEach(function (f) {
        const s = document.createElement('source');
        s.setAttribute('src', f.src);
        s.type = f.type;
        elVideo.appendChild(s);
      });
      elVideo.load();
    }

    // Efecto "cambio de canal" de TV antigua: dispara la estática/colapso (CSS)
    // y ejecuta el swap del vídeo hacia la mitad, cuando la imagen es una línea.
    function cambioDeCanal(swap) {
      window.clearTimeout(tCanal);
      if (reducir || !elMarco) {
        swap();
        return;
      }
      elMarco.classList.remove('avatar-canaleando');
      void elMarco.offsetWidth; // fuerza reflow para reiniciar la animación
      elMarco.classList.add('avatar-canaleando');
      tCanal = window.setTimeout(swap, 215);
      window.setTimeout(function () {
        elMarco.classList.remove('avatar-canaleando');
      }, 480);
    }

    // Reproduce una animación puntual (una vez) y, al acabar, vuelve al idle.
    function reproduceAnimacion(base) {
      if (reducir || !elVideo) return;
      animacionActiva = true;
      cambioDeCanal(function () {
        ponFuentes([
          { src: base + '.webm?v=3', type: 'video/webm' },
          { src: base + '.mp4?v=3', type: 'video/mp4' },
        ]);
        elVideo.loop = false;
        elVideo.playbackRate = 1;
        const p = elVideo.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      });
    }

    // Vuelve al vídeo idle (con su cambio de canal correspondiente).
    function vuelveIdle() {
      if (!elVideo) return;
      cambioDeCanal(function () {
        ponFuentes(FUENTES_IDLE);
        elVideo.loop = true;
        animacionActiva = false;
        const p = elVideo.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      });
    }

    // Al terminar la animación puntual (loop=false), regresa al idle.
    if (elVideo) {
      elVideo.addEventListener('ended', function () {
        if (animacionActiva) vuelveIdle();
      });
    }

    // -- Paginación ----------------------------------------------------------
    // Reparte el texto en páginas que quepan en la altura real de la caja,
    // midiendo palabra a palabra en un clon oculto (mismo ancho/tipografía).
    function paginar(texto) {
      const alturaMax = elTexto.clientHeight;
      const parrafos = texto.split('\n\n');
      const pags = [];
      let acumulado = '';

      function cabe(candidato) {
        elMedidor.textContent = candidato;
        return elMedidor.scrollHeight <= alturaMax;
      }

      for (let p = 0; p < parrafos.length; p++) {
        const palabras = parrafos[p].split(' ');
        for (let w = 0; w < palabras.length; w++) {
          const sep = acumulado === '' ? '' : (w === 0 ? '\n\n' : ' ');
          const candidato = acumulado + sep + palabras[w];
          if (cabe(candidato)) {
            acumulado = candidato;
          } else {
            if (acumulado !== '') pags.push(acumulado);
            acumulado = palabras[w];
            // Si una sola palabra no cabe (caso extremo), se emite igualmente.
          }
        }
      }
      if (acumulado !== '') pags.push(acumulado);
      return pags.length ? pags : [''];
    }

    // -- Mostrar / teclear una página ---------------------------------------
    // instant=true la pinta de golpe (al retroceder, ya se leyó).
    function muestraPagina(indice, instant) {
      window.clearTimeout(temporizador);
      paginaActual = indice;
      const texto = paginas[indice];
      elTexto.textContent = '';

      if (reducir || instant) {
        elTexto.textContent = texto;
        finPagina();
        return;
      }

      tecleando = true;
      saltar = false;
      setEstado('escribiendo');
      elCaja.classList.add('dialogo-tecleando');
      actualizaPie();

      let i = 0;
      (function paso() {
        if (saltar) {
          elTexto.textContent = texto;
          finPagina();
          return;
        }
        if (i >= texto.length) {
          finPagina();
          return;
        }
        const ch = texto[i];
        elTexto.textContent += ch;
        i++;
        const pausa = /[.,;:!?]/.test(ch) ? MS_PAUSA_PUNTUACION : MS_CARACTER;
        temporizador = window.setTimeout(paso, pausa);
      })();
    }

    function finPagina() {
      window.clearTimeout(temporizador);
      tecleando = false;
      elCaja.classList.remove('dialogo-tecleando');
      const hayMas = paginaActual < paginas.length - 1;
      setEstado(hayMas ? 'hablando' : 'idle');
      actualizaPie();
    }

    function actualizaPie() {
      const total = paginas.length;
      const multi = total > 1;
      if (elPagina) elPagina.textContent = multi ? (paginaActual + 1) + '/' + total : '';

      // Botones de navegación entre páginas (solo si hay más de una).
      if (elPrev) {
        elPrev.hidden = !multi;
        elPrev.disabled = tecleando || paginaActual === 0;
      }
      if (elNext) {
        elNext.hidden = !multi;
        elNext.disabled = tecleando || paginaActual >= total - 1;
      }
      if (elPrompt) {
        if (tecleando) {
          elPrompt.textContent = '';
        } else if (paginaActual < total - 1) {
          elPrompt.textContent = '▼ MÁS';
        } else if (multi) {
          elPrompt.textContent = '■ FIN';
        } else {
          elPrompt.textContent = '■ ELIGE OTRA';
        }
      }
    }

    // -- Navegación de páginas ----------------------------------------------
    function paginaSiguiente() {
      if (tecleando) { saltar = true; return; }
      if (paginaActual < paginas.length - 1) muestraPagina(paginaActual + 1, false);
    }
    function paginaAnterior() {
      if (tecleando) { saltar = true; return; }
      if (paginaActual > 0) muestraPagina(paginaActual - 1, true);
    }

    // -- Iniciar un diálogo --------------------------------------------------
    function iniciaDialogo(dlg) {
      window.clearTimeout(temporizador);
      // Animación propia de la pregunta (o volver al idle si se sale de una).
      if (dlg.animacion) {
        reproduceAnimacion(dlg.animacion);
      } else if (animacionActiva) {
        vuelveIdle();
      }
      textoActual = dlg.texto;
      paginas = paginar(dlg.texto);
      muestraPagina(0, false);
    }

    // Repagina el texto en curso con la métrica ACTUAL y repinta la página
    // vigente de golpe (sin reteclear). La paginación depende de la altura real
    // del texto, que cambia cuando: (a) por fin carga la webfont JetBrains Mono
    // —en móvil llega tarde y, medida antes, la caja rebosaba y recortaba el
    // texto—, o (b) se rota/redimensiona la pantalla.
    function reflow() {
      if (!textoActual) return;
      const nuevas = paginar(textoActual);
      // Si la métrica no cambió la paginación (p. ej. fuente ya cacheada), no
      // repintamos: así no interrumpimos un tecleo en curso (el del saludo).
      if (nuevas.length === paginas.length && nuevas.every(function (t, i) { return t === paginas[i]; })) {
        return;
      }
      const idxPrevia = paginaActual;
      paginas = nuevas;
      muestraPagina(Math.min(idxPrevia, paginas.length - 1), true);
    }

    // -- Interacciones con la caja ------------------------------------------
    // Click: completa el tecleo o avanza de página.
    elCaja.addEventListener('click', paginaSiguiente);
    elCaja.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        paginaSiguiente();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        paginaAnterior();
      }
    });
    if (elPrev) elPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      paginaAnterior();
    });
    if (elNext) elNext.addEventListener('click', function (e) {
      e.stopPropagation();
      paginaSiguiente();
    });

    // -- Menú estilo Pokémon: cursor con ratón y flechas --------------------
    function mueveCursor(idx) {
      indiceSel = (idx + botones.length) % botones.length;
      botones.forEach(function (b, i) {
        const sel = i === indiceSel;
        b.classList.toggle('dialogo-opcion--sel', sel);
        b.setAttribute('tabindex', sel ? '0' : '-1');
      });
    }

    DIALOGOS.forEach(function (dlg, idx) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dialogo-opcion';
      btn.dataset.opcion = dlg.id;
      btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      btn.innerHTML =
        '<span class="dialogo-cursor" aria-hidden="true">▶</span>' +
        '<span class="dialogo-opcion-num">' + (idx + 1) + '.</span>' +
        '<span class="dialogo-opcion-txt"></span>';
      btn.querySelector('.dialogo-opcion-txt').textContent = dlg.etiqueta;
      btn.addEventListener('click', function () { iniciaDialogo(dlg); });
      // El ratón mueve el cursor al pasar por encima.
      btn.addEventListener('mouseenter', function () { mueveCursor(idx); });
      btn.addEventListener('focus', function () { mueveCursor(idx); });
      li.appendChild(btn);
      elMenu.appendChild(li);
      botones.push(btn);
    });

    // Teclado del menú a nivel de DOCUMENTO: así las flechas y Enter controlan
    // el cursor desde que carga la página, sin necesidad de clicar antes (un
    // listener en el <ul> solo recibía teclas cuando un botón ya tenía el foco).
    // La caja de diálogo gestiona sus propias flechas (páginas): si el foco está
    // dentro de ella, no interferimos. Tampoco robamos teclas a enlaces/campos.
    document.addEventListener('keydown', function (e) {
      const t = e.target;
      if (elCaja.contains(t)) return;
      if (t && t.closest && t.closest('a, input, textarea, select')) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          mueveCursor(indiceSel + 1);
          botones[indiceSel].focus();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          mueveCursor(indiceSel - 1);
          botones[indiceSel].focus();
          break;
        case 'Home':
          e.preventDefault();
          mueveCursor(0);
          botones[indiceSel].focus();
          break;
        case 'End':
          e.preventDefault();
          mueveCursor(botones.length - 1);
          botones[indiceSel].focus();
          break;
        case 'Enter':
          // Si el foco ya está en un botón del menú, su click nativo se encarga.
          if (!elMenu.contains(t)) {
            e.preventDefault();
            botones[indiceSel].click();
          }
          break;
      }
    });

    mueveCursor(0);

    // Con reduced-motion pausamos el vídeo (queda como retrato fijo).
    if (reducir && elVideo) {
      elVideo.removeAttribute('autoplay');
      elVideo.pause();
    }

    // Saludo inicial.
    setEstado('idle');
    textoActual =
      'Hola, soy Manuel. Elige una pregunta del menú y te la contesto.\n\n' +
      'Muévete con el ratón o con las flechas ↑/↓ y pulsa Enter.';
    paginas = paginar(textoActual);
    muestraPagina(0, false);

    // Repaginar cuando la fuente real ya está disponible (evita el recorte del
    // texto medido con la fuente de reserva) y al rotar/redimensionar.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(reflow);
    }
    let tReflow = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(tReflow);
      tReflow = window.setTimeout(reflow, 150);
    });
  });
})();

/*
 * Música de fondo de /sobre-mi/.
 *
 * Muchos navegadores bloquean el autoplay con sonido hasta que el usuario
 * interactúa con la página, así que intentamos arrancar en carga y, si nos
 * lo rechazan, volvemos a intentarlo en el primer gesto (click/tecla). El
 * botón silencia/reactiva y el slider ajusta el volumen; ambas preferencias
 * se recuerdan en localStorage entre visitas.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const control = document.querySelector('[data-musica]');
    if (!control) return;

    const audio = control.querySelector('[data-musica-audio]');
    const btn = control.querySelector('[data-musica-toggle]');
    const icono = control.querySelector('[data-musica-icono]');
    const slider = control.querySelector('[data-musica-volumen]');
    if (!audio || !btn || !icono || !slider) return;

    const cajaSlider = control.querySelector('.musica-slider-caja');

    // iOS Safari (y algún WebView) tratan audio.volume como solo lectura: el
    // slider no cambiaría nada y parecería roto. Lo detectamos escribiendo un
    // valor y viendo si "cuaja"; si no, ocultamos el slider y dejamos solo el
    // botón de silencio, que sí funciona en todas partes.
    audio.volume = 0.375;
    const volumenAjustable = Math.abs(audio.volume - 0.375) < 0.02;
    if (!volumenAjustable && cajaSlider) cajaSlider.style.display = 'none';

    const CLAVE_VOL = 'sobremi-musica-vol';
    const CLAVE_MUTE = 'sobremi-musica-mute';

    // Restaura preferencias (volumen y estado de silencio).
    let vol = parseFloat(localStorage.getItem(CLAVE_VOL));
    if (isNaN(vol)) vol = slider.value / 100;
    vol = Math.min(1, Math.max(0, vol));

    audio.volume = vol;
    audio.muted = localStorage.getItem(CLAVE_MUTE) === '1';
    slider.value = Math.round(vol * 100);

    control.hidden = false;

    // Refleja el estado en el icono, el aria y la clase de estilo.
    function pinta() {
      const off = audio.muted || audio.volume === 0;
      icono.textContent = off
        ? 'volume_off'
        : audio.volume < 0.5
        ? 'volume_down'
        : 'volume_up';
      btn.setAttribute('aria-pressed', off ? 'true' : 'false');
      btn.setAttribute('aria-label', off ? 'Activar música' : 'Silenciar música');
      control.classList.toggle('musica-silenciada', off);
    }

    function intentaPlay() {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          /* autoplay bloqueado: esperamos un gesto del usuario */
        });
      }
    }

    // Primer gesto en cualquier parte de la página: reintenta el arranque.
    function arranquePorGesto() {
      if (!audio.muted) intentaPlay();
      window.removeEventListener('pointerdown', arranquePorGesto);
      window.removeEventListener('keydown', arranquePorGesto);
    }

    btn.addEventListener('click', function () {
      audio.muted = !audio.muted;
      if (!audio.muted && audio.paused) intentaPlay();
      localStorage.setItem(CLAVE_MUTE, audio.muted ? '1' : '0');
      pinta();
    });

    slider.addEventListener('input', function () {
      const v = slider.value / 100;
      audio.volume = v;
      // Subir el volumen desde 0 reactiva el sonido de forma natural.
      if (v > 0 && audio.muted) audio.muted = false;
      if (v > 0 && audio.paused) intentaPlay();
      localStorage.setItem(CLAVE_VOL, String(v));
      localStorage.setItem(CLAVE_MUTE, audio.muted ? '1' : '0');
      pinta();
    });

    // Tras ajustar el volumen con el ratón/táctil, soltamos el foco del slider:
    // si se quedara enfocado, se tragaría las flechas ↑/↓ que controlan el
    // cursor del menú de preguntas (el manejador del menú ignora los inputs).
    // Los usuarios de teclado que llegan con Tab conservan el control con flechas.
    slider.addEventListener('pointerup', function () { slider.blur(); });

    // El navegador puede cambiar volumen/mute por su cuenta; mantén el icono.
    audio.addEventListener('volumechange', pinta);

    pinta();
    if (!audio.muted) intentaPlay();
    window.addEventListener('pointerdown', arranquePorGesto);
    window.addEventListener('keydown', arranquePorGesto);
  });
})();
