#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# gym-management-app — phpMyAdmin installer (optional, run once)
#
# Installs phpMyAdmin as its OWN nginx server block on port 8081 — kept
# completely separate from conf.d/gym.conf (the app's site), which
# deploy.sh regenerates from scratch on every redeploy and would silently
# wipe out any phpMyAdmin config added directly into it.
#
# Protected by HTTP Basic Auth (on top of phpMyAdmin's own login form)
# since this runs over plain HTTP (no TLS yet) and is reachable from the
# whole internet once you open the port.
#
# HOW TO RUN:
#   chmod +x install-phpmyadmin.sh
#   sudo ./install-phpmyadmin.sh
#
# Then open port 8081 in the instance's Security Group (same way you
# opened port 80 — Type: Custom TCP, Port: 8081, Source: Anywhere-IPv4,
# or better, your own IP only if it's static) and browse to:
#   http://<public-ip>:8081/
# Log in with the Basic Auth prompt first, then phpMyAdmin's own login —
# use the gym_app / <password> from /root/gym_db_credentials.txt (that DB
# user is scoped to just the gym_management database, which is all you
# need to browse the app's data).
# ---------------------------------------------------------------------------
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this with sudo: sudo ./install-phpmyadmin.sh" >&2
  exit 1
fi

echo "==> Installing phpMyAdmin + apache2-utils (for htpasswd)"
export DEBIAN_FRONTEND=noninteractive
# Preseed: don't let the package try to auto-configure a web server (we
# wire up nginx ourselves below) or set up its own tracking database.
debconf-set-selections <<< "phpmyadmin phpmyadmin/dbconfig-install boolean false"
debconf-set-selections <<< "phpmyadmin phpmyadmin/reconfigure-webserver multiselect none"
apt-get update -y
apt-get install -y phpmyadmin apache2-utils

echo "==> Generating phpMyAdmin config (fresh blowfish secret)"
SECRET="$(openssl rand -base64 32 | tr -d '\n=')"
cp /usr/share/phpmyadmin/config.sample.inc.php /etc/phpmyadmin/config.inc.php
sed -i "s#\$cfg\['blowfish_secret'\] = '';#\$cfg['blowfish_secret'] = '${SECRET}';#" /etc/phpmyadmin/config.inc.php

echo "==> Setting up HTTP Basic Auth"
HTPASSWD_FILE=/etc/nginx/.htpasswd-phpmyadmin
if [ ! -f "$HTPASSWD_FILE" ]; then
  BASIC_USER=admin
  BASIC_PASS="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)"
  htpasswd -cb "$HTPASSWD_FILE" "$BASIC_USER" "$BASIC_PASS"
  echo "$BASIC_USER:$BASIC_PASS" > /root/phpmyadmin_basic_auth.txt
  chmod 600 /root/phpmyadmin_basic_auth.txt
  PRINT_CREDS=1
else
  echo "  (htpasswd file already exists — leaving it as-is; see /root/phpmyadmin_basic_auth.txt for the original credentials, or run 'sudo htpasswd $HTPASSWD_FILE <user>' to add/change one)"
  PRINT_CREDS=0
fi

echo "==> Installing nginx site (port 8081)"
cat > /etc/nginx/conf.d/phpmyadmin.conf <<'NGINX'
server {
    listen 8081;
    server_name _;

    root /usr/share/phpmyadmin;
    index index.php;

    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd-phpmyadmin;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
NGINX

nginx -t
systemctl reload nginx

echo ""
echo "======================================================================"
echo " phpMyAdmin installed."
echo ""
if [ "$PRINT_CREDS" = "1" ]; then
  echo " HTTP Basic Auth (first prompt in the browser):"
  echo "   Username: $BASIC_USER"
  echo "   Password: $BASIC_PASS"
  echo " (also saved to /root/phpmyadmin_basic_auth.txt, root-only)"
  echo ""
fi
echo " phpMyAdmin login (second prompt, the actual page):"
echo "   Use the gym_app user from /root/gym_db_credentials.txt"
echo "   (cat /root/gym_db_credentials.txt to see it)"
echo ""
echo " NEXT STEP: open port 8081 in the EC2 Security Group, then visit:"
echo "   http://<this-instance-public-ip>:8081/"
echo "======================================================================"
