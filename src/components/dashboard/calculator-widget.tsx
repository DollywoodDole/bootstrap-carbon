"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ArrowRight, Sparkles, AlertTriangle, TrendingUp } from "lucide-react"

// JSON-serialised version of OptimizationResult
interface CalcResult {
  protocolId:              string
  protocolName:            string
  practice:                string
  baseCreditsAnnual:       number
  stackedCreditsAnnual:    number
  stackingMultiplier:      number
  stackingUpliftPercent:   number
  cfrEligible:             boolean
  estimatedAnnualRevenue:  number
  recommendationScore:     number
}

interface FormState {
  hectares:        string
  province:        "SK" | "AB"
  currentPractice: string
  isFirstYear:     boolean
}

const PRACTICES = [
  { value: "conventional-till", label: "Conventional till" },
  { value: "minimum-till",      label: "Minimum till" },
  { value: "no-till",           label: "No-till (established)" },
  { value: "drained",           label: "Drained wetland" },
  { value: "open-lagoon",       label: "Open manure lagoon" },
  { value: "standard-feeding",  label: "Standard cattle feeding" },
]

function fmt(n: number, d = 1) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: d, maximumFractionDigits: d })
}

function fmtCad(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n).toLocaleString("en-CA")}`
}

function ResultPanel({ result, isTop }: { result: CalcResult; isTop: boolean }) {
  const uplift  = result.stackingUpliftPercent
  const hasStack = result.cfrEligible && uplift > 0

  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-4 transition-all",
      isTop ? "border-primary/30 bg-primary/[0.02] ring-1 ring-primary/20" : "border-border bg-muted/20"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isTop && <Badge className="text-[10px] h-4 px-1.5">Best match</Badge>}
            {hasStack && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5">
                <Sparkles className="size-2.5" />
                CFR stackable
              </Badge>
            )}
            {result.practice.includes("first") && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                First-year bonus
              </Badge>
            )}
          </div>
          <p className="font-semibold text-sm mt-1 leading-tight">{result.protocolName}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {result.practice.replace(/-/g, " ")}
          </p>
        </div>
      </div>

      <Separator />

      {/* Base vs Stacked comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Base (AB-TIER only)
          </p>
          <p className="text-xl font-bold tabular-nums leading-none">
            {fmt(result.baseCreditsAnnual)}
            <span className="text-xs font-normal text-muted-foreground ml-1">t/yr</span>
          </p>
        </div>

        {hasStack ? (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              With CFR stacking
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-bold tabular-nums leading-none text-primary">
                {fmt(result.stackedCreditsAnnual)}
                <span className="text-xs font-normal text-muted-foreground ml-1">t/yr</span>
              </p>
              <span className="text-[11px] font-semibold text-emerald-600 tabular-nums">
                +{uplift}%
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              CFR stacking
            </p>
            <div className="flex items-center gap-1 text-muted-foreground">
              <AlertTriangle className="size-3.5 text-amber-500" />
              <span className="text-xs">Not eligible</span>
            </div>
          </div>
        )}
      </div>

      {/* Revenue */}
      <div className="rounded-lg bg-background border px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="size-3.5" />
          <span>Est. annual revenue</span>
        </div>
        <span className="font-bold tabular-nums text-sm">
          {fmtCad(result.estimatedAnnualRevenue)}
          <span className="text-xs font-normal text-muted-foreground">/yr</span>
        </span>
      </div>

      {hasStack && (
        <div className="text-[11px] text-muted-foreground leading-snug bg-muted/50 rounded-lg px-3 py-2">
          Stacking multiplier: <strong className="text-foreground">{result.stackingMultiplier.toFixed(2)}×</strong>
          {" "}— One project, two compliance markets, no incremental land.
        </div>
      )}
    </div>
  )
}

export function CalculatorWidget() {
  const [form, setForm] = useState<FormState>({
    hectares:        "",
    province:        "SK",
    currentPractice: "",
    isFirstYear:     false,
  })
  const [submitted, setSubmitted] = useState<FormState | null>(null)

  const { data, isFetching, error } = useQuery<CalcResult[]>({
    queryKey: ["calc-optimize", submitted],
    queryFn: async () => {
      if (!submitted) return []
      const res = await fetch("/api/calculator", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode:              "optimize",
          hectares:          Number(submitted.hectares),
          province:          submitted.province,
          currentPractice:   submitted.currentPractice,
          isFirstYearSwitch: submitted.isFirstYear,
          hasLivestock:      false,
          hasWetlands:       submitted.currentPractice === "drained",
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data as CalcResult[]
    },
    enabled:         !!submitted,
    staleTime:       Infinity,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.hectares || !form.currentPractice) return
    setSubmitted({ ...form })
  }

  const results = data ?? []

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* Form */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Protocol optimizer</CardTitle>
          <CardDescription>
            Find the highest-yield protocol for your farm, including CFR stacking opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hectares" className="text-xs font-medium">
                  Hectares
                </Label>
                <Input
                  id="hectares"
                  type="number"
                  min="1"
                  max="100000"
                  placeholder="e.g. 320"
                  value={form.hectares}
                  onChange={e => setForm(f => ({ ...f, hectares: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Province</Label>
                <Select
                  value={form.province}
                  onValueChange={(v: string | null) => {
                    if (v) setForm(f => ({ ...f, province: v as "SK" | "AB" }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SK">Saskatchewan</SelectItem>
                    <SelectItem value="AB">Alberta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Current practice</Label>
              <Select
                value={form.currentPractice}
                onValueChange={(v: string | null) => {
                  if (v) setForm(f => ({ ...f, currentPractice: v }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select current practice" />
                </SelectTrigger>
                <SelectContent>
                  {PRACTICES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={form.isFirstYear}
                  onChange={e => setForm(f => ({ ...f, isFirstYear: e.target.checked }))}
                  className="peer sr-only"
                />
                <div className="size-4 rounded border border-input bg-background peer-checked:bg-primary peer-checked:border-primary transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                  <svg viewBox="0 0 10 8" className="size-2.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium leading-none">First-year conversion</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adds 35% additionality premium for new no-till switches
                </p>
              </div>
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={isFetching || !form.currentPractice}
            >
              {isFetching ? (
                <>Calculating…</>
              ) : (
                <>
                  Calculate
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-3">
        {isFetching ? (
          <>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-64" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
            <AlertTriangle className="size-5 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Calculation failed"}
            </p>
          </div>
        ) : !submitted ? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed text-center">
            <div className="px-4">
              <Sparkles className="size-6 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Enter farm details to see protocol recommendations and stacking opportunities.
              </p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed text-center">
            <p className="text-sm text-muted-foreground px-4">
              No protocols matched these inputs.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-0.5">
              Top {results.length} protocol{results.length !== 1 ? "s" : ""} for{" "}
              {Number(submitted.hectares).toLocaleString("en-CA")} ha in {submitted.province}
            </p>
            {results.slice(0, 3).map((r, i) => (
              <ResultPanel key={`${r.protocolId}-${r.practice}`} result={r} isTop={i === 0} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
