"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

type FacilityType = "FERTILIZER" | "CEMENT" | "STEEL" | "OIL_GAS"

const FACILITY_LABELS: Record<FacilityType, string> = {
  FERTILIZER: "Fertilizer",
  CEMENT:     "Cement",
  STEEL:      "Steel",
  OIL_GAS:    "Oil & Gas",
}

const PACKAGE_PRICING: Record<FacilityType, string> = {
  FERTILIZER: "$15,000",
  CEMENT:     "$25,000",
  STEEL:      "$35,000",
  OIL_GAS:    "$65,000",
}

interface CBAMPackage {
  id:           string
  facilityName: string
  facilityType: FacilityType
  reportingYear: number
  status:       string
  totalCarbon:  number
  totalCost:    number
  currency:     string
  createdAt:    string
}

export default function CBAMPage() {
  const [showForm,      setShowForm]      = useState(false)
  const [facilityName,  setFacilityName]  = useState("")
  const [facilityType,  setFacilityType]  = useState<FacilityType>("FERTILIZER")
  const [reportingYear, setReportingYear] = useState(new Date().getFullYear().toString())
  const [totalCarbon,   setTotalCarbon]   = useState("")
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState("")

  const { data, refetch } = useQuery<{ data: CBAMPackage[] }>({
    queryKey: ["cbam"],
    queryFn: () => fetch("/api/cbam").then(r => r.json()),
  })

  const packages = data?.data ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/cbam", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facilityName,
        facilityType,
        reportingYear: Number(reportingYear),
        totalCarbon:   Number(totalCarbon),
      }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? "Failed to create package")
    } else {
      setShowForm(false)
      setFacilityName("")
      setTotalCarbon("")
      refetch()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CBAM Documentation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            EU Carbon Border Adjustment Mechanism compliance packages
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" />
          New package
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New CBAM package</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="facilityName">Facility name</Label>
                  <Input
                    id="facilityName"
                    value={facilityName}
                    onChange={e => setFacilityName(e.target.value)}
                    placeholder="Acme Fertilizers Ltd."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Facility type</Label>
                  <Select
                    value={facilityType}
                    onValueChange={(v: string | null) => { if (v) setFacilityType(v as FacilityType) }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FACILITY_LABELS) as FacilityType[]).map(t => (
                        <SelectItem key={t} value={t}>
                          {FACILITY_LABELS[t]} — {PACKAGE_PRICING[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="year">Reporting year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2023"
                    max="2030"
                    value={reportingYear}
                    onChange={e => setReportingYear(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="carbon">Total carbon (tCO₂e)</Label>
                  <Input
                    id="carbon"
                    type="number"
                    min="0.1"
                    value={totalCarbon}
                    onChange={e => setTotalCarbon(e.target.value)}
                    placeholder="e.g. 12500"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating…" : "Create package"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {packages.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No CBAM packages yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Packages range from $15K–$65K per facility.
            </p>
          </CardContent>
        </Card>
      ) : (
        packages.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {packages.map(pkg => (
              <Card key={pkg.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{pkg.facilityName}</CardTitle>
                    <Badge variant={pkg.status === "draft" ? "outline" : "default"}>
                      {pkg.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span>{FACILITY_LABELS[pkg.facilityType]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reporting year</span>
                    <span>{pkg.reportingYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carbon (tCO₂e)</span>
                    <span className="tabular-nums">
                      {Number(pkg.totalCarbon).toLocaleString("en-CA")}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Package fee</span>
                    <span className="tabular-nums">
                      {pkg.currency} ${Number(pkg.totalCost).toLocaleString("en-CA")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}
