// src/app/metrics-dashboard/page.tsx
// Investor / buyer due-diligence dashboard.
// No login required. Auth via ?key=<METRICS_API_KEY> query param.
// Share as: https://bootstrap-carbon.vercel.app/metrics-dashboard?key=THEIR_KEY

import { db } from "@/lib/db/client"
import { GrowthChart } from "@/components/metrics/growth-chart"

// ── Types ──────────────────────────────────────────────────
interface HistoryPoint {
  month:                string
  total_farms:          number
  total_hectares:       number
  active_pools:         number
  credits_issued:       number
  credits_retired:      number
  saas_mrr:             number
  cbam_revenue_ytd:     number
  total_credit_revenue: number
}

// ── Helpers ────────────────────────────────────────────────
const MARKET_PRICES: Record<string, number> = {
  "AB-TIER":   56,
  "CFR":       62,
  "CA-CFR":    62,
  "CA-OBPS":   65,
  "VOLUNTARY": 75,
}

function monthWindow(monthsAgo: number) {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() - monthsAgo)
  const start = new Date(d)
  const end   = new Date(d)
  end.setMonth(end.getMonth() + 1)
  return { start, end, label: d.toISOString().slice(0, 7) }
}

function fmtN(n: number, d = 0) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: d, maximumFractionDigits: d })
}
function fmtCad(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}
function fmtMonth(m: string) {
  const [y, mo] = m.split("-")
  return new Date(Number(y), Number(mo) - 1, 1)
    .toLocaleString("en-CA", { month: "short", year: "numeric" })
}

// ── Data fetching ──────────────────────────────────────────
async function fetchAll() {
  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  const [
    farms, credits, pools, subscriptions, cbam,
    issuedAgg, retiredAgg, subscriptionMrr, provinceSplit,
  ] = await Promise.all([
    db.farm.findMany({ select: { createdAt: true, totalHectares: true, province: true } }),
    db.offsetCredit.findMany({ select: { quantity: true, status: true, complianceMarket: true, issuedAt: true, retiredAt: true } }),
    db.pool.findMany({ select: { status: true, submittedDate: true, createdAt: true } }),
    db.subscription.findMany({ select: { monthlyRate: true, status: true, startDate: true, cancelledAt: true } }),
    db.cBAMPackage.findMany({ select: { totalCost: true, status: true, createdAt: true } }),
    // Snapshot aggregates
    db.offsetCredit.aggregate({ where: { status: "ISSUED" },  _sum: { quantity: true } }),
    db.offsetCredit.aggregate({ where: { status: "RETIRED" }, _sum: { quantity: true } }),
    db.subscription.aggregate({ where: { status: "ACTIVE" }, _sum: { monthlyRate: true }, _count: true }),
    db.farm.groupBy({ by: ["province"], _count: { id: true } }),
  ])

  // ── Snapshot ──
  const totalFarms    = farms.length
  const totalHectares = farms.reduce((s, f) => s + f.totalHectares, 0)
  const activePools   = pools.filter(p => p.status !== "FORMING").length
  const dataFarms     = new Set(credits.filter(c => c.issuedAt).map(() => 0)).size  // placeholder
  const cbamYtd       = cbam.filter(c => c.status !== "draft" && c.createdAt >= yearStart).reduce((s, c) => s + Number(c.totalCost), 0)
  const splitMap      = Object.fromEntries(provinceSplit.map(p => [p.province, p._count.id])) as Record<string, number>

  const snapshot = {
    total_farms:          totalFarms,
    total_hectares:       totalHectares,
    active_pools:         activePools,
    credits_issued:       Number(issuedAgg._sum.quantity  ?? 0),
    credits_retired:      Number(retiredAgg._sum.quantity ?? 0),
    saas_mrr:             Math.round(Number(subscriptionMrr._sum.monthlyRate ?? 0)),
    active_subscriptions: subscriptionMrr._count,
    cbam_revenue_ytd:     cbamYtd,
    province_split:       { SK: splitMap.SK ?? 0, AB: splitMap.AB ?? 0 },
    as_of:                new Date().toISOString(),
  }

  // ── 6-month series ──
  const windows = Array.from({ length: 6 }, (_, i) => monthWindow(5 - i))

  const series: HistoryPoint[] = windows.map(({ start, end, label }) => {
    const yearS    = new Date(end.getFullYear(), 0, 1)
    const active   = farms.filter(f => f.createdAt < end)
    const mrr      = subscriptions.filter(s => s.startDate < end && (!s.cancelledAt || s.cancelledAt >= start)).reduce((s, sub) => s + Number(sub.monthlyRate), 0)
    const issued   = credits.filter(c => c.issuedAt != null && c.issuedAt < end).reduce((s, c) => s + Number(c.quantity), 0)
    const retired  = credits.filter(c => c.retiredAt != null && c.retiredAt < end).reduce((s, c) => s + Number(c.quantity), 0)
    const cbamYtdM = cbam.filter(c => c.status !== "draft" && c.createdAt >= yearS && c.createdAt < end).reduce((s, c) => s + Number(c.totalCost), 0)
    const byMarket: Record<string, number> = {}
    for (const c of credits) {
      if (c.issuedAt != null && c.issuedAt < end) {
        byMarket[c.complianceMarket] = (byMarket[c.complianceMarket] ?? 0) + Number(c.quantity) * (MARKET_PRICES[c.complianceMarket] ?? 56)
      }
    }
    return {
      month:                label,
      total_farms:          active.length,
      total_hectares:       Math.round(active.reduce((s, f) => s + f.totalHectares, 0)),
      active_pools:         pools.filter(p => p.status !== "FORMING" && (p.submittedDate ?? p.createdAt) < end).length,
      credits_issued:       Math.round(issued * 10) / 10,
      credits_retired:      Math.round(retired * 10) / 10,
      saas_mrr:             Math.round(mrr),
      cbam_revenue_ytd:     Math.round(cbamYtdM),
      total_credit_revenue: Math.round(Object.values(byMarket).reduce((s, v) => s + v, 0)),
    }
  })

  return { snapshot, series }
}

