# VPS Deployment Skill

## Context

Sam has a Hostinger KVM1 VPS (Ubuntu 24.04, IP: 187.124.67.117, user: sam) running multiple projects with shared infrastructure. This skill contains the patterns, lessons learned, and playbook for deploying new projects to this VPS.

## VPS Architecture

```
~/apps/
├── infra/                          # Shared services (PostgreSQL, Nginx, Certbot)
│   ├── docker-compose.yml
│   ├── .env
│   ├── pg-init/
│   │   └── 01-create-databases.sh
│   └── nginx/conf.d/
│       ├── fincherry.conf
│       ├── surpride.conf
│       └── recordoc.conf
├── fincherry/                      # FinCherry app (Fastify + React, PostgreSQL)
├── surpride/                       # Surpride app (Fastify + React, SQLite)
└── recordoc/                       # recordoc app (Fastify + React, PostgreSQL)
```

### Shared Infrastructure
- **Network:** `infra-net` — all project containers join this Docker network
- **PostgreSQL 16:** container `infra-db`, accessible at `infra-db:5432` from any container on `infra-net`. Host-level access at `127.0.0.1:5432`. One instance, multiple databases (one per project).
- **Nginx:** container `infra-nginx`, reverse proxy with per-project `.conf` files in `~/apps/infra/nginx/conf.d/`. Serves static SPAs from Docker volumes.
- **Certbot:** container `infra-certbot`, auto-renews SSL certs every 12h. Certs stored in `infra_certbot_conf` volume.
- **SSH:** key-based auth only (password disabled), user `sam` with sudo. Deploy key at `~/.ssh/deploy_key` used by GitHub Actions.

## Deploying a New Project — Checklist

### Files to Create in the Repo

1. **`Dockerfile.prod`** — Multi-stage build. Everything builds inside Docker (no Node/pnpm on host).
   - `base` stage: install deps + copy source
   - `web-build` stage: build SPA
   - `api-build` stage: compile TypeScript API
   - `deps-prod` stage: production dependencies with native modules compiled
   - `api` stage: final slim image with compiled code + prod deps

2. **`docker-compose.prod.yml`** — Production compose file.
   - `api` service: always-on, joins `infra-net`, `restart: unless-stopped`
   - `web-assets` service: `profiles: [tools]`, one-shot, copies SPA to nginx volume
   - `worker` service (if needed): always-on, joins `infra-net`
   - Volumes declared as external with explicit `name:` to prevent prefix issues

3. **`scripts/deploy.sh`** — Deploy script called by GitHub Actions:
   ```bash
   git pull origin main
   docker compose -f docker-compose.prod.yml build
   docker compose -f docker-compose.prod.yml run --rm web-assets
   docker compose -f docker-compose.prod.yml run --rm migrate  # if applicable
   docker compose -f docker-compose.prod.yml up -d api worker
   docker exec infra-nginx nginx -s reload
   # health check loop
   docker image prune -f
   ```

4. **`.github/workflows/deploy.yml`** — CI + auto-deploy on push to main.
   - Job 1: CI (typecheck, lint, build)
   - Job 2: Deploy (SSH via `appleboy/ssh-action@v1`, runs `cd ~/apps/<project> && bash scripts/deploy.sh`)
   - Concurrency group to prevent parallel deploys
   - Uses `VPS_SSH_KEY` secret

5. **`nginx/<project>.conf`** — Nginx server block (HTTP→HTTPS redirect, API proxy, SPA static files)

6. **`.env.production.example`** — Documents required env vars

### VPS One-Time Setup Steps

1. **DNS:** Add A record `subdomain.domain.com → 187.124.67.117`. Wait for propagation (`dig` returns correct IP). If migrating from Railway/Vercel, delete any existing ALIAS/CNAME records first — they take priority over A records.

