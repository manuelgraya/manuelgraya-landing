// Pega los parciales de src/partials/ entre sus marcadores en cada página,
// para que header y footer sean idénticos en todas las vistas.
// Se ejecuta como parte de `npm run build`.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const paginas = ['index.html', '404.html', 'sobre-mi/index.html', 'proyectos/index.html', 'contacto/index.html'];
const parciales = [
  { archivo: 'header.html', marcador: 'header-comun' },
  { archivo: 'footer.html', marcador: 'footer-comun' },
];

for (const { archivo, marcador } of parciales) {
  const parcial = fs
    .readFileSync(path.join(__dirname, 'partials', archivo), 'utf8')
    .trim();
  const INICIO = `<!-- ${marcador} -->`;
  const FIN = `<!-- /${marcador} -->`;

  for (const pagina of paginas) {
    const ruta = path.join(raiz, pagina);
    const html = fs.readFileSync(ruta, 'utf8');
    const a = html.indexOf(INICIO);
    const b = html.indexOf(FIN);
    if (a === -1 || b === -1 || b < a) {
      console.error(`${pagina}: faltan los marcadores ${INICIO} … ${FIN}`);
      process.exitCode = 1;
      continue;
    }
    const nuevo =
      html.slice(0, a) + INICIO + '\n' + parcial + '\n' + FIN + html.slice(b + FIN.length);
    if (nuevo !== html) {
      fs.writeFileSync(ruta, nuevo);
      console.log(`${pagina}: ${marcador} actualizado`);
    }
  }
}
