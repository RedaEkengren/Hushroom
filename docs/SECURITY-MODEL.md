# Security model

What Hushroom protects against, what it does not, and where each claim lives in the code so you can check it rather than believe it.

---

## The core property

**The server never receives the key that decrypts a conversation.**

A room link looks like this:

```
https://example.org/r/quiet-oak-4821#key=a3f9c1...   (64 hex characters)
```

Everything after `#` is a URL fragment. Browsers do not send fragments in HTTP requests, so the key reaches the participants and nothing else. It is not in request URLs, not in headers, not in access logs, and not in a referrer.

The key is generated with `crypto.getRandomValues` in the browser of whoever creates the room, and lives in React state. It is never written to `localStorage`. It is cached in `sessionStorage` per tab, keyed by room id, so that pressing back or reopening a recent room still decrypts; that cache dies with the tab.

Code: `frontend/src/crypto.ts`, and the room bootstrap in `frontend/src/HushroomLandingPage.tsx`.

---

## Text messages

XSalsa20-Poly1305 via NaCl secretbox (TweetNaCl), 256 bit key, a fresh random nonce per message.

The plaintext that gets encrypted is not just the message. It is a JSON object holding the message, the sender name and the timestamp. Those are therefore covered by the authentication tag. A server that relays messages cannot change who a message came from without the recipient noticing: the client compares the sender bound into the ciphertext against the one in the relay envelope and marks a mismatch as tampered.

The server stores the literal string `[encrypted]` as the message body, alongside the ciphertext and nonce it cannot open.

Code: `frontend/src/crypto.ts`, `backend/src/websocket-service.ts`. Tests: `frontend/src/crypto.test.ts`, including property-based tests that a single flipped bit in either the ciphertext or the nonce is rejected.

---

## Voice and video

LiveKit end to end encryption with `ExternalE2EEKeyProvider`, keyed by PBKDF2 from the same fragment. Frames are encrypted in a worker before they leave the device. The LiveKit server routes encrypted media and cannot decode it, which also means server-side recording is not possible rather than merely disabled.

LiveKit is self-hosted. Media does not pass through a third party cloud.

Code: `frontend/src/useLiveKitVoice.ts`.

---

## What the server holds while a room is alive

| Data | Form | Gone when |
|---|---|---|
| Room name | plaintext | the room expires |
| Participant count and limit | numbers | the room expires |
| Display names | WebSocket connection state | the participant disconnects |
| Messages | `[encrypted]` plus ciphertext and nonce | the room expires |
| Creator email | SHA-256, one way | 30 days |
| Encryption key | never arrives | n/a |

Redis runs with `save ""` and `appendonly no`. Nothing reaches disk, there are no backups and no replicas. Expiry is a Redis TTL, so deletion is automatic rather than a job someone has to remember to run.

Not collected at all: IP addresses, browser fingerprints, user agents, accounts, passwords, call metadata, cookies beyond the session JWT, analytics of any kind. There is no `/metrics` endpoint and no counters, deliberately.

---

## Authentication

There are no user accounts. Two things are authenticated:

**Creating a room** requires a one-time code sent to an email address. The address is stored only as a SHA-256 hash, used to rate limit creation and to enforce bans. The purpose is abuse prevention, not identity.

**Being in a room** is a JWT bound to that room id. The WebSocket closes with code 4003 if the token's room does not match the room being joined, and `/api/livekit-token` returns 403 on the same mismatch. So a token for one room is useless for another.

**Joining** requires nothing. The link is the credential.

Code: `backend/src/auth-service.ts`, `backend/src/jwt-auth.ts`, `backend/src/jwt-middleware.ts`.

---

## What this does not protect against

Stated plainly, because a security product that oversells is worse than one that is modest.

**Anyone with the link gets in.** Until the room is locked or full. If you paste the link into a chat that someone else can read, they can enter. There is no second factor, because there are no accounts.

**A hostile server operator could serve modified JavaScript.** Everything above depends on the code in your browser being the code in this repository. A server that wanted to could send a version that leaks the key. This is true of every browser application that does cryptography, and it is why the source is published. Reproducible builds with published bundle hashes are on the roadmap and not yet done. If your threat model includes the operator, self-host.

**Your network operator sees that you connected.** End to end encryption hides the content, not the connection. An ISP can see that a device reached the host, when, for how long, and roughly how much data moved. Not what was said. A VPN or Tor moves that observation elsewhere; it does not remove it.

**Endpoint compromise defeats everything.** Malware, a screen recorder or someone reading over a shoulder sees the plaintext, because that is where plaintext legitimately exists.

**The room name is plaintext.** Do not describe the matter in it.

**No formal audit.** No paid penetration test has been done. The crypto is standard and the libraries are well used, but nobody independent has been paid to attack this.

**Denial of service is not a design goal.** There are rate limits per IP and per endpoint, and a WebSocket byte throttle, enough for ordinary abuse. A determined attacker with resources can make an instance unavailable. They still cannot read anything.

---

## If someone comes with a court order

What can be confirmed: that a verification code was requested for some address, though not which one, since only the hash is kept. The approximate time a room was created. That a room existed, with its name and duration. How many people were in it.

What cannot be provided, because it does not exist: message content, voice or video recordings, encryption keys, the email address used, participant identities, IP addresses, or anything about a room that has already expired.

These are consequences of the architecture rather than promises about behaviour. That is the whole point.