2. **SSL cert:**
   ```bash
   docker stop infra-nginx
   docker run --rm -p 80:80 \
     -v infra_certbot_conf:/etc/letsencrypt \
     certbot/certbot certonly \
     --standalone \
     -d <domain> \
     --email samantafluture@gmail.com \
     --agree-tos --no-eff-email
   docker start infra-nginx
   ```

3. **Create volume:** `docker volume create <project>_web`

4. **Clone repo:** `git clone https://TOKEN@github.com/samantafluture/<repo>.git ~/apps/<project>` (use HTTPS, not SSH)

5. **Copy nginx config:** `cp ~/apps/<project>/nginx/<project>.conf ~/apps/infra/nginx/conf.d/`

6. **Update infra compose** (`~/apps/infra/docker-compose.yml`):
   - Add `- <project>_web:/usr/share/nginx/<project>:ro` to nginx volumes
   - Add to top-level volumes with explicit name:
     ```yaml
     <project>_web:
       name: <project>_web
     ```
   - **CRITICAL:** Always use `name:` to prevent Docker Compose prefixing the volume name

7. **Restart infra:** `cd ~/apps/infra && docker compose up -d nginx --force-recreate`

8. **Create `.env`:** `cp .env.production.example .env && vim .env && chmod 600 .env`

9. **Fix line endings (if needed):** `sed -i 's/\r$//' scripts/deploy.sh`

10. **First deploy:** `bash scripts/deploy.sh`

11. **If nginx crash-loops** (because it started before API existed): `docker restart infra-nginx`

12. **Add `VPS_SSH_KEY` to GitHub repo** (if separate repo): Settings → Secrets → Actions → paste `~/.ssh/deploy_key`

13. **Add database** (if using shared PostgreSQL):
    ```bash
    docker exec -it infra-db psql -U postgres -c "CREATE USER <project> WITH PASSWORD '<password>';"
    docker exec -it infra-db psql -U postgres -c "CREATE DATABASE <project> OWNER <project>;"
    ```

14. **Add cron jobs:** `crontab -e` — add backup schedule

## Critical Lessons Learned

### Docker Volume Naming (MOST COMMON ISSUE)
Docker Compose prefixes volume names with the project directory name (e.g., `infra_fincherry_web` instead of `fincherry_web`). This causes nginx to read from a different volume than web-assets writes to.

**Fix:** ALWAYS declare volumes with explicit `name:` in BOTH the project compose AND the infra compose:

```yaml
# In project docker-compose.prod.yml
volumes:
  project_web:
    external: true
    name: project_web

# In infra docker-compose.yml
volumes:
  project_web:
    name: project_web
```

**Diagnosis:** If SPA shows stale content after deploy:
```bash
# Check what nginx is actually reading
docker inspect infra-nginx | grep <project>

# Check file timestamps in volume
docker run --rm -v <volume_name>:/data alpine ls -la /data/assets/ | head -5

# List all matching volumes
docker volume ls | grep <project>
```

If you see two volumes (e.g., `project_web` AND `infra_project_web`), you have a mismatch.

### Native Node Modules (better-sqlite3, argon2, etc.)
`pnpm rebuild` silently does nothing in Docker. Use direct node-gyp instead:
```dockerfile
# In deps-prod stage:
RUN apk add --no-cache python3 make g++
RUN pnpm install --frozen-lockfile --prod
RUN cd /app/node_modules/.pnpm/better-sqlite3@X.X.X/node_modules/better-sqlite3 && npx --yes node-gyp rebuild
```

**Diagnosis:** Container crashes with `Cannot find module ... better_sqlite3.node`:
```bash
# Check if the .node file exists
docker run --rm <image> sh -c "find /app/node_modules -name 'better_sqlite3.node'"
# Empty = not compiled
```

### docker restart Does NOT Reload .env
`docker restart` keeps the old environment variables. You must recreate containers:
```bash
# WRONG — keeps old .env values
docker restart myapp-api

# CORRECT — picks up new .env values
docker compose -f docker-compose.prod.yml up -d api
```

