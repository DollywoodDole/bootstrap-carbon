#!/usr/bin/env bash
# Bootstrap Carbon — Full Project Setup
# Run from an EMPTY directory:
#   chmod +x setup.sh && ./setup.sh
# Requires: Node 20+, npm, git

set -e
GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${GREEN}>>>${NC} $1"; }

# ── Next.js scaffold ───────────────────────────────────────
log "Creating Next.js project..."
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --no-git

# ── Dependencies ───────────────────────────────────────────
log "Installing dependencies..."
npm install \
  @prisma/client prisma \
  @solana/web3.js @solana/spl-token \
  @tanstack/react-query zustand \
  recharts date-fns zod \
  lucide-react framer-motion \
  next-auth @auth/prisma-adapter \
  decimal.js

npm install -D tsx vitest @playwright/test

# ── shadcn/ui ─────────────────────────────────────────────
log "Adding shadcn/ui components..."
npx shadcn@latest init --defaults -y
npx shadcn@latest add -y \
  button card badge input label select \
  table tabs dialog sheet progress \
  toast separator skeleton avatar

# ── Directory structure ────────────────────────────────────
log "Creating directory structure..."
mkdir -p \
  src/lib/carbon \
  src/lib/solana \
  src/lib/db \
  src/lib/auth \
  src/types \
  src/constants \
  src/components/layout \
  src/components/domain \
  src/app/api/pools \
  src/app/api/farms \
  src/app/api/credits \
  src/app/api/calculator \
  src/app/api/cbam \
  src/app/api/admin \
  src/app/api/webhooks \
  src/app/"(auth)"/login \
  src/app/"(dashboard)"/dashboard \
  src/app/"(dashboard)"/pools \
  src/app/"(dashboard)"/farms \
  src/app/"(dashboard)"/calculator \
  src/app/"(dashboard)"/credits \
  src/app/"(dashboard)"/cbam \
  src/app/"(dashboard)"/admin \
  docs \
  prisma

# ── Copy project files ─────────────────────────────────────
log "Copy CLAUDE.md, PROMPT.md, schema.prisma, src files"
log "from the Bootstrap Carbon file deliverable into these paths."
log ""
log "Then run:"
log "  npx prisma generate"
log "  npx prisma db push"
log "  npx prisma db seed"
log "  npm run dev"

# ── Git ────────────────────────────────────────────────────
log "Initialising git..."
git init
git add -A
git commit -m "feat: initial Bootstrap Carbon scaffold"

log ""
log "=== DONE ==="
log "1. Fill in .env.local from .env.example"
log "2. Copy source files from deliverable"
log "3. npx prisma db push && npx prisma db seed"
log "4. npm run dev"
log "5. git remote add origin YOUR_REPO && git push -u origin main"