// ── Access denied page ─────────────────────────────────────
function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm px-6">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="text-sm font-semibold text-gray-900">API key required</h1>
        <p className="text-xs text-gray-500 mt-1">
          Append <code className="bg-gray-100 px-1 rounded">?key=YOUR_KEY</code> to the URL.
          Contact Bootstrap Carbon for access.
        </p>
      </div>
    </div>
  )
}

// ── Metric card ────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${highlight ? "border-emerald-200 bg-emerald-50/60" : "bg-white"}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`text-2xl font-bold tabular-nums mt-0.5 leading-none ${highlight ? "text-emerald-700" : "text-gray-900"}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────
export default async function MetricsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams

  if (!key || !process.env.METRICS_API_KEY || key !== process.env.METRICS_API_KEY) {
    return <AccessDenied />
  }

  const { snapshot, series } = await fetchAll()
  const s = snapshot

  // MRR delta (current vs 3 months ago)
  const mrrNow  = series[series.length - 1].saas_mrr
  const mrrPrev = series[series.length - 4]?.saas_mrr ?? 0
  const mrrDelta = mrrPrev > 0 ? Math.round(((mrrNow - mrrPrev) / mrrPrev) * 100) : null

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Bootstrap Carbon
            </p>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Due Diligence Metrics
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Live data · Read-only · Palliser Cooperative
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Snapshot cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Total farms"
            value={fmtN(s.total_farms)}
            sub={`${s.province_split.SK} SK · ${s.province_split.AB} AB`}
          />
          <MetricCard
            label="Hectares"
            value={fmtN(s.total_hectares)}
            sub="enrolled"
          />
          <MetricCard
            label="Active pools"
            value={fmtN(s.active_pools)}
            sub="in verification+"
          />
          <MetricCard
            label="Credits issued"
            value={`${fmtN(s.credits_issued, 1)}t`}
            sub="CO₂e tonnes"
          />
          <MetricCard
            label="SaaS MRR"
            value={fmtCad(s.saas_mrr)}
            sub={mrrDelta != null ? `+${mrrDelta}% (3mo)` : `${s.active_subscriptions} org${s.active_subscriptions !== 1 ? "s" : ""}`}
            highlight
          />
        </div>

        {/* Charts */}
        <div className="rounded-xl border bg-white px-6 py-5">
          <GrowthChart
            data={series.map(p => ({
              month:          p.month,
              total_farms:    p.total_farms,
              total_hectares: p.total_hectares,
              saas_mrr:       p.saas_mrr,
              credits_issued: p.credits_issued,
            }))}
          />
        </div>

        {/* Data table */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-900">6-month detail</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {fmtMonth(series[0].month)} — {fmtMonth(series[series.length - 1].month)}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50">
                  {["Month", "Farms", "Hectares", "Pools", "Credits (t)", "MRR", "CBAM YTD", "Credit Revenue"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {series.map((row, i) => (
                  <tr key={row.month} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">{fmtMonth(row.month)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-900">{row.total_farms}</td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-900">{fmtN(row.total_hectares)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-900">{row.active_pools}</td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-900">{fmtN(row.credits_issued, 1)}</td>
                    <td className="px-4 py-2.5 tabular-nums font-medium text-emerald-700">{fmtCad(row.saas_mrr)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-900">{fmtCad(row.cbam_revenue_ytd)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-900">{fmtCad(row.total_credit_revenue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-gray-50 font-semibold">
                  <td className="px-4 py-2.5 text-gray-700">Current</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-900">{s.total_farms}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-900">{fmtN(s.total_hectares)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-900">{s.active_pools}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-900">{fmtN(s.credits_issued, 1)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-emerald-700">{fmtCad(s.saas_mrr)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-900">{fmtCad(s.cbam_revenue_ytd)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-900">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pb-4">
          <span>
            Data as of{" "}
            <span className="tabular-nums text-gray-500 font-medium">
              {new Date(s.as_of).toLocaleString("en-CA", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "America/Regina",
              })} CST
            </span>
          </span>
          <span>Bootstrap Carbon · Confidential</span>
        </div>

      </div>
    </div>
  )
}
