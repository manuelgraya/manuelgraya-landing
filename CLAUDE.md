# manuelgraya-landing

Landing page personal de Manuel Graya con estética pixel art. Página única
estática: HTML + Tailwind CSS compilado. Sin frameworks, sin JS en producción.
El diseño original se hizo en Google Stitch (proyecto "Pixel Art Developer
Portfolio") y se adaptó a build local.

## Estructura

- `index.html` — toda la página (hero con terminal animada, Proyectos, Sobre Mí, footer)
- `src/input.css` — directivas Tailwind + clases custom (`.pixel-border`, `.pixel-button`, `.terminal-container`, `.cursor`)
- `css/output.css` — CSS compilado y minificado. **Se commitea**: el servidor no tiene Node y sirve estáticos tal cual
- `tailwind.config.js` — tema del diseño: paleta Material-style (tonos madera/pergamino + verde terminal), `borderRadius: 0` (pixel art), fuentes monoespaciadas
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
