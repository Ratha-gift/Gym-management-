#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# gym-management-app — deploy / redeploy script
#
# Run this AFTER server-setup.sh has been run once. Safe to re-run any time
# you push new commits — it pulls latest code from both repos and rebuilds.
#
# HOW TO RUN (in the same EC2 Instance Connect browser terminal):
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# First run only: it copies backend.env.production.example /
# frontend.env.production.example next to this script into place as the
# real .env files, filling in the DB password server-setup.sh generated and
# the instance's own public IP. Edit those two committed *.example files
# first if you need to change anything (mail settings, a real domain
# instead of the IP, etc.) — this script won't overwrite a .env that
# already exists, so edits to a live .env stick across redeploys.
# ---------------------------------------------------------------------------
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this with sudo: sudo ./deploy.sh" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FRONTEND_REPO="https://github.com/Ratha-gift/Gym-management-.git"
BACKEND_REPO="https://github.com/Ratha-gift/Gym-management--back-.git"
FRONTEND_DIR="/var/www/gym-frontend"
BACKEND_DIR="/var/www/gym-backend"

if command -v apt-get >/dev/null 2>&1; then
  WEB_USER=www-data; WEB_GROUP=www-data; PHP_FPM_SOCK="/run/php/php8.4-fpm.sock"
elif command -v dnf >/dev/null 2>&1; then
  WEB_USER=nginx; WEB_GROUP=nginx; PHP_FPM_SOCK="/run/php-fpm/www.sock"
else
  echo "Unsupported OS." >&2; exit 1
fi

# ---------------------------------------------------------------------------
# Detect this instance's public IP (used as APP_URL / VITE_API_URL unless
# you've pointed a real domain at it — see the two .env.production files).
# ---------------------------------------------------------------------------
TOKEN="$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")"
PUBLIC_IP="$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "==> Detected public IP: ${PUBLIC_IP}"

# ---------------------------------------------------------------------------
# 1. Fetch code
# ---------------------------------------------------------------------------
clone_or_pull() {
  local repo="$1" dir="$2"
  if [ -d "$dir/.git" ]; then
    echo "==> Pulling latest into $dir"
    git -C "$dir" pull --ff-only
  else
    echo "==> Cloning $repo into $dir"
    git clone "$repo" "$dir"
  fi
}
clone_or_pull "$BACKEND_REPO" "$BACKEND_DIR"
clone_or_pull "$FRONTEND_REPO" "$FRONTEND_DIR"

# ---------------------------------------------------------------------------
# 2. Backend (Laravel)
# ---------------------------------------------------------------------------
echo "==> Backend: composer install"
cd "$BACKEND_DIR"
# Invoke composer via php8.4 explicitly rather than the bare `composer`
# command — composer.lock has transitive deps (symfony/css-selector, a
# Laravel Mail dependency) that require PHP >=8.4.1, and on a box with more
# than one PHP version installed, plain `composer` can resolve through
# whichever `php` happens to come first on PATH. Explicit avoids that
# ambiguity regardless of PATH order.
php8.4 "$(command -v composer)" install --no-dev --optimize-autoloader --no-interaction
PHP=php8.4   # same reasoning below: pin artisan to 8.4 too, not just composer

if [ ! -f .env ]; then
  echo "==> Backend: creating .env from template"
  # Pull the DB password server-setup.sh generated, so you never have to
  # type/paste a secret by hand.
  # shellcheck disable=SC1091
  source /root/gym_db_credentials.txt
  sed \
    -e "s#{{APP_URL}}#http://${PUBLIC_IP}#g" \
    -e "s#{{DB_DATABASE}}#${DB_DATABASE}#g" \
    -e "s#{{DB_USERNAME}}#${DB_USERNAME}#g" \
    -e "s#{{DB_PASSWORD}}#${DB_PASSWORD}#g" \
    "$SCRIPT_DIR/backend.env.production.example" > .env
fi

$PHP artisan key:generate --force
# Only generate a JWT secret the first time — running this on every deploy
# would rotate it and invalidate every already-issued login token.
if ! grep -q "^JWT_SECRET=.\+" .env; then
  $PHP artisan jwt:secret --force
fi

$PHP artisan migrate --force
$PHP artisan storage:link || true
$PHP artisan config:cache
$PHP artisan route:cache
$PHP artisan view:cache

chown -R "${WEB_USER}:${WEB_GROUP}" "$BACKEND_DIR"
chmod -R 775 "$BACKEND_DIR/storage" "$BACKEND_DIR/bootstrap/cache"

# ---------------------------------------------------------------------------
# 3. Frontend (Vite/React)
# ---------------------------------------------------------------------------
echo "==> Frontend: npm ci && build"
cd "$FRONTEND_DIR"

if [ ! -f .env.production ]; then
  sed -e "s#{{API_URL}}#http://${PUBLIC_IP}/api#g" \
    "$SCRIPT_DIR/frontend.env.production.example" > .env.production
fi

npm ci
npm run build   # outputs to $FRONTEND_DIR/dist

chown -R "${WEB_USER}:${WEB_GROUP}" "$FRONTEND_DIR/dist"

# ---------------------------------------------------------------------------
# 4. Nginx site config
# ---------------------------------------------------------------------------
echo "==> Installing nginx config"
sed \
  -e "s#{{BACKEND_PUBLIC}}#${BACKEND_DIR}/public#g" \
  -e "s#{{FRONTEND_DIST}}#${FRONTEND_DIR}/dist#g" \
  -e "s#{{PHP_FPM_SOCK}}#${PHP_FPM_SOCK}#g" \
  "$SCRIPT_DIR/nginx-gym.conf" > /etc/nginx/conf.d/gym.conf

# Ubuntu ships an nginx "default" site listening on :80 too — remove it so
# it doesn't clash with ours.
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo ""
echo "======================================================================"
echo " Deployed."
echo "   Frontend : http://${PUBLIC_IP}/"
echo "   API      : http://${PUBLIC_IP}/api/..."
echo ""
echo " Re-run this script any time after pushing new commits to redeploy."
echo "======================================================================"
