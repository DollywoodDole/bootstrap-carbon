"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { OptimizationResult } from "@/types"

interface OptimizeResponse {
  data: OptimizationResult[]
  success: boolean
  error?: string
}

export default function CalculatorPage() {
  const [hectares,       setHectares]       = useState("")
  const [currentPractice, setCurrentPractice] = useState("")
  const [province,       setProvince]       = useState<"SK" | "AB">("SK")
  const [hasLivestock,   setHasLivestock]   = useState(false)
  const [hasWetlands,    setHasWetlands]    = useState(false)
  const [isFirstYear,    setIsFirstYear]    = useState(false)
  const [results,        setResults]        = useState<OptimizationResult[] | null>(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState("")

  async function handleOptimize(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResults(null)

    const res = await fetch("/api/calculator", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode:            "optimize",
        hectares:        Number(hectares),
        currentPractice,
        province,
        hasLivestock,
        hasWetlands,
        isFirstYearSwitch: isFirstYear,
      }),
    })

    const data: OptimizeResponse = await res.json()
    if (!data.success) {
      setError(data.error ?? "Calculation failed")
    } else {
      setResults(data.data)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Protocol Optimizer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find the highest-yield protocol for your farm, including CFR stacking opportunities.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Farm inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOptimize} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hectares">Total hectares</Label>
                  <Input
                    id="hectares"
                    type="number"
                    min="1"
                    max="100000"
                    value={hectares}
                    onChange={e => setHectares(e.target.value)}
                    placeholder="e.g. 320"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Province</Label>
                  <Select
                    value={province}
                    onValueChange={(v: string | null) => { if (v) setProvince(v as "SK" | "AB") }}
                  >
                    <SelectTrigger>
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
                <Label htmlFor="currentPractice">Current practice</Label>
                <Select
                  value={currentPractice}
                  onValueChange={(v: string | null) => { if (v) setCurrentPractice(v) }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select current practice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conventional-till">Conventional till</SelectItem>
                    <SelectItem value="minimum-till">Minimum till</SelectItem>
                    <SelectItem value="no-till">No-till (established)</SelectItem>
                    <SelectItem value="drained">Drained wetland</SelectItem>
                    <SelectItem value="open-lagoon">Open manure lagoon</SelectItem>
                    <SelectItem value="standard-feeding">Standard cattle feeding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasLivestock}
                    onChange={e => setHasLivestock(e.target.checked)}
                    className="rounded"
                  />
                  Has livestock
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasWetlands}
                    onChange={e => setHasWetlands(e.target.checked)}
                    className="rounded"
                  />
                  Has wetlands
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFirstYear}
                    onChange={e => setIsFirstYear(e.target.checked)}
                    className="rounded"
                  />
                  First-year switch
                </label>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" disabled={loading || !currentPractice}>
                {loading ? "Calculating…" : "Optimize"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Top recommendations
            </h2>
            {results.map((r, i) => (
              <Card key={r.protocolId} className={i === 0 ? "ring-1 ring-primary/30" : ""}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{r.protocolName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {r.practice.replace(/-/g, " ")}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {r.cfrEligible && (
                        <Badge className="text-xs">CFR stackable</Badge>
                      )}
                      {i === 0 && (
                        <Badge variant="secondary" className="text-xs">Best</Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base credits/yr</span>
                      <span className="tabular-nums font-medium">
                        {Number(r.baseCreditsAnnual).toFixed(1)} t
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">With stacking</span>
                      <span className="tabular-nums font-medium text-primary">
                        {Number(r.stackedCreditsAnnual).toFixed(1)} t
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Multiplier</span>
                      <span className="tabular-nums font-medium">
                        {Number(r.stackingMultiplier).toFixed(2)}×
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. revenue/yr</span>
                      <span className="tabular-nums font-medium">
                        ${Number(r.estimatedAnnualRevenue).toLocaleString("en-CA", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
