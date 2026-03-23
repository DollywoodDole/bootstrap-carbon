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
import { ArrowRight, Sparkles, AlertTriangle, TrendingUp, FlaskConical, Zap, X } from "lucide-react"

interface CalcResult {
  protocolId:             string
  protocolName:           string
  practice:               string
  baseCreditsAnnual:      number
  stackedCreditsAnnual:   number
  stackingMultiplier:     number
  stackingUpliftPercent:  number
  cfrEligible:            boolean
  estimatedAnnualRevenue: number
  recommendationScore:    number
}

interface FormState {
  hectares:        string
  province:        "SK" | "AB"
  currentPractice: string
  hasLivestock:    boolean
  hasWetlands:     boolean
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

const CHECKBOXES = [
  {
    key:   "isFirstYear",
    label: "First-year conversion",
    desc:  "Adds 35% additionality premium for new no-till switches",
  },
  {
    key:   "hasLivestock",
    label: "Has livestock",
    desc:  "Enables enteric fermentation & manure management protocols",
  },
  {
    key:   "hasWetlands",
    label: "Has wetlands",
    desc:  "Enables wetland restoration protocol",
  },
]

function fmt(n: number, d = 1) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: d, maximumFractionDigits: d })
}

function fmtCad(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n).toLocaleString("en-CA")}`
}

function StackingMultiplier({
  multiplier,
  cfrEligible,
}: {
  multiplier: number
  cfrEligible: boolean
}) {
  if (!cfrEligible || multiplier <= 1) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 px-4 py-3 min-w-[96px] text-center">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
          CFR stack
        </p>
        <div className="flex items-center gap-1 text-muted-foreground">
          <X className="size-3.5" />
          <span className="text-xs">Not eligible</span>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-primary/[0.07] border border-primary/25 px-4 py-3 min-w-[96px] text-center">
      <p className="text-[10px] uppercase tracking-wide text-primary/70 font-medium mb-0.5">
        CFR multiplier
      </p>
      <p className="text-[28px] font-black tabular-nums text-primary leading-none">
        {multiplier.toFixed(2)}<span className="text-lg">×</span>
      </p>
      <p className="text-[10px] text-primary/60 mt-0.5">AB-TIER + CFR</p>
    </div>
  )
}

function ResultCard({ result, rank }: { result: CalcResult; rank: number }) {
  const isTop  = rank === 1
  const uplift = result.stackingUpliftPercent
  const hasStack = result.cfrEligible && uplift > 0

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        isTop
          ? "border-primary/30 bg-primary/[0.02] ring-1 ring-primary/20"
          : "border-border bg-card"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5",
            isTop ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {rank}
        </div>

        {/* Protocol info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {isTop && (
              <Badge className="text-[10px] h-4 px-1.5">Best match</Badge>
            )}
            {result.cfrEligible && (
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
          <p className="font-semibold text-sm leading-tight">{result.protocolName}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {result.practice.replace(/-/g, " ")}
          </p>
        </div>

        {/* CFR stacking multiplier — hero metric */}
        <StackingMultiplier
          multiplier={result.stackingMultiplier}
          cfrEligible={result.cfrEligible}
        />
      </div>

      <Separator className="my-3" />

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Base (AB-TIER)
          </p>
          <p className="text-xl font-bold tabular-nums leading-none">
            {fmt(result.baseCreditsAnnual)}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">t/yr</span>
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            {hasStack ? "With CFR stack" : "Stacked"}
          </p>
          {hasStack ? (
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-bold tabular-nums leading-none text-primary">
                {fmt(result.stackedCreditsAnnual)}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">t/yr</span>
              </p>
              <span className="text-[11px] font-semibold text-emerald-600">+{uplift}%</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
            <TrendingUp className="size-3" />
            Est. revenue
          </p>
          <p className="text-xl font-bold tabular-nums leading-none">
            {fmtCad(result.estimatedAnnualRevenue)}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">/yr</span>
          </p>
        </div>
      </div>

      {/* CFR stacking note */}
      {hasStack && (
        <div className="mt-3 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 leading-snug">
          Stacking multiplier:{" "}
          <strong className="text-foreground">{result.stackingMultiplier.toFixed(2)}×</strong>
          {" "}— One project, two compliance markets, no incremental land.
        </div>
      )}
    </div>
  )
}

export default function CalculatorPage() {
  const [form, setForm] = useState<FormState>({
    hectares:        "",
    province:        "SK",
    currentPractice: "",
    hasLivestock:    false,
    hasWetlands:     false,
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
          hasLivestock:      submitted.hasLivestock,
          hasWetlands:       submitted.hasWetlands || submitted.currentPractice === "drained",
          isFirstYearSwitch: submitted.isFirstYear,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data as CalcResult[]
    },
    enabled:   !!submitted,
    staleTime: Infinity,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.hectares || !form.currentPractice) return
    setSubmitted({ ...form })
  }

  const results    = data ?? []
  const hasStackable = results.some(r => r.cfrEligible && r.stackingMultiplier > 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Protocol optimizer</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find the highest-yield protocol for your farm.{" "}
          CFR stacking delivers 1.4–2.2× multipliers on AB-TIER projects.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {/* Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="size-4 text-muted-foreground" />
              Farm inputs
            </CardTitle>
            <CardDescription>
              Enter your farm profile to see protocol recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="calc-ha" className="text-xs font-medium">Hectares</Label>
                  <Input
                    id="calc-ha"
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
                    <SelectValue placeholder="Select practice" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRACTICES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5 pt-1">
                {CHECKBOXES.map(({ key, label, desc }) => {
                  const checked = form[key as keyof FormState] as boolean
                  return (
                    <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                      <div className="relative mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e =>
                            setForm(f => ({ ...f, [key]: e.target.checked }))
                          }
                          className="peer sr-only"
                        />
                        <div className="size-4 rounded border border-input bg-background peer-checked:bg-primary peer-checked:border-primary transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                          <svg
                            viewBox="0 0 10 8"
                            className="size-2.5 text-primary-foreground"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </label>
                  )
                })}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isFetching || !form.currentPractice}
              >
                {isFetching ? (
                  <>Calculating…</>
                ) : (
                  <>
                    Find best protocols
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
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-7 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="h-[72px] w-24 rounded-xl shrink-0" />
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
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
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed text-center">
              <div className="px-6">
                <Zap className="size-7 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  Enter farm details to see results
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                  The optimizer ranks protocols by estimated annual revenue, including CFR
                  stacking uplift.
                </p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed text-center">
              <p className="text-sm text-muted-foreground px-4">
                No protocols matched these inputs.
              </p>
            </div>
          ) : (
            <>
              {hasStackable && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 flex items-start gap-3">
                  <Sparkles className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      CFR stacking opportunity detected
                    </p>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                      This farm profile qualifies for Alberta TIER + federal CFR
                      dual-issuance. One project, two compliance markets.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-0.5">
                Top {Math.min(results.length, 5)} protocol
                {results.length !== 1 ? "s" : ""} for{" "}
                {Number(submitted.hectares).toLocaleString("en-CA")} ha in{" "}
                {submitted.province}
              </p>

              {results.slice(0, 5).map((r, i) => (
                <ResultCard
                  key={`${r.protocolId}-${r.practice}`}
                  result={r}
                  rank={i + 1}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
