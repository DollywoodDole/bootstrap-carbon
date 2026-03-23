// src/app/api/admin/metrics/history/route.ts
// 6-month time-series of the same fields as /api/admin/metrics.
// Computed in memory from raw event timestamps — 5 DB queries total.
// Auth: same as /api/admin/metrics (session ADMIN or x-api-key header).

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"

const MARKET_PRICES: Record<string, number> = {
  "AB-TIER":   56,
  "CFR":       62,
  "CA-CFR":    62,
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

// Returns { start, end } for a month N months before now (0 = current month).
function monthWindow(monthsAgo: number): { start: Date; end: Date; label: string } {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() - monthsAgo)
  const start = new Date(d)
  const end   = new Date(d)
  end.setMonth(end.getMonth() + 1)
  return { start, end, label: d.toISOString().slice(0, 7) }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 5 queries — fetch raw event data, compute snapshots in JS
  const [farms, credits, pools, subscriptions, cbam] = await Promise.all([
    db.farm.findMany({
      select: { createdAt: true, totalHectares: true, province: true },
    }),
    db.offsetCredit.findMany({
      select: {
        quantity: true,
        status: true,
        complianceMarket: true,
        issuedAt: true,
        retiredAt: true,
      },
    }),
    db.pool.findMany({
      select: { status: true, submittedDate: true, createdAt: true },
    }),
    db.subscription.findMany({
      select: {
        monthlyRate: true,
        status: true,
        startDate: true,
        cancelledAt: true,
      },
    }),
    db.cBAMPackage.findMany({
      select: { totalCost: true, status: true, createdAt: true },
    }),
  ])

  // Generate last 6 months oldest→newest
  const windows = Array.from({ length: 6 }, (_, i) => monthWindow(5 - i))

  const series = windows.map(({ start, end, label }) => {
    const yearStart = new Date(end.getFullYear(), 0, 1)

    const activeFarms = farms.filter(f => f.createdAt < end)

    const totalFarms    = activeFarms.length
    const totalHectares = activeFarms.reduce((s, f) => s + f.totalHectares, 0)

    const provinceSplit = { SK: 0, AB: 0 } as Record<string, number>
    for (const f of activeFarms) {
      provinceSplit[f.province] = (provinceSplit[f.province] ?? 0) + 1
    }

    // Pool is "active" once it passes the FORMING stage (submittedDate set)
    const activePools = pools.filter(p => {
      if (p.status === "FORMING") return false
      const activeFrom = p.submittedDate ?? p.createdAt
      return activeFrom < end
    }).length

    // All credits ever issued by end of this month
    const creditsIssued = credits
      .filter(c => c.issuedAt != null && c.issuedAt < end)
      .reduce((s, c) => s + Number(c.quantity), 0)

    const creditsRetired = credits
      .filter(c => c.retiredAt != null && c.retiredAt < end)
      .reduce((s, c) => s + Number(c.quantity), 0)

    // MRR: subscriptions active during any part of this month
    const saasMrr = subscriptions
      .filter(s =>
        s.startDate < end &&
        (!s.cancelledAt || s.cancelledAt >= start)
      )
      .reduce((s, sub) => s + Number(sub.monthlyRate), 0)

    // CBAM YTD: non-draft packages created within this calendar year, up to month end
    const cbamRevenueYtd = cbam
      .filter(c =>
        c.status !== "draft" &&
        c.createdAt >= yearStart &&
        c.createdAt < end
      )
      .reduce((s, c) => s + Number(c.totalCost), 0)

    // Credit revenue by market at this point in time
    const byMarket: Record<string, number> = {}
    for (const c of credits) {
      if (c.issuedAt != null && c.issuedAt < end) {
        const price = MARKET_PRICES[c.complianceMarket] ?? 56
        byMarket[c.complianceMarket] =
          (byMarket[c.complianceMarket] ?? 0) + Number(c.quantity) * price
      }
    }
    const totalCreditRevenue = Object.values(byMarket).reduce((s, v) => s + v, 0)

    return {
      month:                label,
      total_farms:          totalFarms,
      total_hectares:       Math.round(totalHectares),
      active_pools:         activePools,
      credits_issued:       Math.round(creditsIssued * 10) / 10,
      credits_retired:      Math.round(creditsRetired * 10) / 10,
      saas_mrr:             Math.round(saasMrr),
      cbam_revenue_ytd:     Math.round(cbamRevenueYtd),
      total_credit_revenue: Math.round(totalCreditRevenue),
      province_split: {
        SK: provinceSplit.SK ?? 0,
        AB: provinceSplit.AB ?? 0,
      },
    }
  })

  return NextResponse.json({
    data: {
      series,
      period: {
        from: windows[0].label,
        to:   windows[windows.length - 1].label,
      },
    },
    success: true,
  })
}
