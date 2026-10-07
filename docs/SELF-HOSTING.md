# Self-hosting Hushroom

Three containers and a web server. A small VPS is enough for a handful of concurrent rooms; video is the part that uses bandwidth, and it is peer-assisted through LiveKit rather than everything flowing through you.

---

## 1. Requirements

- Docker and Docker Compose
- Node 20 or later, to build the frontend
- A domain and a TLS certificate. Voice and video will not work without HTTPS, because browsers refuse camera and microphone access on insecure origins
- Open ports: 443, and for LiveKit 7880, 7881, UDP 50000 to 60000, plus 3478 and 5349 if you want TURN

---

## 2. Configure

```bash
git clone https://github.com/RedaEkengren/Hushroom.git
cd hushroom
cp backend/.env.example backend/.env
```

Edit `backend/.env`. Only one value is genuinely required:

```bash
JWT_SECRET=$(openssl rand -hex 32)      # the server refuses to start without this
```

Everything else is optional and degrades cleanly:

| Variable | If unset |
|---|---|
| `LETTERMINT_API_TOKEN` | email verification is unavailable; set `DISABLE_EMAIL_SEND=1` and the OTP is written to the log instead, which is fine for a private instance |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` | text chat works, voice and video report as unavailable |
| `STRIPE_*` | billing endpoints return "not configured"; irrelevant unless you are selling access |
| `INTERNAL_API_KEY` | the internal provisioning and partner key endpoints are disabled |

Generate LiveKit keys:

```bash
docker run --rm livekit/livekit-server:v1.13.5 generate-keys
```

Put the pair in `backend/.env` **and** in a `.env` at the repository root, which `docker-compose.yml` reads to compose the `LIVEKIT_KEYS` variable for the LiveKit container. Both files must agree.

---

## 3. Start

```bash
docker compose up -d
docker compose ps
curl localhost:3010/health
```

A healthy response looks like:

```json
{"status":"ok","auth":"jwt","storage":"redis","livekit":"configured","rooms":0}
```

`"livekit":"disabled"` means the three LiveKit variables are not all set.

---

## 4. Build and serve the frontend

```bash
cd frontend
npm install
npm run build        # writes frontend/dist, including prerendered per-route HTML
```

Point your web server at `frontend/dist` and proxy three paths to the backend. An example nginx site is in [`examples/nginx.conf`](../examples/nginx.conf); replace the domain and the certificate paths. The essential parts:

```nginx
root /path/to/hushroom/frontend/dist;

location /api/     { proxy_pass http://127.0.0.1:3010; }
location /ws       { proxy_pass http://127.0.0.1:3010; proxy_http_version 1.1;
                     proxy_set_header Upgrade $http_upgrade;
                     proxy_set_header Connection "upgrade"; }
location /livekit/ { proxy_pass http://127.0.0.1:7880/; proxy_http_version 1.1;
                     proxy_set_header Upgrade $http_upgrade;
                     proxy_set_header Connection "upgrade"; }

# prerendering writes dist/<route>/index.html, so name the file rather than the
# directory, otherwise nginx answers /security with a redirect to /security/
location /         { try_files $uri $uri/index.html /index.html; }

# keep the internal endpoints off the internet
location /api/internal/ { return 403; }
```

Serve `/api/internal/` to nobody. The provisioning and partner key endpoints live there and are only guarded by a shared secret.

---

## 5. Things worth knowing

**Redis has persistence switched off on purpose.** `redis.conf` sets `save ""` and `appendonly no`. Rooms live in memory and disappear on restart. That is the product, not an oversight. If you turn persistence on you are storing ciphertext on disk, which is still unreadable, but you are no longer able to say nothing is written down.

**Restarting the backend drops WebSocket connections.** Clients reconnect on their own with exponential backoff, and rooms survive because they live in Redis. Restarting Redis ends every active room.

**The encryption key never reaches your server, even though you run it.** You cannot read your users' messages, recover a lost room, or help someone who lost their link. Make sure the people using your instance understand that before they rely on it.

**The Terms, Privacy and About pages name Benbo.se as the operator**, because that is who runs hushroom.io. If you host this for anyone but yourself, change them: `frontend/src/terms-copy.ts`, `privacy-copy.ts` and `about-copy.ts`. They are plain text objects in Swedish and English, and the data protection sections describe what the hosted instance does, which may not match what yours does.

**LiveKit wants its own TLS certificates** for TURN, which matters for participants behind restrictive networks. See `livekit.yaml`. `livekit.dev.yaml` is the local variant with TLS and TURN switched off.

---

## 6. Local development

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
cd frontend && npm run dev          # http://localhost:5174
```

The dev override runs LiveKit in `--dev` mode with throwaway keys, exposes Redis on localhost so you can inspect it, and sets `DISABLE_EMAIL_SEND=1` so the OTP appears in `docker compose logs backend` instead of being sent to anyone.

Tests:

```bash
cd backend  && JWT_SECRET=test npm test
cd frontend && npm test
npx playwright test                 # needs the dev stack and Vite running
```
