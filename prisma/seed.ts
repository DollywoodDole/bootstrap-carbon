// prisma/seed.ts
// Demo data for dev + due diligence
// Run: npm run db:seed
//
// Farm / credit dates are backdated across the last 6 months so that
// /api/admin/metrics/history shows a realistic growth curve for buyers.

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { scrypt, randomBytes } from "crypto"
import { promisify } from "util"
import Decimal from "decimal.js"
import * as dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is not set")

const adapter = new PrismaPg({ connectionString })
const db      = new PrismaClient({ adapter })
const scryptP = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt       = randomBytes(16).toString("hex")
  const derivedKey = (await scryptP(password, salt, 64)) as Buffer
  return salt + ":" + derivedKey.toString("hex")
}

// ── Organizations ──────────────────────────────────────────
const ORGS = [
  { name: "Palliser Grain Co-op",       slug: "palliser-grain",  type: "COOPERATIVE" as const, jurisdiction: "CA-SK" },
  { name: "Parkland Carbon Solutions",   slug: "parkland-carbon", type: "COOPERATIVE" as const, jurisdiction: "CA-AB" },
  { name: "Northern Plains Cooperative", slug: "northern-plains", type: "COOPERATIVE" as const, jurisdiction: "CA-SK" },
]

// ── Farms — backdated to show 6-month growth curve ────────
// Monthly cumulative: Oct 2 | Nov 4 | Dec 6 | Jan 9 | Feb 11 | Mar 12
const FARMS_ORG1 = [
  { name: "Wheatfield North",      province: "SK", municipality: "Moose Jaw RM",    totalHectares: 485,  lat: 50.39, lng: -105.53, soilZone: "Brown",     landClass: "2", createdAt: new Date("2025-10-05") },
  { name: "Mossbank Quarter",      province: "SK", municipality: "Mossbank",        totalHectares: 318,  lat: 49.93, lng: -105.97, soilZone: "Dark Brown", landClass: "2", createdAt: new Date("2025-10-12") },
  { name: "Creek Bottom",          province: "SK", municipality: "Wood River RM",   totalHectares: 220,  lat: 49.80, lng: -106.50, soilZone: "Dark Brown", landClass: "3", createdAt: new Date("2025-11-03") },
  { name: "Alkali Flats",          province: "SK", municipality: "Expanse",         totalHectares: 162,  lat: 49.72, lng: -105.80, soilZone: "Brown",     landClass: "4", createdAt: new Date("2025-12-08") },
]

const FARMS_ORG2 = [
  { name: "Lacombe Upper",         province: "AB", municipality: "Lacombe County",   totalHectares: 640,  lat: 52.46, lng: -113.74, soilZone: "Black",     landClass: "1", createdAt: new Date("2025-11-20") },
  { name: "Ponoka East Section",   province: "AB", municipality: "Ponoka County",    totalHectares: 420,  lat: 52.68, lng: -113.58, soilZone: "Black",     landClass: "1", createdAt: new Date("2025-12-01") },
  { name: "Red Deer Bench",        province: "AB", municipality: "Red Deer County",  totalHectares: 310,  lat: 52.27, lng: -113.80, soilZone: "Dark Gray", landClass: "2", createdAt: new Date("2026-01-10") },
  { name: "Wetlands Block B",      province: "AB", municipality: "Lacombe County",   totalHectares: 195,  lat: 52.51, lng: -113.90, soilZone: "Black",     landClass: "3", createdAt: new Date("2026-01-15") },
]

const FARMS_ORG3 = [
  { name: "Spiritwood Half",       province: "SK", municipality: "Spiritwood",      totalHectares: 390,  lat: 53.37, lng: -107.52, soilZone: "Gray",      landClass: "2", createdAt: new Date("2026-01-22") },
  { name: "Meadow Lake North",     province: "SK", municipality: "Meadow Lake",     totalHectares: 275,  lat: 54.13, lng: -108.44, soilZone: "Gray",      landClass: "3", createdAt: new Date("2026-02-05") },
  { name: "Prince Albert Quarter", province: "SK", municipality: "Prince Albert",   totalHectares: 188,  lat: 53.20, lng: -105.75, soilZone: "Dark Gray", landClass: "2", createdAt: new Date("2026-02-18") },
  { name: "Candle Lake Block",     province: "SK", municipality: "Candle Lake",     totalHectares: 142,  lat: 53.83, lng: -105.30, soilZone: "Gray",      landClass: "4", createdAt: new Date("2026-03-10") },
]

