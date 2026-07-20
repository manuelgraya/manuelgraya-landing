# manuelgraya-landing

Landing page personal de Manuel Graya con estética pixel art. Web estática:
HTML + Tailwind CSS compilado, sin frameworks. El JS de producción se limita
a `js/contacto.js` (formulario de contacto) y `js/shader.js` (fondo WebGL
decorativo del index); el resto de interactividad es CSS-only
(:target/checkbox). El diseño original se hizo en Google Stitch
(proyecto "Pixel Art Developer Portfolio") y se adaptó a build local.

## Estructura

- `index.html` — página principal (hero con terminal animada, Proyectos, Sobre Mí, footer)
- `sobre-mi/index.html` — página /sobre-mi/ (trayectoria, expertise, workflow, valores), adaptada del mockup de Stitch "manuelgraya - Sobre Mí"
- `proyectos/index.html` — página /proyectos/ (listado detallado de proyectos + terminal de stats), adaptada del mockup de Stitch "manuelgraya - Proyectos" con los proyectos reales del index. Comparte con /sobre-mi/ los overrides tipográficos de input.css (clase `pagina-proyectos` en el body). El enlace "Proyectos" del nav apunta aquí (antes al anchor /#proyectos)
- `src/input.css` — directivas Tailwind + clases custom (`.pixel-border`, `.pixel-button`, `.terminal-container`, `.cursor`) + overrides tipográficos de /sobre-mi/ y estados activos del nav
- `src/partials/` — **único sitio donde se editan header y footer** (`header.html`, `footer.html`). `npm run build` ejecuta `src/inyectar-partials.js`, que los pega idénticos entre los marcadores `<!-- header-comun -->` / `<!-- footer-comun -->` de index, 404, sobre-mi y proyectos. No editarlos inline en las páginas: el build lo machaca. El enlace activo por página se marca vía CSS (clase `pagina-sobre-mi` en el body)
- `css/output.css` — CSS compilado y minificado. **Se commitea**: el servidor no tiene Node y sirve estáticos tal cual. nginx lo sirve sin Cache-Control y los navegadores cachean versiones viejas: al cambiar estilos hay que subir el `?v=` del `<link>` de output.css en TODOS los html. **OJO con el HTML**: los `.html` NO tienen cache-busting (no llevan `?v=`), así que tras desplegar un cambio de contenido/markup el navegador puede seguir mostrando la página vieja del live; para verificar en el servidor hay que forzar recarga (Ctrl+Shift+R). Si un cambio "no aparece" desplegado, sospechar de esto antes de tocar código
- `tailwind.config.js` — tema del diseño: paleta Material-style (tonos madera/pergamino + verde terminal), `borderRadius: 0` (pixel art), fuentes monoespaciadas
- `api/contacto.py` — backend del formulario de contacto (Python stdlib, sin dependencias): sirve el captcha aritmético (token HMAC sin estado), valida, limita por IP y envía el correo por SMTP de Gmail. Configuración por variables de entorno; las credenciales viven SOLO en el servidor (`.env` del servicio systemd, ver CLAUDE.local.md). Corre como servicio systemd detrás de nginx (`location /api/contacto`); tras cambiarlo hay que reiniciar el servicio en el servidor
- `js/shader.js` — fondo animado de TODAS las páginas: shader WebGL de Stitch (rejilla pixel pulsante con scanline) en un canvas fijo tras el contenido (`.fondo-shader`). Con prefers-reduced-motion pinta un solo fotograma; sin WebGL se quita el canvas. Las pantallas de carga (`.cargador`, SVG SMIL + tecleo) son CSS-only: la del index (~1.5s) retrasa el arranque del efecto TV del hero; las rutas interiores usan `.cargador-breve` (~0.9s, texto propio por página) y su `<main class="entra-pagina">` sube al apagarse. La 404 solo lleva el fondo
- `js/contacto.js` — JS del formulario de contacto: pide el captcha, envía el formulario por fetch a `/api/contacto` y muestra la notificación estilo terminal (`.aviso-toast.aviso-visible`, mismo estilo que el aviso CSS-only de "código privado"). Los formularios se marcan con `data-contacto`. Al cambiarlo, subir el `?v=` del `<script>` en index y contacto
- `assets/` — imágenes descargadas del mockup (los enlaces de googleusercontent de Stitch caducan; nunca enlazar a ellos)
- `deploy/` — scripts de aprovisionamiento del servidor (referencia; ya ejecutados)

## Desarrollo

```sh
npm install        # una vez (tailwindcss v3, solo devDependency)
npm run watch      # recompila css/output.css al editar
npm run serve      # http://localhost:8080
npm run build      # build minificado — OBLIGATORIO antes de commitear cambios de estilos
```

Tailwind es **v3** (config JS clásica). No migrar a v4 sin decidirlo expresamente.

Tailwind purga las clases no usadas, así que `output.css` solo contiene las
utilidades presentes en el HTML/partials. Al editar markup:

- Si **reutilizas** clases que ya existen en `output.css`, NO hace falta
  recompilar ni subir el `?v=`. Para comprobarlo: `grep 'nombre-clase' css/output.css`
- Si **introduces una clase nueva** (p. ej. `self-start` si no estaba), hay que
  `npm run build` y subir el `?v=` de output.css en todos los html. Preferir
  reutilizar clases ya compiladas cuando el resultado visual es equivalente

Fuentes: Google Fonts (Press Start 2P, VT323, Space Mono, JetBrains Mono,
Material Symbols Outlined). Los iconos son ligaduras de Material Symbols.

## Despliegue (push to deploy)

- `git push production main` ES el deploy: el remote `production` es un repo
  bare en el servidor cuyo hook `post-receive` publica `main` en el web root
  servido por nginx. No hay build remoto
- Remote `origin` = GitHub (`manuelgraya/manuelgraya-landing`, público) — solo copia del código, no despliega
- Los datos concretos del servidor (host, usuario, rutas, puertos) están en
  `CLAUDE.local.md`, que NO se versiona por privacidad

## Convenciones

- Commits en español, sin trailer de coautoría (Co-Authored-By)
- Contenido de la web en español
- No poner IPs, usuarios ni detalles del servidor en archivos versionados
- **Tarjetas de proyecto duplicadas**: los proyectos aparecen en `index.html` (3 destacados en la sección Proyectos) y en `proyectos/index.html` (listado completo). NO son partials (los partials solo cubren header/footer), así que al añadir/editar/quitar un proyecto hay que tocar **las dos páginas a mano** y mantenerlas coherentes
- **Badge Público/Privado + aviso de código privado**: cada tarjeta lleva un badge `Público` (icono `lock_open`, `bg-secondary-container`) o `Privado` (icono `lock`, `bg-error-container`). Los proyectos privados apuntan su botón "Código" a `#aviso-codigo-privado`, un toast de error CSS-only (patrón `.aviso-ancla:target + .aviso-toast`, "ERROR.LOG / ACCESO_DENEGADO") replicado al final del `<main>` de index y proyectos. Al replicar tarjetas hay que mantener este mismo patrón
