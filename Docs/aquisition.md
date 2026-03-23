# Technical Due Diligence Guide — Bootstrap Carbon

*For prospective acquirers and investors. Maintained by Bootstrap IP Ltd.*

---

## Business overview

Bootstrap Carbon is a Prairie carbon credit aggregation platform
structured as a federal cooperative. It reduces MRV verification
costs by 70–80% through automated monitoring, enabling small
SK/AB farmers to access compliance markets that have been
economically inaccessible to them.

**Revenue model:** SaaS subscriptions + aggregation fees +
EU CBAM documentation + data licensing

**Legal structure:**
- Bootstrap Ltd. — operating cooperative (clients, revenue)
- Bootstrap IP Ltd. — IP holdco (software, data, methodology)

---

## IP assets

### Core software (Bootstrap IP Ltd.)

| Asset | Location | Description |
|---|---|---|
| Protocol engine | src/lib/carbon/ | 30+ AB protocols, versioned |
| CFR stacking logic | src/lib/carbon/stacking.ts | Dual-issuance moat |
| Protocol optimizer | src/lib/carbon/optimizer.ts | Farm-to-protocol matching |
| On-chain registry | src/lib/solana/ | Solana SPL credit issuance |
| CBAM generator | src/app/api/cbam/ | EU compliance documentation |

### Data asset

Carbon monitoring data from all active projects. Granularity:
field-level IoT + satellite records, annual by default, continuous
on high-value projects. Volume grows with pool count.

After Year 3 with 50+ pools: ~500 farm records, significant
Prairie soil carbon dataset. Licensable to ag-tech, crop insurers,
government agencies, research institutions.

---

## Architecture

Single-tenant per organization, multi-org deployment.
Next.js 14 App Router, TypeScript strict, PostgreSQL + Prisma.
No external dependencies for core carbon calculations.
All protocol data stored locally — not dependent on government APIs.

Solana devnet until legal clearance for mainnet. Credit issuance
is toggleable via ENABLE_ONCHAIN_ISSUANCE env var.

---

## Key metrics (accessible via /api/admin/metrics)

- Active pools (by status)
- Farms enrolled
- Credits issued (by compliance market)
- Credits retired (by buyer)
- SaaS ARR
- CBAM revenue
- Data licensing revenue
- Total hectares under monitoring

---

## Technical risks

| Risk | Mitigation |
|---|---|
| AB protocol version changes | Local version registry, auto-alert system |
| Credit price volatility | SaaS + CBAM revenue is price-agnostic |
| Solana network issues | Devnet only; mainnet after legal clearance |
| Verifier availability | Relationships with 3 approved AB verifiers |

---

## What a buyer gets

Acquiring Bootstrap Ltd. (operations):
- Client relationships (cooperative members, SaaS subscribers)
- Revenue contracts
- Team

Acquiring Bootstrap IP Ltd. (IP):
- src/lib/carbon/ — all calculation and protocol logic
- src/lib/solana/ — on-chain registry code
- Carbon monitoring dataset
- Methodology documentation

The two can be acquired separately or together.

---

## Contact

daltonellscheid@gmail.com
*All inquiries via legal counsel only.*