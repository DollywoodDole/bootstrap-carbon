"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Layers, MapPin, TrendingUp, Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

interface Metrics {
  totalHectares:    number
  issuedThisYear:   number
  estimatedRevenue: number
  activePools:      number
  farmCount:        number
}

interface MetricCardsProps {
  metrics?: Metrics
  loading?: boolean
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-CA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtCad(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${fmt(n)}`
}

const cards = [
  {
    key:     "totalHectares" as keyof Metrics,
    label:   "Hectares monitored",
    icon:    MapPin,
    suffix:  " ha",
    sub:     (m: Metrics) => `${m.farmCount} registered farm${m.farmCount !== 1 ? "s" : ""}`,
    color:   "text-emerald-600",
    iconBg:  "bg-emerald-50",
  },
  {
    key:     "issuedThisYear" as keyof Metrics,
    label:   "Credits issued (YTD)",
    icon:    Leaf,
    suffix:  " tCO₂e",
    sub:     () => `${new Date().getFullYear()} vintage`,
    color:   "text-sky-600",
    iconBg:  "bg-sky-50",
  },
  {
    key:     "estimatedRevenue" as keyof Metrics,
    label:   "Est. credit revenue",
    icon:    TrendingUp,
    format:  fmtCad,
    sub:     () => "Market mid-price blend",
    color:   "text-violet-600",
    iconBg:  "bg-violet-50",
  },
  {
    key:     "activePools" as keyof Metrics,
    label:   "Active pools",
    icon:    Layers,
    sub:     () => "In verification or issued",
    color:   "text-amber-600",
    iconBg:  "bg-amber-50",
  },
]

export function MetricCards({ metrics, loading }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, suffix, format, sub, color, iconBg }) => (
        <Card key={key} className="gap-3">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </CardTitle>
              <div className={cn("rounded-md p-1.5", iconBg)}>
                <Icon className={cn("size-3.5", color)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {loading || !metrics ? (
              <>
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3.5 w-32 mt-1" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums leading-none">
                  {format
                    ? format(metrics[key] as number)
                    : `${fmt(metrics[key] as number)}${suffix ?? ""}`}
                </div>
                <p className="text-xs text-muted-foreground">{sub(metrics)}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
