#!/bin/sh
# Aprovisionamiento del servidor (ejecutar UNA vez en el servidor).
# Crea el repo bare y el directorio web, e instala el hook post-receive.
# El web root (/srv/landing) y el servidor web (nginx/caddy) se
# configuran aparte — ver README.md.
set -e

WEB_ROOT="/srv/landing"
REPO_DIR="$HOME/repos/landing.git"

mkdir -p "$REPO_DIR"
git init --bare "$REPO_DIR"

sudo mkdir -p "$WEB_ROOT"
sudo chown "$USER:$USER" "$WEB_ROOT"

cp "$(dirname "$0")/post-receive" "$REPO_DIR/hooks/post-receive"
chmod +x "$REPO_DIR/hooks/post-receive"

echo "Listo. Desde tu máquina local:"
echo "  git remote add production $USER@$(hostname -I | awk '{print $1}'):repos/landing.git"
echo "  git push production main"
