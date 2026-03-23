// prisma/seed.ts
// Demo data for dev + due diligence
// Run: npm run db:seed

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

// ── Organizations ─────────────────────────────────────────────
const ORGS = [
  {
    name:         "Palliser Grain Co-op",
    slug:         "palliser-grain",
    type:         "COOPERATIVE" as const,
    jurisdiction: "CA-SK",
  },
  {
    name:         "Parkland Carbon Solutions",
    slug:         "parkland-carbon",
    type:         "COOPERATIVE" as const,
    jurisdiction: "CA-AB",
  },
  {
    name:         "Northern Plains Cooperative",
    slug:         "northern-plains",
    type:         "COOPERATIVE" as const,
    jurisdiction: "CA-SK",
  },
]

// ── Farms per org ─────────────────────────────────────────────
const FARMS_ORG1 = [
  { name: "Wheatfield North",     province: "SK", municipality: "Moose Jaw RM",   totalHectares: 485,  lat: 50.39, lng: -105.53, soilZone: "Brown",     landClass: "2" },
  { name: "Mossbank Quarter",     province: "SK", municipality: "Mossbank",       totalHectares: 318,  lat: 49.93, lng: -105.97, soilZone: "Dark Brown", landClass: "2" },
  { name: "Creek Bottom",         province: "SK", municipality: "Wood River RM",  totalHectares: 220,  lat: 49.80, lng: -106.50, soilZone: "Dark Brown", landClass: "3" },
  { name: "Alkali Flats",         province: "SK", municipality: "Expanse",        totalHectares: 162,  lat: 49.72, lng: -105.80, soilZone: "Brown",     landClass: "4" },
]

const FARMS_ORG2 = [
  { name: "Lacombe Upper",        province: "AB", municipality: "Lacombe County", totalHectares: 640,  lat: 52.46, lng: -113.74, soilZone: "Black",     landClass: "1" },
  { name: "Ponoka East Section",  province: "AB", municipality: "Ponoka County",  totalHectares: 420,  lat: 52.68, lng: -113.58, soilZone: "Black",     landClass: "1" },
  { name: "Red Deer Bench",       province: "AB", municipality: "Red Deer County", totalHectares: 310, lat: 52.27, lng: -113.80, soilZone: "Dark Gray", landClass: "2" },
  { name: "Wetlands Block B",     province: "AB", municipality: "Lacombe County", totalHectares: 195,  lat: 52.51, lng: -113.90, soilZone: "Black",     landClass: "3" },
]

const FARMS_ORG3 = [
  { name: "Spiritwood Half",      province: "SK", municipality: "Spiritwood",     totalHectares: 390,  lat: 53.37, lng: -107.52, soilZone: "Gray",      landClass: "2" },
  { name: "Meadow Lake North",    province: "SK", municipality: "Meadow Lake",    totalHectares: 275,  lat: 54.13, lng: -108.44, soilZone: "Gray",      landClass: "3" },
  { name: "Prince Albert Quarter",province: "SK", municipality: "Prince Albert",  totalHectares: 188,  lat: 53.20, lng: -105.75, soilZone: "Dark Gray", landClass: "2" },
  { name: "Candle Lake Block",    province: "SK", municipality: "Candle Lake",    totalHectares: 142,  lat: 53.83, lng: -105.30, soilZone: "Gray",      landClass: "4" },
]

