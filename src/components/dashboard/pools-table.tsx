"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ArrowUpRight, CheckCircle2, Clock, Loader2, AlertCircle, CircleDot } from "lucide-react"

export interface PoolRow {
  id:               string
  name:             string
  province:         string
  status:           string
  farmCount:        number
  totalHectares:    number | null
  estimatedCredits: number | null
  issuedTonnes:     number
  platformFeeRate:  number
  verifierName:     string | null
  markets:          string[]
  verifiedDate:     string | null
}

interface PoolsTableProps {
  pools?:   PoolRow[]
  loading?: boolean
}

type StatusMeta = {
  label:   string
  variant: "default" | "secondary" | "outline" | "destructive"
  icon:    React.ComponentType<{ className?: string }>
  dot:     string
}

const STATUS: Record<string, StatusMeta> = {
  FORMING:            { label: "Forming",        variant: "outline",   icon: CircleDot,    dot: "bg-muted-foreground" },
  CLOSED:             { label: "Closed",          variant: "outline",   icon: CircleDot,    dot: "bg-muted-foreground" },
  SUBMITTED:          { label: "Submitted",       variant: "secondary", icon: Clock,        dot: "bg-blue-500" },
  UNDER_VERIFICATION: { label: "Verifying",       variant: "secondary", icon: Loader2,      dot: "bg-amber-500" },
  VERIFIED:           { label: "Verified",        variant: "secondary", icon: CheckCircle2, dot: "bg-emerald-500" },
  CREDITS_ISSUED:     { label: "Credits issued",  variant: "default",   icon: CheckCircle2, dot: "bg-emerald-600" },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS[status] ?? { label: status, variant: "outline" as const, dot: "bg-muted-foreground" }
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full shrink-0", meta.dot)} />
      <Badge variant={meta.variant} className="font-normal">
        {meta.label}
      </Badge>
    </div>
  )
}

function LoadingRows() {
  return Array.from({ length: 3 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((_, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-full max-w-24" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

export function PoolsTable({ pools, loading }: PoolsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4 font-semibold text-foreground">Pool</TableHead>
            <TableHead className="font-semibold text-foreground">Province</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Farms</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Hectares</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Est. credits</TableHead>
            <TableHead className="font-semibold text-foreground">Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <LoadingRows />
          ) : !pools || pools.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                <AlertCircle className="size-5 mx-auto mb-2 opacity-40" />
                No pools yet. Create one from the Farms page.
              </TableCell>
            </TableRow>
          ) : (
            pools.map(pool => {
              const credits = pool.estimatedCredits ?? pool.issuedTonnes
              return (
                <TableRow key={pool.id} className="group">
                  <TableCell className="pl-4">
                    <div>
                      <p className="font-medium text-foreground">{pool.name}</p>
                      {pool.verifierName && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">
                          {pool.verifierName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs font-normal">
                      {pool.province}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{pool.farmCount}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {pool.totalHectares
                      ? pool.totalHectares.toLocaleString("en-CA", { maximumFractionDigits: 0 })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="tabular-nums font-medium">
                        {credits > 0
                          ? `${credits.toLocaleString("en-CA", { maximumFractionDigits: 1 })} t`
                          : "—"}
                      </span>
                      {pool.markets.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {pool.markets.slice(0, 2).map(m => (
                            <span key={m} className="text-[10px] text-muted-foreground font-mono">
                              {m.replace("CA-", "").replace("AB-", "")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pool.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
