# Admin AgentX

AgentX's custom fork of the LibreChat Admin Panel. It connects to the customized LibreChat fork in `../chat-agentx` through the `/api/admin/*` API and provides the management UI for AgentX deployments.

## Features

- **Configuration management** — View and edit all LibreChat settings through a dynamic, schema-driven form. New fields added to the schema appear automatically.
- **Role and group overrides** — Apply configuration overrides scoped to specific roles or groups, with a priority-based cascade that determines the final resolved value for each user.
- **User and group administration** — Create and manage groups, assign roles, and control access.
- **Workbase/Lex permissions** — Assign `READ`, `UPDATE`, `REVIEW`, and `DELETE` permissions for Lex articles through the role editor. Read is enabled by default; edit, review, and delete are explicit grants.
- **Authentication** — Supports username/password login and OpenID SSO when enabled on the LibreChat instance.
- **Localization** — Full multi-language support for all UI strings.
- **Accessibility** — Keyboard navigable with ARIA regions, focus management, and screen reader support.

## Getting started

### Local development

```bash
cp .env.example .env   # then edit .env
bun install
bun dev                 # http://localhost:3000
```

From `../chat-agentx`, `npm run frontend:dev` also starts this admin panel for local preview alongside the LibreChat frontend.

### Docker

```bash
cp .env.example .env
# Set SESSION_SECRET (min 32 chars)
# Set VITE_API_BASE_URL=http://host.docker.internal:3080

docker compose up -d    # builds and starts on http://localhost:3000
docker compose down     # stop
```

> **Note:** Inside Docker, `localhost` refers to the container, not your machine.
> Use `http://host.docker.internal:3080` for `VITE_API_BASE_URL` to reach
> LibreChat running on the host.

#### Environment variables

| Variable                        | Required                            | Default                                                                          | Description                                                                                     |
| ------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `PORT`                          | No                                  | `3000`                                                                           | Port the admin panel listens on                                                                 |
| `SESSION_SECRET`                | **Yes** (always required in Docker) | Dev fallback only when running `bun dev` locally; no default in the Docker image | Encryption key for sessions (min 32 chars)                                                      |
| `VITE_API_BASE_URL`             | **Yes** (Docker)                    | `http://localhost:3080` (local dev only)                                         | LibreChat API server URL; use `http://host.docker.internal:<port>` in Docker                    |
| `API_SERVER_URL`                | No                                  | Falls back to `VITE_API_BASE_URL`                                                | Server-side LibreChat API URL when the container reaches LibreChat differently than the browser |
| `ADMIN_BASE_PATH`               | No                                  | `/`                                                                              | URL path where the admin panel is mounted; use `/admin` for shared-host deployments             |
| `ADMIN_SSO_ONLY`                | No                                  | `false`                                                                          | Hide email/password form, SSO only                                                              |
| `ADMIN_SESSION_IDLE_TIMEOUT_MS` | No                                  | `1800000` (30 min)                                                               | Session idle timeout in ms                                                                      |
| `SESSION_COOKIE_SECURE`         | No                                  | `true` in production, `false` otherwise                                          | Set `false` only for plain-HTTP deployments so the browser keeps the admin session cookie       |

For OpenID SSO, the admin panel stores a short-lived PKCE verifier in the
`admin-session` cookie before redirecting to LibreChat. If the admin panel is
served over plain HTTP while running in production mode, browsers reject a
`Secure` session cookie and the callback cannot complete the PKCE exchange. In
that deployment shape, set `SESSION_COOKIE_SECURE=false` on the admin panel.
Set the same override on LibreChat itself when LibreChat is also reached over
plain HTTP, so its OAuth and auth cookies are not dropped either.

#### Standalone Docker build

```bash
docker build --build-arg ADMIN_BASE_PATH=/admin -t admin-agentx .
docker run -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e SESSION_SECRET=your-secret-here-at-least-32-characters \
  -e VITE_API_BASE_URL=http://host.docker.internal:3080 \
  -e ADMIN_BASE_PATH=/admin \
  -e SESSION_COOKIE_SECURE=false \
  admin-agentx
```

#### Publishing deployment images

The GitHub workflow publishes `ghcr.io/abilex-gmbh/admin-agentx:latest` from
`main` and can also publish pinned deployment tags.

To publish a pinned tag from GitHub Actions:

```bash
gh workflow run docker-publish.yml --ref main -f image_tag=v0.1.0
```

Pushing a matching git tag also publishes the same image tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```