// ── Main seed ─────────────────────────────────────────────────
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
    db.session.deleteMany(),
    db.account.deleteMany(),
    db.user.deleteMany(),
    db.organization.deleteMany(),
  ])

  // ── Create organizations ──────────────────────────────────
  const [org1, org2, org3] = await Promise.all(
    ORGS.map(o => db.organization.create({ data: o }))
  )

  console.log(`✓ 3 organizations`)

  // ── Create admin + user per org ───────────────────────────
  const adminHash  = await hashPassword("admin123!")
  const farmerHash = await hashPassword("farmer123!")

  const [admin1, manager1] = await Promise.all([
    db.user.create({
      data: {
        name:          "Alice Palliser",
        email:         "admin@palliser.example",
        passwordHash:  adminHash,
        role:          "ADMIN",
        organizationId: org1.id,
      },
    }),
    db.user.create({
      data: {
        name:          "Bob Palliser",
        email:         "manager@palliser.example",
        passwordHash:  farmerHash,
        role:          "POOL_MANAGER",
        organizationId: org1.id,
      },
    }),
  ])

  const [admin2] = await Promise.all([
    db.user.create({
      data: {
        name:          "Carol Parkland",
        email:         "admin@parkland.example",
        passwordHash:  adminHash,
        role:          "ADMIN",
        organizationId: org2.id,
      },
    }),
    db.user.create({
      data: {
        name:          "Dave Parkland",
        email:         "farmer@parkland.example",
        passwordHash:  farmerHash,
        role:          "FARMER",
        organizationId: org2.id,
      },
    }),
  ])

  const [admin3] = await Promise.all([
    db.user.create({
      data: {
        name:          "Eve Northern",
        email:         "admin@northern.example",
        passwordHash:  adminHash,
        role:          "ADMIN",
        organizationId: org3.id,
      },
    }),
    db.user.create({
      data: {
        name:          "Frank Northern",
        email:         "farmer@northern.example",
        passwordHash:  farmerHash,
        role:          "FARMER",
        organizationId: org3.id,
      },
    }),
  ])

  console.log(`✓ 6 users (3 admins, 2 pool managers / farmers)`)

  // ── Create farms ──────────────────────────────────────────
  const farms1 = await Promise.all(
    FARMS_ORG1.map(f =>
      db.farm.create({
        data: { ...f, ownerId: admin1.id, organizationId: org1.id },
      })
    )
  )

  const farms2 = await Promise.all(
    FARMS_ORG2.map(f =>
      db.farm.create({
        data: { ...f, ownerId: admin2.id, organizationId: org2.id },
      })
    )
  )

  const farms3 = await Promise.all(
    FARMS_ORG3.map(f =>
      db.farm.create({
        data: { ...f, ownerId: admin3.id, organizationId: org3.id },
      })
    )
  )

  console.log(`✓ 12 farms`)

  // ── Create projects ───────────────────────────────────────
  const project1 = await db.project.create({
    data: {
      farmId:          farms1[0].id,
      name:            "Wheatfield North — No-Till Conversion",
      protocolId:      "conservation-cropping",
      protocolVersion: "2.1",
      stacksWith:      ["cfr-v1"],
      currentPractice: "conventional-till",
      projectPractice: "no-till",
      hectares:        farms1[0].totalHectares,
      status:          "VERIFIED",
      registeredDate:  new Date("2024-04-01"),
      verifiedDate:    new Date("2024-12-15"),
      expiryDate:      new Date("2029-04-01"),
      abRegistryId:    "AEOR-2024-CC-0441",
      crediting_period_years: 5,
    },
  })

  const project2 = await db.project.create({
    data: {
      farmId:          farms1[1].id,
      name:            "Mossbank — Reduced Till",
      protocolId:      "conservation-cropping",
      protocolVersion: "2.1",
      stacksWith:      [],
      currentPractice: "conventional-till",
      projectPractice: "reduced-till",
      hectares:        farms1[1].totalHectares,
      status:          "MONITORING",
      registeredDate:  new Date("2024-06-01"),
      expiryDate:      new Date("2029-06-01"),
      abRegistryId:    "AEOR-2024-CC-0489",
      crediting_period_years: 5,
    },
  })

  const project3 = await db.project.create({
    data: {
      farmId:          farms2[3].id,
      name:            "Wetlands Block B — Restoration",
      protocolId:      "wetland-restoration",
      protocolVersion: "1.3",
      stacksWith:      ["cfr-v1"],
      currentPractice: "drained",
      projectPractice: "restored",
      hectares:        farms2[3].totalHectares,
      status:          "VERIFIED",
      registeredDate:  new Date("2023-09-01"),
      verifiedDate:    new Date("2024-03-20"),
      expiryDate:      new Date("2033-09-01"),
      abRegistryId:    "AEOR-2023-WR-0218",
      crediting_period_years: 10,
    },
  })

  const project4 = await db.project.create({
    data: {
      farmId:          farms2[0].id,
      name:            "Lacombe Upper — No-Till (First Year)",
      protocolId:      "conservation-cropping",
      protocolVersion: "2.1",
      stacksWith:      ["cfr-v1"],
      currentPractice: "conventional-till",
      projectPractice: "no-till",
      hectares:        farms2[0].totalHectares,
      status:          "REGISTERED",
      registeredDate:  new Date("2025-03-01"),
      expiryDate:      new Date("2030-03-01"),
      crediting_period_years: 5,
    },
  })

  console.log(`✓ 4 projects`)

  // ── Add monitoring records ────────────────────────────────
  await db.monitoringRecord.createMany({
    data: [
      {
        projectId:          project1.id,
        recordedAt:         new Date("2024-12-01"),
        source:             "SATELLITE",
        baselineEmissions:  new Decimal("145.200"),
        projectEmissions:   new Decimal("89.340"),
        netReduction:       new Decimal("55.860"),
        dataHash:           "sha256:abc123" + project1.id.slice(0, 8),
      },
      {
        projectId:          project3.id,
        recordedAt:         new Date("2024-03-01"),
        source:             "THIRD_PARTY_AUDIT",
        baselineEmissions:  new Decimal("78.500"),
        projectEmissions:   new Decimal("12.300"),
        netReduction:       new Decimal("66.200"),
        dataHash:           "sha256:def456" + project3.id.slice(0, 8),
      },
    ],
  })

  // ── Create 2 active pools ─────────────────────────────────
  const totalHa1 = farms1[0].totalHectares + farms1[1].totalHectares + farms1[2].totalHectares
  const pool1 = await db.pool.create({
    data: {
      organizationId:  org1.id,
      name:            "Palliser No-Till Aggregation 2024",
      description:     "SK conventional to no-till conversion pool, 3 verified farms",
      province:        "SK",
      platformFeeRate: new Decimal("0.10"),
      totalHectares:   totalHa1,
      estimatedCredits: new Decimal("236.5"),
      verifierName:    "Carbon Verified Inc.",
      verifierLicense: "CVAB-2024-087",
      verificationCost: new Decimal("18500"),
      status:          "CREDITS_ISSUED",
      submittedDate:   new Date("2025-01-15"),
      verifiedDate:    new Date("2025-03-01"),
      memberships: {
        create: [
          {
            farmId:         farms1[0].id,
            contributionHa: farms1[0].totalHectares,
            creditShare:    new Decimal(farms1[0].totalHectares / totalHa1),
          },
          {
            farmId:         farms1[1].id,
            contributionHa: farms1[1].totalHectares,
            creditShare:    new Decimal(farms1[1].totalHectares / totalHa1),
          },
          {
            farmId:         farms1[2].id,
            contributionHa: farms1[2].totalHectares,
            creditShare:    new Decimal(farms1[2].totalHectares / totalHa1),
          },
        ],
      },
    },
  })

  const totalHa2 = farms2[0].totalHectares + farms2[1].totalHectares + farms2[2].totalHectares + farms2[3].totalHectares
  const pool2 = await db.pool.create({
    data: {
      organizationId:  org2.id,
      name:            "Parkland Wetland + Conservation Stack 2024",
      description:     "AB wetland restoration + no-till dual-issuance pool",
      province:        "AB",
      platformFeeRate: new Decimal("0.10"),
      totalHectares:   totalHa2,
      estimatedCredits: new Decimal("512.8"),
      verifierName:    "Prairie Verification Services",
      verifierLicense: "PVS-AB-2023-044",
      verificationCost: new Decimal("24000"),
      status:          "VERIFIED",
      submittedDate:   new Date("2024-10-01"),
      verifiedDate:    new Date("2025-02-14"),
      memberships: {
        create: [
          {
            farmId:         farms2[0].id,
            contributionHa: farms2[0].totalHectares,
            creditShare:    new Decimal(farms2[0].totalHectares / totalHa2),
          },
          {
            farmId:         farms2[1].id,
            contributionHa: farms2[1].totalHectares,
            creditShare:    new Decimal(farms2[1].totalHectares / totalHa2),
          },
          {
            farmId:         farms2[2].id,
            contributionHa: farms2[2].totalHectares,
            creditShare:    new Decimal(farms2[2].totalHectares / totalHa2),
          },
          {
            farmId:         farms2[3].id,
            contributionHa: farms2[3].totalHectares,
            creditShare:    new Decimal(farms2[3].totalHectares / totalHa2),
          },
        ],
      },
    },
  })

  console.log(`✓ 2 pools (1 credits-issued, 1 verified)`)

  // ── Issue credits ─────────────────────────────────────────
  const credit1 = await db.offsetCredit.create({
    data: {
      projectId:        project1.id,
      poolId:           pool1.id,
      quantity:         new Decimal("136.4"),
      vintageYear:      2024,
      complianceMarket: "AB-TIER",
      status:           "ISSUED",
      issuedAt:         new Date("2025-03-05"),
      abRegistryId:     "AEOR-CRD-2025-001441",
      serialNumbers:    ["AEOR-2025-001441-001", "AEOR-2025-001441-002"],
      mintAddress:      "SIMULATED_MINT_TIER_001",
      onChainSignature: "SIMULATED_SIG_001",
    },
  })

  const credit2 = await db.offsetCredit.create({
    data: {
      projectId:        project1.id,
      poolId:           pool1.id,
      quantity:         new Decimal("61.4"),
      vintageYear:      2024,
      complianceMarket: "CA-CFR",
      status:           "ISSUED",
      issuedAt:         new Date("2025-03-05"),
      serialNumbers:    ["CFR-2025-001441-001"],
      mintAddress:      "SIMULATED_MINT_CFR_001",
      onChainSignature: "SIMULATED_SIG_002",
    },
  })

  const credit3 = await db.offsetCredit.create({
    data: {
      projectId:        project3.id,
      poolId:           pool2.id,
      quantity:         new Decimal("132.4"),
      vintageYear:      2024,
      complianceMarket: "AB-TIER",
      status:           "ISSUED",
      issuedAt:         new Date("2025-02-20"),
      abRegistryId:     "AEOR-CRD-2025-002218",
      serialNumbers:    ["AEOR-2025-002218-001"],
      mintAddress:      "SIMULATED_MINT_TIER_002",
      onChainSignature: "SIMULATED_SIG_003",
    },
  })

  // Retire one credit (demonstrate the chain)
  const credit4 = await db.offsetCredit.create({
    data: {
      projectId:        project1.id,
      quantity:         new Decimal("38.2"),
      vintageYear:      2023,
      complianceMarket: "VOLUNTARY",
      status:           "RETIRED",
      issuedAt:         new Date("2024-07-10"),
      retiredAt:        new Date("2024-11-30"),
      retiredBy:        "Canpotex Limited",
      retirementReason: "Corporate scope 3 offset — 2023 fiscal year",
      serialNumbers:    ["VOL-2024-PAL-001"],
    },
  })

  // Credit transfer provenance record
  await db.creditTransfer.create({
    data: {
      creditId:  credit1.id,
      fromOwner: "Bootstrap Carbon Cooperative",
      toOwner:   "Canpotex Limited",
      price:     new Decimal("4564.00"),
      currency:  "CAD",
      txHash:    "SIMULATED_TX_" + credit1.id.slice(0, 8),
    },
  })

  console.log(`✓ 4 credits (3 issued, 1 retired) + 1 transfer`)

  // ── CBAM packages ─────────────────────────────────────────
  await db.cBAMPackage.createMany({
    data: [
      {
        organizationId: org1.id,
        facilityName:   "Federated Co-op Fertilizers — Saskatoon",
        facilityType:   "FERTILIZER",
        reportingYear:  2024,
        status:         "submitted",
        totalCarbon:    new Decimal("28450.000"),
        totalCost:      new Decimal("15000.00"),
        currency:       "CAD",
      },
      {
        organizationId: org2.id,
        facilityName:   "Nutrien Redwater Facility",
        facilityType:   "FERTILIZER",
        reportingYear:  2024,
        status:         "draft",
        totalCarbon:    new Decimal("94200.000"),
        totalCost:      new Decimal("15000.00"),
        currency:       "CAD",
      },
    ],
  })

  console.log(`✓ 2 CBAM packages`)

  // ── Summary ───────────────────────────────────────────────
  console.log(`
✅ Seed complete.

Demo logins:
  admin@palliser.example  /  admin123!   (ADMIN, Org 1 — SK)
  admin@parkland.example  /  admin123!   (ADMIN, Org 2 — AB)
  admin@northern.example  /  admin123!   (ADMIN, Org 3 — SK)
  manager@palliser.example / farmer123!  (POOL_MANAGER)
  farmer@parkland.example  / farmer123!  (FARMER)
`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
