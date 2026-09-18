#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# gym-management-app — EC2 server bootstrap (run ONCE per fresh instance)
#
# HOW TO RUN:
#   1. AWS Console → EC2 → Instances → select "web server" → Connect
#      → "EC2 Instance Connect" tab → Connect (opens a browser terminal).
#   2. Paste this whole file into a file on the server, e.g.:
#         nano server-setup.sh      # paste, Ctrl+O, Enter, Ctrl+X
#   3. Run it:
#         chmod +x server-setup.sh
#         sudo ./server-setup.sh
#   4. SAVE the MySQL app-user password it prints at the end — you'll need
#      it for backend.env.production in the next step (deploy.sh).
#
# Works on both Ubuntu (apt) and Amazon Linux 2023 (dnf) — it detects which
# one you're on. t2.micro only has 1GB RAM, so this also adds a 1GB swap
# file: without it, `composer install` / `npm run build` can get OOM-killed.
# ---------------------------------------------------------------------------
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this with sudo: sudo ./server-setup.sh" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Swap file (t2.micro = 1GB RAM only)
# ---------------------------------------------------------------------------
if [ ! -f /swapfile ]; then
  echo "==> Creating 1GB swap file"
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  echo "==> Swap file already exists, skipping"
fi

# ---------------------------------------------------------------------------
# 2. Install packages (OS-detected)
# ---------------------------------------------------------------------------
if command -v apt-get >/dev/null 2>&1; then
  echo "==> Detected Ubuntu/Debian (apt)"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y software-properties-common curl git unzip nginx mariadb-server \
    php8.2 php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring php8.2-xml \
    php8.2-curl php8.2-zip php8.2-gd php8.2-bcmath || {
      # Ubuntu 22.04's default repo may not have php8.2 — add ondrej PPA and retry
      add-apt-repository -y ppa:ondrej/php
      apt-get update -y
      apt-get install -y php8.2 php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring \
        php8.2-xml php8.2-curl php8.2-zip php8.2-gd php8.2-bcmath
    }
  PHP_FPM_SERVICE=php8.2-fpm
  WEB_USER=www-data
  WEB_GROUP=www-data

  # Node.js 20 LTS (needed once, to build the React frontend)
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs

elif command -v dnf >/dev/null 2>&1; then
  echo "==> Detected Amazon Linux (dnf)"
  dnf update -y
  dnf install -y git unzip nginx mariadb1011-server \
    php8.2 php8.2-fpm php8.2-cli php8.2-mysqlnd php8.2-mbstring php8.2-xml \
    php8.2-curl php8.2-zip php8.2-gd php8.2-bcmath nodejs20
  PHP_FPM_SERVICE=php-fpm
  WEB_USER=nginx
  WEB_GROUP=nginx
else
  echo "Unsupported OS — neither apt nor dnf found." >&2
  exit 1
fi

# Composer (PHP dependency manager)
if ! command -v composer >/dev/null 2>&1; then
  echo "==> Installing Composer"
  curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# ---------------------------------------------------------------------------
# 3. Enable & start services
# ---------------------------------------------------------------------------
systemctl enable --now mariadb
systemctl enable --now "$PHP_FPM_SERVICE"
systemctl enable --now nginx

# ---------------------------------------------------------------------------
# 4. Create the app database + user (random password, printed at the end)
# ---------------------------------------------------------------------------
DB_NAME="gym_management"
DB_USER="gym_app"
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"

mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

# Persist it locally on the server so deploy.sh can read it automatically —
# root-only readable, never printed again after this run.
install -m 600 /dev/null /root/gym_db_credentials.txt
{
  echo "DB_DATABASE=${DB_NAME}"
  echo "DB_USERNAME=${DB_USER}"
  echo "DB_PASSWORD=${DB_PASS}"
} > /root/gym_db_credentials.txt

mkdir -p /var/www
chown -R "${WEB_USER}:${WEB_GROUP}" /var/www

echo ""
echo "======================================================================"
echo " Server setup complete."
echo ""
echo " Database created:"
echo "   DB_DATABASE=${DB_NAME}"
echo "   DB_USERNAME=${DB_USER}"
echo "   DB_PASSWORD=${DB_PASS}"
echo ""
echo " (Also saved to /root/gym_db_credentials.txt, root-only — deploy.sh"
echo " reads it automatically, so you don't have to copy it by hand.)"
echo ""
echo " PHP-FPM service : ${PHP_FPM_SERVICE}"
echo " Web user         : ${WEB_USER}"
echo ""
echo " Next: run deploy.sh to pull the code, configure .env, and go live."
echo "======================================================================"
