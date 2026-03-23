# CLAUDE.md — Bootstrap Carbon / RoadHouse BootStrap Ltd.

> Read by Claude Code on every session. Single source of truth.
> Keep current. Architecture decisions live here, not in Slack.

---

## What this is

**Bootstrap Carbon** is a Prairie-based carbon credit aggregation and
verification platform structured as a federal cooperative.

It solves the MRV (Monitoring, Reporting, Verification) cost problem
that locks small SK/AB farmers out of the carbon offset market. It
aggregates farms into compliant pools, issues verified credits on-chain
via Solana, and generates B2B revenue through:
  - SaaS protocol compliance subscriptions
  - Aggregation pool management fees (10% of credit proceeds)
  - EU CBAM documentation packages ($15–65K per engagement)
  - Carbon monitoring data licensing

**This is not a crypto project.** Solana is the audit ledger.
Users never see "token", "mint", or "blockchain" in the UI.
Lead with cooperative value. Always.

---

## Legal / IP structure

  Bootstrap Ltd.            — operating cooperative (revenue, clients)
  Bootstrap IP Ltd.         — holdco for src/lib/carbon/, src/lib/solana/,
                              all monitoring data, protocol methodology IP

The split matters for acquisition. Buyer can acquire operations
while IP holdco retains data licensing revenue. Do not conflate.

---

## Stack

  Next.js 14 (App Router)   TypeScript strict
  PostgreSQL + Prisma        NextAuth v5
  Tailwind + shadcn/ui       TanStack Query + Zustand
  Solana Web3.js + SPL       Recharts
  Zod                        Vitest + Playwright
  Vercel (frontend)          Railway (Postgres)
  GitHub Actions (CI)

---

## Directory map

  src/app/
    (auth)/                  login, register
    (dashboard)/             authenticated shell
      dashboard/             overview metrics
      pools/                 aggregation pool management
      farms/                 farmer onboarding + records
      calculator/            protocol optimizer UI
      credits/               on-chain credit registry
      cbam/                  EU CBAM doc generator
      admin/                 admin: users, billing, system
    api/
      pools/                 CRUD + farmer invites
      farms/                 onboarding + monitoring data
      credits/               issue, retire, verify
      calculator/            optimizer endpoint
      cbam/                  package generation
      webhooks/              Solana events, payment hooks

  src/lib/
    carbon/
      protocols.ts           AB quantification protocol registry
      calculator.ts          Core credit yield engine
      stacking.ts            CFR + TIER dual-issuance — CORE IP
      optimizer.ts           Protocol optimizer (farm inputs → max yield)
    solana/
      client.ts              RPC connection, wallet adapter
      credits.ts             Mint / burn SPL credit tokens
      registry.ts            On-chain registry reads
    db/client.ts             Prisma singleton
    auth/config.ts           NextAuth config

  src/types/index.ts         All shared TypeScript types
  src/constants/
    protocols.ts             Protocol names, versions, registry IDs
    programs.ts              Solana program addresses

  prisma/
    schema.prisma            Full data model
    seed.ts                  Demo data (dev + due diligence)

  docs/
    architecture.md          System overview for due diligence
    api.md                   API reference
    protocols.md             AB protocol implementation notes
    acquisition.md           Technical DD guide for buyers

---

## Core IP — read before touching these files

### src/lib/carbon/stacking.ts  ← THE MOAT
Alberta TIER + federal CFR dual-issuance. One project, two compliance
markets, no incremental land. Dramatically underutilized in the market
because protocol paperwork is complex. Our platform handles it.

Rules encoded here:
  - Sequestration activities (wetland, conservation cropping) → stackable
  - Feed additives (Bovaer, 3-NOP) → NOT stackable with CFR
  - Cover crops → limited CFR eligibility, check protocol version
  - First-year tillage conversion → higher additionality than established
    no-till. Always flag this in optimizer output.
  - Stacking multiplier is 1.4–2.2× depending on activity + land class

Do not simplify or flatten this logic. It is the moat.

### src/lib/carbon/protocols.ts
AB has 30+ quantification protocols, each versioned independently.
Currently tracked versions:
  - Carbon Offset Emission Factors Handbook: v3.2 (from Aug 20 2025)
  - Standard for GHG Offset Project Developers: v3.3 (June 2025)
  - Offset Verification Report Template: v4.0 (from Jan 2025)

Existing projects continue under their registered version.
New projects always use current version. Platform tracks both.

### src/lib/carbon/optimizer.ts
Input:  { hectares, landClass, currentPractice, soilType, location }
Output: ranked protocols by credit yield with stacking eligibility flags

This is the sales tool. Show "base credits" vs "with stacking" clearly.

---

## Data model overview

  Organization  (cooperative tenant, multi-tenant)
    Users       (farmers, pool managers, admins)
    Farms       → Projects → MonitoringData
    Pools       ← PoolMemberships ← Farms
    OffsetCredits → CreditTransfers (provenance chain)
    CBAMPackages  (EU documentation per facility)

---

## Commands

  npm run dev              local dev (port 3000)
  npm run build            production build
  npm run lint             ESLint
  npm run typecheck        tsc --noEmit
  npm run test             Vitest
  npm run test:e2e         Playwright
  npx prisma studio        DB GUI
  npx prisma db push       apply schema → dev DB
  npx prisma db seed       load demo data

---

## Non-negotiables

  NEVER use `any` in TypeScript. Use `unknown` + narrow.
  NEVER store private keys in DB. Env vars or secrets manager only.
  NEVER put calc logic in components or routes. Only in src/lib/carbon/.
  NEVER use "token", "mint", "blockchain" in user-facing UI strings.
  NEVER skip tests on carbon calculation logic. It is a financial liability.
  NEVER make src/lib/carbon/ depend on external APIs. Data lives locally.
  NEVER add tokenomics to this repo without explicit instruction.

---

## Acquisition readiness — always maintain

  [ ] .env.example has every var documented
  [ ] docs/acquisition.md is current
  [ ] src/lib/carbon/ has >90% test coverage
  [ ] No hardcoded credentials in git history
  [ ] API documented in docs/api.md
  [ ] Revenue metrics at /api/admin/metrics
  [ ] IP separation documented (Bootstrap IP Ltd.)
  [ ] All licenses compatible with commercial sale

---

*Updated: 2026-03-22 — maintain this on every significant change*