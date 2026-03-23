// src/app/api/admin/metrics/route.ts
// Acquisition-readiness revenue dashboard — system-wide, admin-only
// Auth: authenticated ADMIN session OR x-api-key: METRICS_API_KEY header

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"

// SaaS subscription fee per enrolled farm per month
const SAAS_FEE_PER_FARM_MONTH = 35

// Credit market prices $/tonne CO2e
const MARKET_PRICES: Record<string, number> = {
  "AB-TIER":   56,
  "CFR":       62,
  "CA-OBPS":   65,
  "VOLUNTARY": 75,
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const apiKey = req.headers.get("x-api-key")
  if (apiKey && process.env.METRICS_API_KEY && apiKey === process.env.METRICS_API_KEY) {
    return true
  }
  const session = await getServerSession(authConfig)
  return !!(session?.user && session.user.role === "ADMIN")
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  const [
    farmCount,
    hectaresAgg,
    activePools,
    issuedAgg,
    retiredAgg,
    issuedByMarket,
    cbamYtd,
    dataAssetFarms,
    activeMemberships,
    provinceSplit,
  ] = await Promise.all([
    // Total farms on platform
    db.farm.count(),

    // Total hectares enrolled
    db.farm.aggregate({ _sum: { totalHectares: true } }),

    // Active pools (past the FORMING stage)
    db.pool.count({
      where: { status: { not: "FORMING" } },
    }),

    // Issued credits (tonnes)
    db.offsetCredit.aggregate({
      where: { status: "ISSUED" },
      _sum:  { quantity: true },
    }),

    // Retired credits (tonnes)
    db.offsetCredit.aggregate({
      where: { status: "RETIRED" },
      _sum:  { quantity: true },
    }),

    // Issued credits grouped by market — for revenue calc
    db.offsetCredit.groupBy({
      by:    ["complianceMarket"],
      where: { status: "ISSUED" },
      _sum:  { quantity: true },
    }),

    // CBAM revenue year-to-date (non-draft packages created this calendar year)
    db.cBAMPackage.aggregate({
      where: { status: { not: "draft" }, createdAt: { gte: yearStart } },
      _sum:  { totalCost: true },
    }),

    // Data-asset farms: farms with at least one monitoring record
    db.farm.count({
      where: {
        projects: { some: { monitoringData: { some: {} } } },
      },
    }),

    // Farms currently enrolled in active (non-FORMING) pools
    db.poolMembership.count({
      where: { pool: { status: { not: "FORMING" } } },
    }),

    // Farm count by province
    db.farm.groupBy({
      by:     ["province"],
      _count: { id: true },
    }),
  ])

  // SaaS MRR — per-farm subscription on active pool enrolments
  const saasMrr = activeMemberships * SAAS_FEE_PER_FARM_MONTH

  // CBAM YTD
  const cbamRevenueYtd = Number(cbamYtd._sum.totalCost ?? 0)

  // Platform fee revenue (management fee on credit proceeds) — informational
  const creditRevenueByMarket = issuedByMarket.map(row => ({
    market:  row.complianceMarket,
    tonnes:  Number(row._sum.quantity ?? 0),
    revenue: Number(row._sum.quantity ?? 0) * (MARKET_PRICES[row.complianceMarket] ?? 56),
  }))
  const totalCreditRevenue = creditRevenueByMarket.reduce((s, r) => s + r.revenue, 0)

  // Province split map
  const provinceSplitMap = Object.fromEntries(
    provinceSplit.map(p => [p.province, p._count.id])
  ) as { SK?: number; AB?: number }

  return NextResponse.json({
    data: {
      total_farms:      farmCount,
      total_hectares:   Number(hectaresAgg._sum.totalHectares ?? 0),
      active_pools:     activePools,
      credits_issued:   Number(issuedAgg._sum.quantity  ?? 0),
      credits_retired:  Number(retiredAgg._sum.quantity ?? 0),
      saas_mrr:         saasMrr,
      cbam_revenue_ytd: cbamRevenueYtd,
      data_asset_farms: dataAssetFarms,
      province_split: {
        SK: provinceSplitMap.SK ?? 0,
        AB: provinceSplitMap.AB ?? 0,
      },
      // Supplemental detail for due diligence
      credit_revenue_by_market: creditRevenueByMarket,
      total_credit_revenue:     totalCreditRevenue,
      enrolled_farm_months:     activeMemberships,
      as_of: new Date().toISOString(),
    },
    success: true,
  })
}
