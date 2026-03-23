// src/app/api/admin/metrics/route.ts
// Revenue metrics — required for acquisition readiness
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"

export async function GET() {
  const session = await getServerSession(authConfig)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [
    orgCount,
    farmCount,
    poolCount,
    creditCount,
    cbamCount,
    issuedCredits,
    retiredCredits,
  ] = await Promise.all([
    db.organization.count(),
    db.farm.count(),
    db.pool.count(),
    db.offsetCredit.count(),
    db.cBAMPackage.count(),
    db.offsetCredit.aggregate({
      where:  { status: "ISSUED" },
      _sum:   { quantity: true },
      _count: true,
    }),
    db.offsetCredit.aggregate({
      where:  { status: "RETIRED" },
      _sum:   { quantity: true },
      _count: true,
    }),
  ])

  const cbamRevenue = await db.cBAMPackage.aggregate({
    where: { status: { not: "draft" } },
    _sum:  { totalCost: true },
  })

  return NextResponse.json({
    data: {
      organizations: orgCount,
      farms:         farmCount,
      pools:         poolCount,
      credits: {
        total:   creditCount,
        issued:  issuedCredits._count,
        retired: retiredCredits._count,
        issuedTonnes:  Number(issuedCredits._sum.quantity  ?? 0),
        retiredTonnes: Number(retiredCredits._sum.quantity ?? 0),
      },
      cbam: {
        packages:       cbamCount,
        estimatedRevenue: Number(cbamRevenue._sum.totalCost ?? 0),
      },
      asOf: new Date().toISOString(),
    },
    success: true,
  })
}