### DATABASE_URL Special Characters
- Passwords with `@`, `#`, `<`, `>` or other URL-special characters break connection string parsing
- Generate passwords without special characters: `openssl rand -hex 16`
- Never wrap passwords in angle brackets `<>` in the .env — those are placeholder markers, not part of the value

### Nginx Crash Loop on First Deploy
Nginx fails if it can't resolve an upstream hostname (e.g., `fincherry-api`) that doesn't exist yet. This is expected on first deploy. Solution: deploy the app first, then `docker restart infra-nginx`.

### Line Endings
Scripts created on Windows/WSL may have `\r\n` line endings that break bash:
```bash
sed -i 's/\r$//' scripts/deploy.sh
```
Symptom: `: invalid option namene 2: set: pipefail`

### Git Clone on VPS
Always use HTTPS (not SSH) for cloning on the VPS. Private repos need a GitHub Personal Access Token with `repo` scope:
```bash
git clone https://TOKEN@github.com/user/repo.git
```

### VPS Network Restrictions
The VPS cannot make outbound connections on arbitrary ports. The infra-db container also cannot reach external hosts. If you need to connect to external databases (e.g., pg_dump from Supabase), run the command from your local machine, then `scp` the file to the VPS.

### Database Migration from External Provider (Supabase, etc.)
1. Run `pg_dump` from your **local machine** (VPS may have network restrictions)
2. If IPv6-only host, use the pooler connection (has IPv4)
3. If pg_dump version mismatch: `sudo apt install postgresql-client-<version>` then use `/usr/lib/postgresql/<version>/bin/pg_dump`
4. Upload dump to VPS: `scp dump.sql sam@187.124.67.117:~/`
5. Import: `docker exec -i infra-db psql -U <user> -d <db> < ~/dump.sql`
6. `transaction_timeout` errors during import are harmless (PG17 setting on PG16)

### Schema Creation (Drizzle ORM)
If drizzle-kit isn't in the prod image, create tables manually with SQL or build the base stage and run from there:
```bash
docker build --target base -t <project>-base -f Dockerfile.prod .
docker run --rm --network infra-net \
  -e DATABASE_URL=... \
  -w /app/apps/server \
  <project>-base \
  npx drizzle-kit push --config=drizzle.config.ts
```
If config files aren't in the image, generate SQL from the schema and run it directly via `psql`.

### Email Sender Domain
Resend (or any email service) silently drops emails if the "from" domain doesn't match a verified domain. Check that `from:` addresses in the code match what's verified in your email provider.

### GitHub Actions SSH Timeout
If `appleboy/ssh-action` times out connecting to the VPS:
- Check `sudo ufw status` — port 22 should be open
- Check Hostinger panel for external firewall settings
- GitHub Actions runner IPs rotate — SSH must be open to all IPs (safe with key-only auth)
- Sometimes it's transient — re-run the workflow

## Common Commands

```bash
# Check all running containers
docker ps

# Check specific project logs
docker logs <container-name> --tail 50
docker logs <container-name> -f          # follow live

# Restart a service (note: won't reload .env)
docker restart <container-name>

# Recreate a service (WILL reload .env)
cd ~/apps/<project>
docker compose -f docker-compose.prod.yml up -d api

# Rebuild and redeploy (on VPS)
cd ~/apps/<project>
git pull
bash scripts/deploy.sh

# Force rebuild (no cache)
docker compose -f docker-compose.prod.yml build --no-cache

# Force rebuild + delete old image
docker rmi -f <image-name>
docker compose -f docker-compose.prod.yml build --no-cache

# Shell into a container
docker exec -it <container-name> sh

# Check disk usage
df -h
docker system df
docker image prune -a -f    # remove ALL unused images

# Database access
docker exec -it infra-db psql -U postgres
docker exec -it infra-db psql -U <project> -d <project>

# Nginx
docker exec infra-nginx nginx -t        # test config
docker exec infra-nginx nginx -s reload  # reload

# SSL certs
docker exec infra-certbot certbot certificates

# Check what volume nginx is actually using
docker inspect infra-nginx | grep <project>

# Verify volume contents
docker run --rm -v <volume>:/data alpine ls -la /data/

# Test database password (from container network)
docker exec -it infra-db psql "postgresql://<user>:<password>@localhost:5432/<db>" -c "SELECT 1;"
```

