# manuelgraya — Landing page

Landing page estática con estética pixel art, diseñada en Google Stitch y
construida con HTML + Tailwind CSS (compilado, sin CDN ni JS en producción).

## Desarrollo local

```sh
npm install          # una vez
npm run watch        # recompila css/output.css al editar
npm run serve        # sirve en http://localhost:8080
```

El CSS compilado (`css/output.css`) **se commitea** — así el servidor no
necesita Node ni build: solo sirve archivos estáticos.

Antes de commitear cambios de estilos: `npm run build`.

## Despliegue (push to deploy)

El deploy es un `git push` a un remote privado (`production`): un repo bare
en el servidor cuyo hook `post-receive` hace checkout de `main` en el web
root que sirve nginx.

```sh
git push production main   # esto ES el deploy
```

### Aprovisionamiento de un servidor (solo la primera vez)

1. Autoriza tu clave SSH en el servidor: `ssh-copy-id <usuario>@<servidor>`
2. Copia y ejecuta el script de setup en el servidor:
   ```sh
   scp deploy/setup-server.sh deploy/post-receive <servidor>:/tmp/
   ssh <servidor> 'sh /tmp/setup-server.sh'
   ```
3. Añade el remote y haz el primer push:
   ```sh
   git remote add production <usuario>@<servidor>:repos/landing.git
   git push -u production main
   ```
4. Configura nginx (o similar) para servir el web root como sitio estático.
