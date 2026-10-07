# Hushroom

**An end-to-end encrypted meeting room you reach with a link. No account, nothing stored, and the server cannot read it.**

Create a room, send someone the link, talk. They do not install anything and they do not sign up. When the timer runs out the room is gone, and there is nothing left to hand over to anyone.

Hushroom is self-hostable and runs on three containers. [hushroom.io](https://hushroom.io) is the same code, hosted in Sweden.

---

## Why this exists

Most "encrypted" meeting tools hold the keys. They mean it when they say your data is safe, but if a court asks, or a database leaks, or an employee goes looking, the content is there to be read.

Hushroom is built so that it cannot be. The encryption key is generated in your browser and lives in the URL fragment, the part after `#`. Per the HTTP specification a fragment is never sent to a server. The server receives ciphertext it has no way to decrypt, and deletes it when the room expires.

That is not a policy. It is the architecture, and you can read all of it here.

---

## Why it might be worth your time

Not because it is large. Because a few parts of it are the kind of thing that is
usually hidden inside a commercial product:

- **The ciphertext knows who sent it** (`frontend/src/crypto.ts`, 53 lines). The
  plaintext that gets sealed is not the message, it is `{sender, timestamp,
  message}`, so all three are covered by the Poly1305 tag. A relay that has been
  taken over can drop a message or reorder messages, but it cannot change who
  said what: the receiver compares the sender bound inside the ciphertext
  against the one on the envelope and marks a mismatch as tampered.
  `crypto.test.ts` proves it with property-based tests, including that a single
  flipped bit anywhere in the ciphertext or the nonce is rejected.

- **A relay written so it has nothing to leak**
  (`backend/src/websocket-service.ts`). It validates, throttles and broadcasts
  blobs. The message body it writes to Redis is the literal string
  `[encrypted]`. There is no code path where plaintext exists on the server,
  because there is no plaintext to have.

- **The marketing cannot drift from the code** (`frontend/src/demo-data.ts` and
  its tests). The landing page animates what the server holds: the three Redis
  keys, the TTLs, the relayed envelope with no `text` field, and the `[encrypted]`
  placeholder. All of it is derived from the real implementation and pinned
  there by unit tests, so changing a key name in the backend fails a test on the
  marketing page. Claims about privacy are cheap. These ones break the build.

- **What it does not protect against** (`docs/SECURITY-MODEL.md`). Written
  plainly: anyone with the link gets in, a hostile operator could serve modified
  JavaScript, your network operator still sees that you connected, and nobody
  independent has been paid to attack this. A security product that oversells is
  worse than one that is modest.

- **Reconnection that survives a phone**
  (`frontend/src/useRoomWebSocket.ts`, 188 lines). iOS Safari kills background
  tabs within seconds. The hook re-establishes on `visibilitychange`, with a
  15 attempt exponential backoff budget and a manual button when that runs out.
  This exists because a real call dropped in 30 seconds and the fix took two
  attempts to find.

- **The test suite** (`e2e/hushroom.spec.ts`). 332 Playwright tests, including
  multi-context flows where two browsers join the same room and the assertions
  are about what each of them sees: online counts, kicks, locks, reload keeping
  the key, and an encrypted message round trip.

---

## How the encryption works

```
https://hushroom.io/r/quiet-oak-4821#key=a3f9c1...
                    └─ sent to server ─┘└ never sent ┘
```

- A room link carries a 32 byte random key in the fragment.
- Text is encrypted in the browser with NaCl secretbox (XSalsa20-Poly1305) before it reaches the WebSocket. The sender name and timestamp are bound into the ciphertext, so a compromised relay cannot rewrite who said what.
- Voice and video use LiveKit end-to-end encryption, keyed from the same fragment. Frames are encrypted before they leave the device.
- The server stores the literal string `[encrypted]` as the message body, plus the ciphertext and nonce blobs it cannot open.
- Redis runs with persistence disabled. Nothing is written to disk, there are no backups, and a power cut clears everything.

Full threat model and what the server does hold: [`docs/SECURITY-MODEL.md`](docs/SECURITY-MODEL.md).

---

## What the server does know

Being honest about this is the point, so it is in the README rather than buried.

| Data | Stored as | Retention |
|---|---|---|
| Room name | plaintext | until the room expires |
| Participant count | number | until the room expires |
| Display names | in memory, WebSocket state | until disconnect |
| Messages | `[encrypted]` placeholder plus ciphertext | until the room expires |
| Creator email | SHA-256 hash, one way | 30 days |
| Encryption keys | never reaches the server | n/a |

No IP logging, no browser fingerprints, no accounts, no analytics, no counters.

---

## Run it

```bash
git clone https://github.com/RedaEkengren/Hushroom.git
cd hushroom
cp backend/.env.example backend/.env    # set JWT_SECRET, see the file
docker compose up -d
```

Backend on `:3010`, Redis and LiveKit alongside it. Build the frontend with `cd frontend && npm install && npm run build` and point a web server at `frontend/dist`.

Full instructions including TLS, a reverse proxy and LiveKit keys: [`docs/SELF-HOSTING.md`](docs/SELF-HOSTING.md).

---

## Stack

Node 22, TypeScript, Express, Redis, WebSocket on the server. React 18, Vite and Tailwind in the browser. LiveKit for voice and video, self-hosted, not a cloud tenancy. TweetNaCl for text encryption. Everything runs in Docker Compose.

Tests: 214 unit tests (vitest, 84 in the browser code and 130 on the server) and 332 end-to-end tests (Playwright), including property-based tests of the crypto round trip and tamper rejection.

---

## Layout

```
backend/src/          Express, WebSocket relay, Redis room service, LiveKit tokens
  routes/             auth, rooms, livekit, billing, tenant, partner API
  *.test.ts           130 vitest unit tests next to what they test
frontend/src/         React, one file per page, copy split into *-copy.ts per language
  crypto.ts           the 53 lines everything else depends on
  useLiveKitVoice.ts  voice and video, end-to-end encrypted through LiveKit
e2e/                  332 Playwright tests
docs/                 self-hosting, and the security model including its limits
examples/nginx.conf   a working reverse proxy to start from
```

The site is bilingual: Swedish on clean paths, English under `/en`, with
`frontend/src/routes.ts` as the single source for both.

---

## Licence

**AGPL-3.0.** You may run, read, modify and self-host this freely, including inside your own organisation.

The AGPL requires that if you run a modified version as a network service, you make your source available to its users under the same licence. If you want to embed Hushroom in a closed product you sell, that is what the commercial licence is for: hello@hushroom.io.

This is a dual-licence project, so external contributions need a contributor licence agreement. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Status

Built and running in production, with no paying customers. It was aimed at a market that did not turn up, which is written out honestly rather than hidden: the product works, the business did not. It is released openly because a working zero-knowledge meeting room is worth more in the open than archived in a private repository.

Issues and pull requests are welcome. Response times are best effort.
