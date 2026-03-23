// src/app/api/dashboard/metrics/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"

export async function GET() {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgId = session.user.organizationId
  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  const [
    hectaresResult,
    creditsThisYear,
    activePools,
    allTimeTonnes,
    poolsData,
    farmCount,
  ] = await Promise.all([
    db.farm.aggregate({
      where: { organizationId: orgId },
      _sum: { totalHectares: true },
    }),
    db.offsetCredit.aggregate({
      where: {
        project: { farm: { organizationId: orgId } },
        status: "ISSUED",
        issuedAt: { gte: yearStart },
      },
      _sum: { quantity: true },
      _count: true,
    }),
    db.pool.count({
      where: {
        organizationId: orgId,
        status: { in: ["FORMING", "SUBMITTED", "UNDER_VERIFICATION", "VERIFIED", "CREDITS_ISSUED"] },
      },
    }),
    db.offsetCredit.aggregate({
      where: {
        project: { farm: { organizationId: orgId } },
        status: "ISSUED",
      },
      _sum: { quantity: true },
    }),
    db.pool.findMany({
      where: { organizationId: orgId },
      include: {
        memberships: {
          include: { farm: { select: { name: true, totalHectares: true } } },
        },
        credits: {
          select: { quantity: true, status: true, complianceMarket: true },
        },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.farm.count({ where: { organizationId: orgId } }),
  ])

  const totalHectares    = Number(hectaresResult._sum.totalHectares ?? 0)
  const issuedThisYear   = Number(creditsThisYear._sum.quantity ?? 0)
  const allTimeTonnesNum = Number(allTimeTonnes._sum.quantity ?? 0)

  // Revenue estimate: AB-TIER @ $56, CFR @ $62, Voluntary @ $75
  const creditsByMarket = await db.offsetCredit.groupBy({
    by: ["complianceMarket"],
    where: {
      project: { farm: { organizationId: orgId } },
      status: "ISSUED",
    },
    _sum: { quantity: true },
  })

  const MARKET_PRICES: Record<string, number> = {
    "AB-TIER":  56,
    "CA-OBPS":  58,
    "CA-CFR":   62,
    "VOLUNTARY": 75,
  }

  const estimatedRevenue = creditsByMarket.reduce((sum, row) => {
    const price = MARKET_PRICES[row.complianceMarket] ?? 56
    return sum + (Number(row._sum.quantity ?? 0) * price)
  }, 0)

  // Serialize pools — Prisma Decimals become strings in JSON; cast explicitly
  const pools = poolsData.map(p => ({
    id:               p.id,
    name:             p.name,
    province:         p.province,
    status:           p.status,
    totalHectares:    p.totalHectares,
    estimatedCredits: p.estimatedCredits !== null ? Number(p.estimatedCredits) : null,
    platformFeeRate:  Number(p.platformFeeRate),
    verifierName:     p.verifierName,
    farmCount:        p._count.memberships,
    farms:            p.memberships.map(m => ({
      id:            m.farm.name,
      name:          m.farm.name,
      hectares:      m.farm.totalHectares,
      creditShare:   Number(m.creditShare),
    })),
    issuedTonnes: p.credits
      .filter(c => c.status === "ISSUED")
      .reduce((s: number, c) => s + Number(c.quantity), 0),
    markets: [...new Set(p.credits.map(c => c.complianceMarket))],
    createdAt: p.createdAt.toISOString(),
    verifiedDate: p.verifiedDate?.toISOString() ?? null,
  }))

  return NextResponse.json({
    data: {
      metrics: {
        totalHectares,
        issuedThisYear,
        allTimeTonnes: allTimeTonnesNum,
        estimatedRevenue,
        activePools,
        farmCount,
        creditCount: creditsThisYear._count,
      },
      pools,
    },
    success: true,
  })
}
