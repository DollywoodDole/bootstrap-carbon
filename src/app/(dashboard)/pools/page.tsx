import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Layers, Plus } from "lucide-react"

const STATUS_COLOUR: Record<string, "default" | "secondary" | "outline"> = {
  FORMING:            "outline",
  CLOSED:             "secondary",
  SUBMITTED:          "secondary",
  UNDER_VERIFICATION: "secondary",
  VERIFIED:           "default",
  CREDITS_ISSUED:     "default",
}

export default async function PoolsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user) return null

  const pools = await db.pool.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      memberships: { include: { farm: { select: { name: true } } } },
      credits:     { select: { quantity: true, status: true } },
      _count:      { select: { memberships: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregation pools for cooperative verification
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4" />
          New pool
        </Button>
      </div>

      {pools.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No pools yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pools.map(pool => {
            const issuedTonnes = pool.credits
              .filter((c) => c.status === "ISSUED")
              .reduce((s: number, c) => s + Number(c.quantity), 0)

            return (
              <Card key={pool.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{pool.name}</CardTitle>
                    <Badge variant={STATUS_COLOUR[pool.status] ?? "outline"}>
                      {pool.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{pool.province}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Farms</p>
                      <p className="font-medium">{pool._count.memberships}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Hectares</p>
                      <p className="font-medium tabular-nums">
                        {(pool.totalHectares ?? 0).toLocaleString("en-CA", {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Issued (t)</p>
                      <p className="font-medium tabular-nums">
                        {issuedTonnes.toLocaleString("en-CA", {
                          maximumFractionDigits: 1,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {pool.memberships.slice(0, 4).map(m => (
                      <Badge key={m.id} variant="outline" className="text-xs font-normal">
                        {m.farm.name}
                      </Badge>
                    ))}
                    {pool.memberships.length > 4 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{pool.memberships.length - 4} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
