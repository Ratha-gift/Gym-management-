# Deploying gym-management-app to EC2

One-time setup, then a one-command redeploy any time you push new commits.
Everything below runs **on the server**, in the browser terminal you get
from AWS Console → EC2 → Instances → select the instance → **Connect** →
**EC2 Instance Connect** tab → **Connect**. No SSH key needed.

## 1. First time only

```bash
git clone https://github.com/Ratha-gift/Gym-management-.git
cd Gym-management-/deploy
chmod +x server-setup.sh deploy.sh

sudo ./server-setup.sh   # installs nginx, PHP 8.4, MariaDB, Node, Composer,
                          # creates the app database + user, adds swap
sudo ./deploy.sh         # clones+builds both repos, writes .env files,
                          # runs migrations, wires up nginx
```

`server-setup.sh` prints a generated database password at the end and
saves it to `/root/gym_db_credentials.txt` (root-only) — `deploy.sh` reads
it from there automatically, so you never have to copy it by hand.

When `deploy.sh` finishes it prints the URLs, e.g.:

```
Frontend : http://52.220.42.228/
API      : http://52.220.42.228/api/...
```

Open the Frontend URL in a browser — that's the live app.

## 2. Every time after (redeploying new commits)

Push your changes to GitHub as usual, then on the server:

```bash
cd ~/Gym-management-/deploy
sudo ./deploy.sh
```

It pulls both repos, rebuilds, re-runs migrations, and reloads nginx.
Existing `.env` / `.env.production` files are **not** overwritten, so any
manual edits you made on the server survive redeploys.

## Before any of this: open port 80 in the Security Group

The instance's Security Group must allow inbound **HTTP (port 80)** from
`0.0.0.0/0`, or the frontend won't be reachable from your browser at all
(port 22 for Instance Connect is presumably already open, since you used
it to get here). AWS Console → EC2 → Instances → instance → **Security**
tab → the Security Group link → **Edit inbound rules** → **Add rule** →
Type: HTTP, Source: Anywhere-IPv4.

## What this sets up

- **nginx** on port 80: serves the built React app (`gym-frontend/dist`)
  for everything, and proxies `/api/...` to the Laravel backend via
  PHP-FPM. See `nginx-gym.conf`.
- **MariaDB**: one database (`gym_management`) + one app-scoped user
  (not root) created by `server-setup.sh`.
- **Laravel** (`backend-Gym`) at `/var/www/gym-backend`, `APP_ENV=production`,
  `APP_DEBUG=false`. `APP_KEY` and `JWT_SECRET` are generated directly on
  the server (`php artisan key:generate` / `jwt:secret`) — never typed into
  any file in this repo.
- **React build** (`gym-management-app`) at `/var/www/gym-frontend/dist`,
  built with `VITE_API_URL` pointing at this instance's own public IP
  (auto-detected via EC2 metadata) so the frontend and API work together
  out of the box with zero manual config.

## If your repos are private

`git clone`/`git pull` over plain HTTPS (as these scripts do) needs the
repo to be public, or a GitHub Personal Access Token. If you get an auth
prompt/failure, either make the repos public, or before running
`deploy.sh` configure a credential once:

```bash
git config --global credential.helper store
git clone https://github.com/Ratha-gift/Gym-management-.git
# paste your GitHub username + a PAT (as the password) when prompted —
# it's remembered for the pulls deploy.sh does afterwards
```

## Once you have a real domain (optional, later)

Right now everything points at the instance's raw public IP. To switch to
a domain:

1. Point the domain's DNS A record at the Elastic IP.
2. Edit `backend.env.production.example`'s and
   `frontend.env.production.example`'s `{{APP_URL}}` / `{{API_URL}}`
   substitution isn't needed — instead, edit the already-generated
   `backend-Gym/.env` (`APP_URL=`) and `gym-management-app/.env.production`
   (`VITE_API_URL=`) directly on the server to the domain, then:
   ```bash
   cd ~/Gym-management-/deploy && sudo ./deploy.sh
   ```
   (rebuild is required — Vite bakes `VITE_API_URL` into the JS at build
   time).
3. Optionally add HTTPS: `sudo apt-get install -y certbot python3-certbot-nginx`
   (or `dnf install certbot python3-certbot-nginx` on Amazon Linux), then
   `sudo certbot --nginx -d yourdomain.com`.
