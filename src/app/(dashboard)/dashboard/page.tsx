"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { PoolsTable } from "@/components/dashboard/pools-table"
import { CalculatorWidget } from "@/components/dashboard/calculator-widget"
import { Separator } from "@/components/ui/separator"
import type { PoolRow } from "@/components/dashboard/pools-table"

interface DashboardData {
  metrics: {
    totalHectares:    number
    issuedThisYear:   number
    allTimeTonnes:    number
    estimatedRevenue: number
    activePools:      number
    farmCount:        number
    creditCount:      number
  }
  pools: PoolRow[]
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn:  () => fetch("/api/dashboard/metrics").then(r => r.json()).then(r => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Portfolio overview and protocol optimizer
        </p>
      </div>

      {/* Metric cards */}
      <MetricCards metrics={data?.metrics} loading={isLoading} />

      {/* Pools */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Aggregation pools</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pools owned by your cooperative
            </p>
          </div>
          {data?.pools && data.pools.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {data.pools.length} pool{data.pools.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <PoolsTable pools={data?.pools} loading={isLoading} />
      </section>

      <Separator />

      {/* Calculator */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Protocol optimizer</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Model credit yield and CFR stacking revenue for any farm profile
          </p>
        </div>
        <CalculatorWidget />
      </section>
    </div>
  )
}
