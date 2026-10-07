# Contributing

Thanks for looking. Issues and pull requests are both welcome, and response times are best effort rather than guaranteed.

## The licence situation, up front

Hushroom is dual licensed: AGPL-3.0 for everyone, plus a commercial licence for anyone who wants to embed it in a closed product. That only works if the project can license all of its own code, including yours.

So for anything beyond a typo or a one-line fix, **a pull request needs a contributor licence agreement**. It is the standard kind: you keep the copyright to what you wrote, and you grant the project the right to license it under both the AGPL and the commercial terms.

Say so in the pull request and you will get the text to sign. If you would rather not, that is a reasonable position. Open an issue describing the change instead and it can be implemented separately.

## Before you open a pull request

```bash
cd backend  && JWT_SECRET=test npm test
cd frontend && npm test && npm run build
bash scripts/check-file-sizes.sh
```

End-to-end tests need the stack running:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
cd frontend && npm run dev          # Vite on :5174
npx playwright test
```

## What the code expects

- **No source file over 1200 lines.** Enforced by `scripts/check-file-sizes.sh` in CI. Split rather than raise it.
- **No new runtime dependencies** without a reason in the pull request. The dependency list is short on purpose: this is a security product and every package is something a reviewer has to trust.
- **Nothing that weakens the zero-knowledge property.** Anything that would let the server see a key, a plaintext message, or decryptable media will be declined no matter how convenient it is. If you think an exception is justified, open an issue first.
- **No analytics, counters or telemetry.** Not even aggregate ones. `/health` returning up or down plus PII-stripped logs is the entire observability surface, and that is deliberate.
- **No personal data in logs.** No usernames, no IP addresses, no email addresses.
- Comments explain why, not what. Match the surrounding style.

## Security issues

Do not open a public issue. See [`SECURITY.md`](SECURITY.md).