## Cron Jobs (current)

```cron
# FinCherry PostgreSQL backup — daily 2 AM UTC, keep 30 days
0 2 * * * docker exec infra-db pg_dump -Fc -U fincherry fincherry > ~/apps/fincherry/backups/fincherry_$(date -u +\%Y\%m\%dT\%H\%M\%SZ).dump && find ~/apps/fincherry/backups -name "*.dump" -mtime +30 -delete

# Surpride SQLite backup — daily 2:30 AM UTC
30 2 * * * cd ~/apps/surpride && bash scripts/backup-encrypted.sh

# recordoc PostgreSQL backup — daily 3 AM UTC, keep 30 days
0 3 * * * docker exec infra-db pg_dump -Fc -U recordoc recordoc > ~/apps/recordoc/backups/recordoc_$(date -u +\%Y\%m\%dT\%H\%M\%SZ).dump && find ~/apps/recordoc/backups -name "*.dump" -mtime +30 -delete

# Certbot renewal safety net — weekly Monday 3:30 AM UTC
30 3 * * 1 docker exec infra-certbot certbot renew --quiet && docker exec infra-nginx nginx -s reload
```

## Current Container Names

| Container         | Project    | Service              |
|-------------------|------------|----------------------|
| `infra-db`        | infra      | PostgreSQL 16        |
| `infra-nginx`     | infra      | Nginx reverse proxy  |
| `infra-certbot`   | infra      | SSL cert renewal     |
| `fincherry-api`   | fincherry  | FinCherry API        |
| `surpride-api`    | surpride   | Surpride API         |
| `recordoc-api`    | recordoc   | recordoc API         |
| `recordoc-worker` | recordoc   | recordoc Worker      |

## Current Domains

| Domain                           | Project    |
|----------------------------------|------------|
| fincherry.samantafluture.com     | fincherry  |
| surpride.samantafluture.com      | surpride   |
| recordoc.app                     | recordoc   |

## Troubleshooting Flowchart

### Container won't start
```
docker logs <container> --tail 50
```
→ Missing env var? → Check `.env`
→ Module not found? → Check Dockerfile COPY steps
→ Native module error? → Need node-gyp rebuild in Dockerfile

### SPA shows stale content
```
docker volume ls | grep <project>
docker inspect infra-nginx | grep <project>
```
→ Volume name mismatch? → Fix `name:` in both compose files, `--force-recreate` nginx
→ Same volume, old files? → `docker compose run --rm web-assets` + nginx reload
→ Correct files? → Hard refresh browser (Ctrl+Shift+R)

### 502 Bad Gateway
```
docker ps | grep <project>
docker network inspect infra-net | grep <project>
```
→ Container not running? → Check logs
→ Not on infra-net? → Check docker-compose networks config
→ Running + on network? → `docker restart infra-nginx`

### Database connection failed
```
grep DATABASE_URL ~/apps/<project>/.env
docker exec -it infra-db psql "postgresql://<user>:<pass>@localhost:5432/<db>" -c "SELECT 1;"
```
→ Password wrong? → `ALTER USER ... WITH PASSWORD '...'` then recreate container (not restart)
→ Special chars in password? → Generate new one: `openssl rand -hex 16`
→ "relation does not exist"? → Run migrations / create schema
→ "password authentication failed" after .env fix? → Must `docker compose up -d` (restart won't reload .env)
