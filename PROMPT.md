# PROMPT.md — Bootstrap Carbon Session Context

> This file documents the full system prompt / session context used to scaffold
> Bootstrap Carbon. Keep it alongside CLAUDE.md for reproducibility.

---

## Project

**Bootstrap Carbon** is a Prairie-based carbon credit aggregation and verification
platform structured as a federal cooperative. It solves the MRV (Monitoring,
Reporting, Verification) cost problem that locks small SK/AB farmers out of the
carbon offset market.

## Build instructions (original)

```
Scaffold Next.js with:
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

Install all dependencies:
  @prisma/client prisma @solana/web3.js @solana/spl-token @tanstack/react-query
  zustand recharts date-fns zod lucide-react framer-motion next-auth @auth/prisma-adapter
  decimal.js
  dev: tsx vitest @playwright/test

Init shadcn:
  npx shadcn@latest init --defaults -y
  add: button, card, badge, input, label, select, table, tabs, dialog, sheet,
       progress, toast, separator, skeleton, avatar

Directory structure per CLAUDE.md.

Write CLAUDE.md and PROMPT.md as provided.

Write all source files:
  prisma/schema.prisma
  src/types/index.ts + src/types/next-auth.d.ts
  src/constants/protocols.ts, programs.ts
  src/lib/carbon/protocols.ts, stacking.ts, calculator.ts, optimizer.ts
  src/lib/db/client.ts
  src/lib/auth/config.ts
  src/lib/solana/client.ts, credits.ts, registry.ts
  API routes: calculator, pools, farms, credits, cbam, admin/metrics, auth/[...nextauth], auth/register
  App: (auth)/login, (auth)/register, (dashboard)/layout + all pages
  Components: providers.tsx, nav/sidebar.tsx
  prisma/seed.ts

Run npx prisma validate — fix any errors.
Set up Railway DB, write .env.local, run prisma generate && db push.
Run prisma db seed.
npm run dev → confirm localhost:3000.
npx prisma studio → confirm tables populated.
git commit + push to GitHub.
```

## Key architecture decisions

- **Auth**: NextAuth v4, CredentialsProvider, Prisma adapter, JWT sessions
- **Password hashing**: Node.js `crypto.scrypt` (no extra deps)
- **On-chain**: Disabled by default (`ENABLE_ONCHAIN_ISSUANCE=false`).
  Solana used as audit ledger, not visible in UI.
- **IP separation**: `src/lib/carbon/` is Bootstrap IP Ltd. territory.
  Never put calc logic in components or routes.
- **CFR stacking**: The moat. `stacking.ts` must not be simplified.
- **No `any`**: TypeScript strict throughout.

## Demo credentials (after seeding)

| Email | Password | Role | Org |
|-------|----------|------|-----|
| admin@palliser.example | admin123! | ADMIN | Palliser Grain Co-op (SK) |
| admin@parkland.example | admin123! | ADMIN | Parkland Carbon Solutions (AB) |
| admin@northern.example | admin123! | ADMIN | Northern Plains Cooperative (SK) |
| manager@palliser.example | farmer123! | POOL_MANAGER | Palliser |
| farmer@parkland.example | farmer123! | FARMER | Parkland |
