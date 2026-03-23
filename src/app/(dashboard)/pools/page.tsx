"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Layers, Plus, MapPin, TrendingUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FarmSummary {
  id: string
  name: string
  province: string
  totalHectares: number
}

interface PoolMembership {
  id: string
  farm: FarmSummary
  contributionHa: number
  creditShare: number
}

interface PoolCredit {
  id: string
  quantity: string
  status: string
}

interface Pool {
  id: string
  name: string
  description: string | null
  province: string
  status: string
  totalHectares: number | string
  platformFeeRate: number | string
  verifierName: string | null
  verificationCost: number | string | null
  memberships: PoolMembership[]
  credits: PoolCredit[]
  _count: { memberships: number }
}

const STATUS_LABEL: Record<string, string> = {
  FORMING:            "Forming",
  CLOSED:             "Closed",
  SUBMITTED:          "Submitted",
  UNDER_VERIFICATION: "Under review",
  VERIFIED:           "Verified",
  CREDITS_ISSUED:     "Credits issued",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  FORMING:            "outline",
  CLOSED:             "secondary",
  SUBMITTED:          "secondary",
  UNDER_VERIFICATION: "secondary",
  VERIFIED:           "default",
  CREDITS_ISSUED:     "default",
}

const CREDIT_PRICE = 56 // AB-TIER baseline $/t

function fmtN(n: number, d = 0) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: d, maximumFractionDigits: d })
}