// ── Main seed ──────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding Bootstrap Carbon demo data…")

  await db.$transaction([
    db.creditTransfer.deleteMany(),
    db.offsetCredit.deleteMany(),
    db.poolMembership.deleteMany(),
    db.pool.deleteMany(),
    db.monitoringRecord.deleteMany(),
    db.project.deleteMany(),
    db.farm.deleteMany(),
    db.cBAMPackage.deleteMany(),
    db.subscription.deleteMany(),
    db.session.deleteMany(),
    db.account.deleteMany(),
    db.user.deleteMany(),
    db.organization.deleteMany(),
  ])

  // ── Organizations ────────────────────────────────────────
  const [org1, org2, org3] = await Promise.all(
    ORGS.map(o => db.organization.create({ data: o }))
  )
  console.log("✓ 3 organizations")

  // ── Users ────────────────────────────────────────────────
  const adminHash  = await hashPassword("admin123!")
  const farmerHash = await hashPassword("farmer123!")

  const [admin1] = await Promise.all([
    db.user.create({ data: { name: "Alice Palliser",  email: "admin@palliser.example",   passwordHash: adminHash,  role: "ADMIN",        organizationId: org1.id } }),
    db.user.create({ data: { name: "Bob Palliser",    email: "manager@palliser.example", passwordHash: farmerHash, role: "POOL_MANAGER", organizationId: org1.id } }),
  ])

  const [admin2] = await Promise.all([
    db.user.create({ data: { name: "Carol Parkland",  email: "admin@parkland.example",   passwordHash: adminHash,  role: "ADMIN",        organizationId: org2.id } }),
    db.user.create({ data: { name: "Dave Parkland",   email: "farmer@parkland.example",  passwordHash: farmerHash, role: "FARMER",       organizationId: org2.id } }),
  ])

  const [admin3] = await Promise.all([
    db.user.create({ data: { name: "Eve Northern",    email: "admin@northern.example",   passwordHash: adminHash,  role: "ADMIN",        organizationId: org3.id } }),
    db.user.create({ data: { name: "Frank Northern",  email: "farmer@northern.example",  passwordHash: farmerHash, role: "FARMER",       organizationId: org3.id } }),
  ])

  console.log("✓ 6 users")

  // ── Subscriptions ─────────────────────────────────────────
  // MRR trajectory: Oct $500 | Nov $500 | Dec $500 | Jan $1,250 | Feb $1,250 | Mar $1,250
  await db.subscription.createMany({
    data: [
      {
        organizationId: org1.id,
        plan:           "GROWTH",
        status:         "ACTIVE",
        monthlyRate:    new Decimal("500.00"),
        startDate:      new Date("2025-10-01"),
      },
      {
        organizationId: org2.id,
        plan:           "GROWTH",
        status:         "ACTIVE",
        monthlyRate:    new Decimal("750.00"),
        startDate:      new Date("2026-01-01"),
      },
    ],
  })
  console.log("✓ 2 subscriptions (Palliser $500/mo, Parkland $750/mo)")

  // ── Farms — backdated ────────────────────────────────────
  const farms1 = await Promise.all(
    FARMS_ORG1.map(f => db.farm.create({ data: { ...f, ownerId: admin1.id, organizationId: org1.id } }))
  )
  const farms2 = await Promise.all(
    FARMS_ORG2.map(f => db.farm.create({ data: { ...f, ownerId: admin2.id, organizationId: org2.id } }))
  )
  const farms3 = await Promise.all(
    FARMS_ORG3.map(f => db.farm.create({ data: { ...f, ownerId: admin3.id, organizationId: org3.id } }))
  )
  console.log("✓ 12 farms (backdated Oct 2025 – Mar 2026)")

  // ── Projects ─────────────────────────────────────────────
  const project1 = await db.project.create({
    data: {
      farmId: farms1[0].id, name: "Wheatfield North — No-Till Conversion",
      protocolId: "conservation-cropping", protocolVersion: "2.1",
      stacksWith: ["cfr-v1"], currentPractice: "conventional-till", projectPractice: "no-till",
      hectares: farms1[0].totalHectares, status: "VERIFIED",
      registeredDate: new Date("2025-08-01"), verifiedDate: new Date("2025-11-15"),
      expiryDate: new Date("2030-08-01"), abRegistryId: "AEOR-2025-CC-0441",
      crediting_period_years: 5,
    },
  })

  const project2 = await db.project.create({
    data: {
      farmId: farms1[1].id, name: "Mossbank — Reduced Till",
      protocolId: "conservation-cropping", protocolVersion: "2.1",
      stacksWith: [], currentPractice: "conventional-till", projectPractice: "reduced-till",
      hectares: farms1[1].totalHectares, status: "MONITORING",
      registeredDate: new Date("2025-10-15"),
      expiryDate: new Date("2030-10-15"), abRegistryId: "AEOR-2025-CC-0489",
      crediting_period_years: 5,
    },
  })

  const project3 = await db.project.create({
    data: {
      farmId: farms2[3].id, name: "Wetlands Block B — Restoration",
      protocolId: "wetland-restoration", protocolVersion: "1.3",
      stacksWith: ["cfr-v1"], currentPractice: "drained", projectPractice: "restored",
      hectares: farms2[3].totalHectares, status: "VERIFIED",
      registeredDate: new Date("2025-09-01"), verifiedDate: new Date("2025-10-15"),
      expiryDate: new Date("2035-09-01"), abRegistryId: "AEOR-2025-WR-0218",
      crediting_period_years: 10,
    },
  })

  await db.project.create({
    data: {
      farmId: farms2[0].id, name: "Lacombe Upper — No-Till (First Year)",
      protocolId: "conservation-cropping", protocolVersion: "2.1",
      stacksWith: ["cfr-v1"], currentPractice: "conventional-till", projectPractice: "no-till",
      hectares: farms2[0].totalHectares, status: "REGISTERED",
      registeredDate: new Date("2026-01-10"),
      expiryDate: new Date("2031-01-10"), crediting_period_years: 5,
    },
  })

  console.log("✓ 4 projects")

  // ── Monitoring records ────────────────────────────────────
  await db.monitoringRecord.createMany({
    data: [
      {
        projectId: project1.id, recordedAt: new Date("2025-11-01"), source: "SATELLITE",
        baselineEmissions: new Decimal("145.200"), projectEmissions: new Decimal("89.340"),
        netReduction: new Decimal("55.860"), dataHash: "sha256:abc123" + project1.id.slice(0, 8),
      },
      {
        projectId: project3.id, recordedAt: new Date("2025-10-10"), source: "THIRD_PARTY_AUDIT",
        baselineEmissions: new Decimal("78.500"), projectEmissions: new Decimal("12.300"),
        netReduction: new Decimal("66.200"), dataHash: "sha256:def456" + project3.id.slice(0, 8),
      },
    ],
  })

  // ── Pools ─────────────────────────────────────────────────
  // Pool dates drive the active_pools history series
  const totalHa1 = farms1[0].totalHectares + farms1[1].totalHectares + farms1[2].totalHectares
  const pool1 = await db.pool.create({
    data: {
      organizationId: org1.id,
      name: "Palliser No-Till Aggregation 2025",
      description: "SK conventional to no-till conversion pool, 3 farms",
      province: "SK",
      platformFeeRate: new Decimal("0.10"),
      totalHectares: totalHa1,
      estimatedCredits: new Decimal("236.5"),
      verifierName: "Carbon Verified Inc.",
      verifierLicense: "CVAB-2025-087",
      verificationCost: new Decimal("18500"),
      status: "CREDITS_ISSUED",
      submittedDate: new Date("2025-10-15"),  // active from Oct
      verifiedDate:  new Date("2025-12-01"),
      memberships: {
        create: [
          { farmId: farms1[0].id, contributionHa: farms1[0].totalHectares, creditShare: new Decimal(farms1[0].totalHectares / totalHa1) },
          { farmId: farms1[1].id, contributionHa: farms1[1].totalHectares, creditShare: new Decimal(farms1[1].totalHectares / totalHa1) },
          { farmId: farms1[2].id, contributionHa: farms1[2].totalHectares, creditShare: new Decimal(farms1[2].totalHectares / totalHa1) },
        ],
      },
    },
  })

  const totalHa2 = farms2[0].totalHectares + farms2[1].totalHectares + farms2[2].totalHectares + farms2[3].totalHectares
  const pool2 = await db.pool.create({
    data: {
      organizationId: org2.id,
      name: "Parkland Wetland + Conservation Stack 2025",
      description: "AB wetland restoration + no-till dual-issuance pool",
      province: "AB",
      platformFeeRate: new Decimal("0.10"),
      totalHectares: totalHa2,
      estimatedCredits: new Decimal("512.8"),
      verifierName: "Prairie Verification Services",
      verifierLicense: "PVS-AB-2025-044",
      verificationCost: new Decimal("24000"),
      status: "VERIFIED",
      submittedDate: new Date("2025-11-01"),  // active from Nov
      verifiedDate:  new Date("2026-01-15"),
      memberships: {
        create: [
          { farmId: farms2[0].id, contributionHa: farms2[0].totalHectares, creditShare: new Decimal(farms2[0].totalHectares / totalHa2) },
          { farmId: farms2[1].id, contributionHa: farms2[1].totalHectares, creditShare: new Decimal(farms2[1].totalHectares / totalHa2) },
          { farmId: farms2[2].id, contributionHa: farms2[2].totalHectares, creditShare: new Decimal(farms2[2].totalHectares / totalHa2) },
          { farmId: farms2[3].id, contributionHa: farms2[3].totalHectares, creditShare: new Decimal(farms2[3].totalHectares / totalHa2) },
        ],
      },
    },
  })

  console.log("✓ 2 pools")

  // ── Credits — backdated for history curve ─────────────────
  // credits_issued: Oct 132t | Nov 132t | Dec 268t | Jan 330t | Feb+ 330t
  const credit1 = await db.offsetCredit.create({
    data: {
      projectId: project1.id, poolId: pool1.id,
      quantity: new Decimal("136.4"), vintageYear: 2025,
      complianceMarket: "AB-TIER", status: "ISSUED",
      issuedAt: new Date("2025-12-10"),          // issued Dec
      abRegistryId: "AEOR-CRD-2025-001441",
      serialNumbers: ["AEOR-2025-001441-001", "AEOR-2025-001441-002"],
      mintAddress: "SIMULATED_MINT_TIER_001", onChainSignature: "SIMULATED_SIG_001",
    },
  })

  await db.offsetCredit.create({
    data: {
      projectId: project1.id, poolId: pool1.id,
      quantity: new Decimal("61.4"), vintageYear: 2025,
      complianceMarket: "CA-CFR", status: "ISSUED",
      issuedAt: new Date("2026-01-20"),          // issued Jan — stacked CFR
      serialNumbers: ["CFR-2025-001441-001"],
      mintAddress: "SIMULATED_MINT_CFR_001", onChainSignature: "SIMULATED_SIG_002",
    },
  })

  await db.offsetCredit.create({
    data: {
      projectId: project3.id, poolId: pool2.id,
      quantity: new Decimal("132.4"), vintageYear: 2025,
      complianceMarket: "AB-TIER", status: "ISSUED",
      issuedAt: new Date("2025-10-20"),          // issued Oct — first batch
      abRegistryId: "AEOR-CRD-2025-002218",
      serialNumbers: ["AEOR-2025-002218-001"],
      mintAddress: "SIMULATED_MINT_TIER_002", onChainSignature: "SIMULATED_SIG_003",
    },
  })

  // Retired credit (demonstrates provenance chain)
  const credit4 = await db.offsetCredit.create({
    data: {
      projectId: project1.id,
      quantity: new Decimal("38.2"), vintageYear: 2024,
      complianceMarket: "VOLUNTARY", status: "RETIRED",
      issuedAt:  new Date("2025-09-15"),         // issued before window
      retiredAt: new Date("2025-11-30"),         // retired Nov (shows in history)
      retiredBy: "Canpotex Limited",
      retirementReason: "Corporate scope 3 offset — 2024 fiscal year",
      serialNumbers: ["VOL-2025-PAL-001"],
    },
  })

  await db.creditTransfer.create({
    data: {
      creditId: credit1.id,
      fromOwner: "Bootstrap Carbon Cooperative", toOwner: "Canpotex Limited",
      price: new Decimal("7638.40"), currency: "CAD",
      txHash: "SIMULATED_TX_" + credit1.id.slice(0, 8),
    },
  })

  console.log("✓ 4 credits (3 issued, 1 retired) + 1 transfer")

  // ── CBAM packages ─────────────────────────────────────────
  // cbam_revenue_ytd (2026): Jan $15K | Feb $43K | Mar $43K
  await db.cBAMPackage.create({
    data: {
      organizationId: org1.id,
      facilityName: "Federated Co-op Fertilizers — Saskatoon",
      facilityType: "FERTILIZER", reportingYear: 2025,
      status: "submitted",
      totalCarbon: new Decimal("28450.000"), totalCost: new Decimal("15000.00"),
      currency: "CAD", createdAt: new Date("2026-01-15"),
      updatedAt: new Date("2026-01-15"),
    },
  })

  await db.cBAMPackage.create({
    data: {
      organizationId: org2.id,
      facilityName: "Nutrien Redwater Facility",
      facilityType: "FERTILIZER", reportingYear: 2025,
      status: "submitted",
      totalCarbon: new Decimal("94200.000"), totalCost: new Decimal("28000.00"),
      currency: "CAD", createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-02-01"),
    },
  })

  console.log("✓ 2 CBAM packages")

  // ── Summary ───────────────────────────────────────────────
  console.log(`
✅ Seed complete — 6-month growth curve baked in.

Demo logins:
  admin@palliser.example   /  admin123!   (ADMIN, Org 1 — SK)
  admin@parkland.example   /  admin123!   (ADMIN, Org 2 — AB)
  admin@northern.example   /  admin123!   (ADMIN, Org 3 — SK)
  manager@palliser.example /  farmer123!  (POOL_MANAGER)
  farmer@parkland.example  /  farmer123!  (FARMER)

Demo link (no login):  /demo

Metrics API:
  GET /api/admin/metrics         (snapshot)
  GET /api/admin/metrics/history (6-month series)
  Header: x-api-key: <METRICS_API_KEY>
`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
