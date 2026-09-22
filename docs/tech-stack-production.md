# Zungo — Production Tech Stack

This document describes every component in the live production environment.

---

## Architecture overview

```
User's iPhone (App Store / TestFlight)
        │  HTTPS
        ▼
  Auth0 (zungo.eu.auth0.com)      ← login, token issuance
        │  JWT (RS256)
        ▼
  Railway API  (zungo-api.railway.app)   ← Fastify + tsx
        │  SSL/TCP
        ▼
  Railway PostgreSQL               ← production database
        │
  Anthropic Claude API             ← AI features (grammar, chat, lookup)
```

Web app:
```
Browser → Vercel CDN → apps/web (Vite + React)
```

---

## Components

### 1. Railway — API server

| Property | Value |
|---|---|
| Platform | [railway.app](https://railway.app) |
| Service | `@zungo/api` (Node 20, Nixpacks build) |
| Runtime | `tsx src/index.ts` (TypeScript run directly, no compile) |
| Port | `3001` (Railway maps it to `443` externally) |
| Public URL | Set in Railway dashboard after first deploy |
| Auto-deploy | Yes — every `git push origin main` triggers a redeploy |
| Config file | `server/api/railway.toml`, `server/api/nixpacks.toml` |

**Environment variables set in Railway dashboard:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | Railway Postgres internal connection string |
| `AUTH0_DOMAIN` | `zungo.eu.auth0.com` |
| `AUTH0_AUDIENCE` | `https://api.zungo.app` |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `PORT` | `3001` |
| `CORS_ORIGIN` | Your Vercel web URL + any other allowed origins |
| `NODE_ENV` | `production` |

---

### 2. Railway — PostgreSQL

| Property | Value |
|---|---|
| Engine | PostgreSQL 16 (managed by Railway) |
| Backups | Automatic daily snapshots (Railway Pro) |
| Connection | Internal URL for API service; external URL for admin access |
| Migrations | Run manually with `drizzle-kit migrate` pointed at prod DB |

The API server connects via the **internal** Railway private network URL (faster, no egress charges). You connect externally via the public proxy URL shown in the Railway dashboard.

---

### 3. Vercel — Web app

| Property | Value |
|---|---|
| Platform | [vercel.com](https://vercel.com) |
| Package | `apps/web` (Vite + React) |
| Build command | `pnpm build` (Turbo runs `vite build`) |
| Output | `apps/web/dist/` |
| Auto-deploy | Yes — every push to `main` |
| Config | `apps/web/.vercel/` (local, gitignored) |

---

### 4. Auth0 — Authentication

| Property | Value |
|---|---|
| Tenant | `zungo.eu.auth0.com` |
| Plan | Free tier (7,000 MAU) |
| Applications | Native app (iOS/Android), Regular web app (dashboard) |
| Token type | RS256 JWT, 24h expiry |
| Audience | `https://api.zungo.app` |
| Custom claims | `https://zungo.app/level`, `https://zungo.app/userId` (set via Action) |
| JWKS URL | `https://zungo.eu.auth0.com/.well-known/jwks.json` |

The API validates every request by fetching Auth0's public keys. No Auth0 secret is stored on the API.

---

### 5. Anthropic Claude — AI features

| Property | Value |
|---|---|
| Model | `claude-haiku-4-5-20251001` |
| Uses | Grammar exercises, word lookup (reading screen), AI tutor chat |
| Billing | Pay-per-token on Anthropic's API |
| Integration | API server only — mobile never calls Anthropic directly |

---

### 6. Mobile app distribution

| Channel | Tool | Audience |
|---|---|---|
| TestFlight | EAS Build + `eas submit` | Internal testers, beta users |
| App Store | EAS Build + App Store Connect | Public |
| Direct install (dev) | Xcode run | Developer only |

Build profiles are defined in `apps/mobile/eas.json`.

---

## Environment variable comparison

| Variable | Local | Production |
|---|---|---|
| `DATABASE_URL` | `postgresql://zungo_user:...@localhost:5432/zungo_dev` | Railway internal URL |
| `EXPO_PUBLIC_API_URL` | *(auto-detected from Metro host)* | `https://zungo-api.railway.app` |
| `AUTH0_DOMAIN` | `zungo.eu.auth0.com` | `zungo.eu.auth0.com` |
| `NODE_ENV` | `development` | `production` |

---

## Deployment pipeline

```
Developer pushes to main
        │
        ├──▶ Railway detects push → builds with Nixpacks → restarts API service
        │
        └──▶ Vercel detects push → runs vite build → deploys web to CDN
```

Mobile app deployments are **manual** (EAS Build triggered by developer).