function fmtCad(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n).toLocaleString("en-CA")}`
}

function PoolCard({ pool }: { pool: Pool }) {
  const issuedTonnes = pool.credits
    .filter(c => c.status === "ISSUED")
    .reduce((sum, c) => sum + Number(c.quantity), 0)

  const feeRate      = Number(pool.platformFeeRate)
  const grossRevenue = issuedTonnes * CREDIT_PRICE
  const platformFee  = grossRevenue * feeRate
  const netFarmers   = grossRevenue - platformFee
  const verCost      = pool.verificationCost != null ? Number(pool.verificationCost) : null
  const costPerFarm  =
    verCost != null && pool._count.memberships > 0
      ? verCost / pool._count.memberships
      : null

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{pool.name}</h3>
            {pool.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pool.description}</p>
            )}
          </div>
          <Badge
            variant={STATUS_VARIANT[pool.status] ?? "outline"}
            className="shrink-0 text-[11px]"
          >
            {STATUS_LABEL[pool.status] ?? pool.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          {pool.province}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Farms",    value: fmtN(pool._count.memberships) },
            { label: "Ha",       value: fmtN(Number(pool.totalHectares)) },
            { label: "Issued t", value: fmtN(issuedTonnes, 1) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-muted/40 px-2 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {label}
              </p>
              <p className="text-sm font-bold tabular-nums mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Farm chips */}
        <div className="flex flex-wrap gap-1">
          {pool.memberships.slice(0, 3).map(m => (
            <span
              key={m.id}
              className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {m.farm.name}
            </span>
          ))}
          {pool.memberships.length > 3 && (
            <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">
              +{pool.memberships.length - 3} more
            </span>
          )}
        </div>

        <Separator />

        {/* Economics */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
            <TrendingUp className="size-3" />
            Pool economics
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross revenue</span>
              <span className="tabular-nums font-medium">{fmtCad(grossRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Platform fee ({(feeRate * 100).toFixed(0)}%)
              </span>
              <span className="tabular-nums text-muted-foreground">−{fmtCad(platformFee)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 mt-1">
              <span className="font-medium">Net to farmers</span>
              <span className="tabular-nums font-semibold text-primary">{fmtCad(netFarmers)}</span>
            </div>
            {costPerFarm != null && (
              <div className="flex justify-between text-muted-foreground pt-0.5">
                <span>Verification est./farm</span>
                <span className="tabular-nums">{fmtCad(costPerFarm)}</span>
              </div>
            )}
            {pool.verifierName && (
              <div className="flex justify-between text-muted-foreground">
                <span>Verifier</span>
                <span className="truncate max-w-[140px] text-right">{pool.verifierName}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CreateFormState {
  name:             string
  description:      string
  province:         "SK" | "AB"
  farmIds:          string[]
  platformFeeRate:  string
  verifierName:     string
  verificationCost: string
}

function CreatePoolDialog({
  open,
  onOpenChange,
  farms,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  farms: FarmSummary[]
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<CreateFormState>({
    name:             "",
    description:      "",
    province:         "SK",
    farmIds:          [],
    platformFeeRate:  "0.10",
    verifierName:     "",
    verificationCost: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState("")

  const filteredFarms = farms.filter(f => f.province === form.province)

  function toggleFarm(id: string) {
    setForm(f => ({
      ...f,
      farmIds: f.farmIds.includes(id)
        ? f.farmIds.filter(fid => fid !== id)
        : [...f.farmIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.farmIds.length < 2) {
      setError("Select at least 2 farms")
      return
    }
    setSubmitting(true)
    setError("")
    const res  = await fetch("/api/pools", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:             form.name,
        description:      form.description || undefined,
        province:         form.province,
        farmIds:          form.farmIds,
        platformFeeRate:  Number(form.platformFeeRate),
        verifierName:     form.verifierName || undefined,
        verificationCost: form.verificationCost ? Number(form.verificationCost) : undefined,
      }),
    })
    const json = await res.json()
    if (!json.success) {
      setError(json.error ?? "Failed to create pool")
      setSubmitting(false)
      return
    }
    await qc.invalidateQueries({ queryKey: ["pools"] })
    onOpenChange(false)
    setForm({
      name: "", description: "", province: "SK", farmIds: [],
      platformFeeRate: "0.10", verifierName: "", verificationCost: "",
    })
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New aggregation pool</DialogTitle>
          <DialogDescription>
            Group farms into a verification pool. Minimum 2 farms required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name + Province */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pool-name" className="text-xs font-medium">Pool name</Label>
              <Input
                id="pool-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Palliser North Block"
                required
                minLength={3}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Province</Label>
              <Select
                value={form.province}
                onValueChange={(v: string | null) => {
                  if (v) setForm(f => ({ ...f, province: v as "SK" | "AB", farmIds: [] }))
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SK">Saskatchewan</SelectItem>
                  <SelectItem value="AB">Alberta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="pool-desc" className="text-xs font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="pool-desc"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description"
            />
          </div>

          {/* Farm selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Select farms
              {form.farmIds.length > 0 && (
                <span className="ml-1.5 text-muted-foreground font-normal">
                  {form.farmIds.length} selected
                </span>
              )}
            </Label>
            {filteredFarms.length === 0 ? (
              <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                No farms in {form.province}. Add farms first.
              </div>
            ) : (
              <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                {filteredFarms.map(farm => {
                  const checked = form.farmIds.includes(farm.id)
                  return (
                    <label
                      key={farm.id}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors",
                        checked ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "size-4 rounded border transition-colors shrink-0 flex items-center justify-center",
                          checked ? "bg-primary border-primary" : "border-input bg-background"
                        )}
                      >
                        {checked && (
                          <svg
                            viewBox="0 0 10 8"
                            className="size-2.5 text-primary-foreground"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFarm(farm.id)}
                        className="sr-only"
                      />
                      <span className="flex-1 leading-none">{farm.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {fmtN(farm.totalHectares)} ha
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Fee + Verification cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Platform fee</Label>
              <Select
                value={form.platformFeeRate}
                onValueChange={(v: string | null) => {
                  if (v) setForm(f => ({ ...f, platformFeeRate: v }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.05">5%</SelectItem>
                  <SelectItem value="0.07">7%</SelectItem>
                  <SelectItem value="0.10">10%</SelectItem>
                  <SelectItem value="0.12">12%</SelectItem>
                  <SelectItem value="0.15">15%</SelectItem>
                  <SelectItem value="0.20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ver-cost" className="text-xs font-medium">
                Verification cost ($)
              </Label>
              <Input
                id="ver-cost"
                type="number"
                min="0"
                value={form.verificationCost}
                onChange={e => setForm(f => ({ ...f, verificationCost: e.target.value }))}
                placeholder="e.g. 5000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="verifier-name" className="text-xs font-medium">
              Verifier name <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="verifier-name"
              value={form.verifierName}
              onChange={e => setForm(f => ({ ...f, verifierName: e.target.value }))}
              placeholder="e.g. Climate Verification Corp."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={submitting || form.farmIds.length < 2}
              className="w-full sm:w-auto"
            >
              {submitting ? "Creating…" : "Create pool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PoolsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: poolsData, isLoading } = useQuery<{ data: Pool[]; success: boolean }>({
    queryKey: ["pools"],
    queryFn: () => fetch("/api/pools").then(r => r.json()),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const { data: farmsData } = useQuery<{ data: FarmSummary[]; success: boolean }>({
    queryKey: ["farms"],
    queryFn: () => fetch("/api/farms").then(r => r.json()),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const pools = poolsData?.data ?? []
  const farms = farmsData?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pools</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage aggregation pools for cooperative verification
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New pool
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pools.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Layers className="size-9 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No pools yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create your first pool to group farms for cooperative verification.
            </p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Create pool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      )}

      <CreatePoolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        farms={farms}
      />
    </div>
  )
}
