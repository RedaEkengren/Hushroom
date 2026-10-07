# Security policy

## Reporting a vulnerability

Email **security@hushroom.io**. Do not open a public issue.

Please include what you found, how to reproduce it, and what you think the impact is. You will get an acknowledgement within a few days. This is a small project, so expect a human rather than a process.

You are welcome to disclose publicly after a fix ships, or after 90 days if nothing has shipped. Credit will be given unless you prefer otherwise.

## What is in scope

The things that would actually matter:

- Anything that lets the server, or someone who has taken the server, read message content or media.
- Anything that leaks the encryption key out of the URL fragment, including into logs, referrers, analytics or error reports.
- Joining a room you were not given the link to, or staying in one after being removed.
- Reading or writing another tenant's data.
- Authentication bypass on room creation, on the admin surface, or on the partner API.
- Anything that makes `[encrypted]` not actually encrypted.

## What is already known and accepted

Please do not report these as findings. They are design decisions, documented in `docs/SECURITY-MODEL.md`.

- **The room name is stored in plaintext.** It is used to show participants which room they are in. Do not put anything sensitive in it.
- **Anyone with the full link can enter.** The link is the credential, by design. There is no second factor, because there are no accounts.
- **Metadata exists while a room is alive.** Participant count, room duration, display names in WebSocket state. It disappears when the room expires.
- **Your network operator sees that you connected.** End-to-end encryption hides what you said, not that you were there. This is stated on the site too.
- **The server operator could serve modified JavaScript.** That is true of every web application that does crypto in the browser. It is why the source is published and why reproducible builds are on the roadmap. If you need protection against a hostile operator, self-host.
- **No formal audit has been done.** There has been no paid penetration test. Treat the code as reviewed by its authors and by whoever has read it since.
