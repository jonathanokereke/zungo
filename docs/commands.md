# Zungo — Developer Command Reference

All commands are run from the **repo root** (`/Users/jonathan/zungo`) unless stated otherwise.

---

## 0. Prerequisites (one-time setup)

```bash
# Install dependencies for the whole monorepo
pnpm install
```

---

## 1. Local PostgreSQL database

### Start / stop the database

```bash
# Start Postgres (assumes it was installed via Homebrew)
brew services start postgresql@16

# Stop Postgres
brew services stop postgresql@16

# Check status
brew services info postgresql@16
```

### Connect to the local database (psql)

```bash
psql postgresql://zungo_user:devpassword123@localhost:5432/zungo_dev
```

### Useful psql commands (run inside psql)

```sql
-- List all tables
\dt

-- Count users
SELECT id, auth0_id, email, level FROM users;

-- Count words per CEFR level
SELECT level, COUNT(*) FROM words GROUP BY level ORDER BY level;

-- Count SRS review cards (the reviews table holds SM-2 state)
SELECT COUNT(*) FROM reviews;

-- Check grammar sessions
SELECT * FROM grammar_sessions ORDER BY created_at DESC LIMIT 10;

-- Exit psql
\q
```

### Run migrations

```bash
cd server/api
npx drizzle-kit migrate
```

### Seed the local database

```bash
cd server/api
pnpm db:seed
```

---

## 2. API server

### Start (local, with live reload)

```bash
cd server/api
pnpm dev
```

### Start (local, no reload — mirrors production)

```bash
cd server/api
pnpm start
```

### View logs in real time

```bash
cd server/api
pnpm dev 2>&1 | tee api.log
```

The server runs on **http://localhost:3001**.

---

## 3. Mobile app (Expo / iOS Simulator)

> Start the API server **first** (step 2), then run the app.

### Start Expo dev server

```bash
cd apps/mobile
npx expo start --clear
```

### Run on iOS Simulator directly

```bash
cd apps/mobile
npx expo run:ios
```

### Reset Metro cache (if app behaves unexpectedly)

```bash
cd apps/mobile
npx expo start --clear
```

### Rebuild native iOS project (after adding a new native dependency)

```bash
cd apps/mobile
npx expo prebuild --platform ios --clean
npx expo run:ios
```

---

## 4. IP address / networking

The app auto-detects the Mac's IP from the Expo dev server — **no manual `.env.local` edits needed**.

If you switch networks (Wi-Fi → hotspot, etc.) just restart the Expo server:

```bash
# Check current Mac LAN IP (for reference only)
ipconfig getifaddr en0

# Restart Expo — the new IP is picked up automatically
cd apps/mobile && npx expo start --clear
```

For a **real iPhone on the same Wi-Fi**, the auto-detection also works as long as Expo can reach the device.

---

## 5. Run everything together (recommended order)

```bash
# Terminal 1 — database (if not already running as a service)
brew services start postgresql@16

# Terminal 2 — API server
cd server/api && pnpm dev

# Terminal 3 — Expo
cd apps/mobile && npx expo start --clear
```

Press **i** in the Expo terminal to open the iOS Simulator.

---

## 6. Git

```bash
# Check status
git status

# Stage all tracked changes
git add -u

# Stage specific files
git add apps/mobile/src/screens/dashboard/DashboardScreen.tsx

# Commit
git commit -m "feat: describe what changed"

# Push to GitHub (triggers Railway redeploy automatically)
git push origin main

# View recent commits
git log --oneline -10
```

---

## 7. Production database (Railway)

### Connect to Railway Postgres (psql)

```bash
# Get the connection string from Railway dashboard → Postgres service → Connect tab
psql "postgresql://postgres:<password>@<host>.railway.app:<port>/railway"
```

### Run migrations on production

```bash
cd server/api

# Temporarily point at production DB
DATABASE_URL="postgresql://postgres:<password>@<host>.railway.app:<port>/railway" \
  npx drizzle-kit migrate
```

### Remove stale dev/mock user records from production

The old mock user (`auth0_id = 'dev|user'`) was created before real Auth0 was wired up. Delete it:

```bash
psql "postgresql://postgres:<password>@<host>.railway.app:<port>/railway" \
  -c "DELETE FROM users WHERE auth0_id = 'dev|user';"
```

Verify it's gone:

```bash
psql "postgresql://postgres:<password>@<host>.railway.app:<port>/railway" \
  -c "SELECT id, auth0_id, email, level FROM users;"
```

---

### Compare local vs production table row counts

```bash
# Local
psql postgresql://zungo_user:devpassword123@localhost:5432/zungo_dev \
  -c "SELECT 'users' AS t, COUNT(*) FROM users UNION ALL SELECT 'words', COUNT(*) FROM words UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;"

# Production (replace with your Railway connection string)
psql "postgresql://postgres:<password>@<host>.railway.app:<port>/railway" \
  -c "SELECT 'users' AS t, COUNT(*) FROM users UNION ALL SELECT 'words', COUNT(*) FROM words UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;"
```

---

## 8. Sync local schema → production (Q36)

Whenever you add a new table or column locally, run the migration against the production database before deploying:

```bash
cd server/api

# 1. Generate migration from schema changes (if not already done)
npx drizzle-kit generate

# 2. Run migration on production
DATABASE_URL="postgresql://postgres:<password>@<host>.railway.app:<port>/railway" \
  npx drizzle-kit migrate
```

> **Order matters:** run migrations on production *before* pushing code that depends on the new columns, otherwise the deploy will fail with DB errors.

To verify both databases have the same tables:

```bash
# Local tables
psql postgresql://zungo_user:devpassword123@localhost:5432/zungo_dev \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

# Production tables
psql "postgresql://postgres:<password>@<host>.railway.app:<port>/railway" \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

---

## 9. Deployment

### Deploy API to Railway

Railway redeploys automatically on every `git push origin main`. To trigger manually:

```bash
# Requires Railway CLI (npm install -g @railway/cli)
railway up --service api
```

### Deploy web to Vercel

```bash
cd apps/web
npx vercel --prod
```

### Build mobile app for TestFlight (iOS)

```bash
# Requires EAS CLI: npm install -g eas-cli
cd apps/mobile
eas build --platform ios --profile production
```

---

## 10. Useful one-liners

```bash
# Check which process is using port 3001
lsof -i :3001

# Kill a stale API server on port 3001
kill $(lsof -t -i :3001)

# Check Node version
node --version

# Check pnpm version
pnpm --version

# List all Expo SDK versions in use
cat apps/mobile/package.json | grep '"expo"'
```
