import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, MapPin, Award, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user) return null

  const orgId = session.user.organizationId

  const [farmCount, poolCount, creditStats, recentCredits] = await Promise.all([
    db.farm.count({ where: { organizationId: orgId } }),
    db.pool.count({ where: { organizationId: orgId } }),
    db.offsetCredit.aggregate({
      where: {
        project: { farm: { organizationId: orgId } },
        status: "ISSUED",
      },
      _sum: { quantity: true },
    }),
    db.offsetCredit.findMany({
      where: { project: { farm: { organizationId: orgId } } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const issuedTonnes = Number(creditStats._sum.quantity ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your cooperative carbon portfolio
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Farms
            </CardTitle>
            <MapPin className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pools
            </CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{poolCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issued (tCO₂e)
            </CardTitle>
            <Award className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issuedTonnes.toLocaleString("en-CA", { maximumFractionDigits: 1 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Revenue
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(issuedTonnes * 56).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">@$56/tonne avg</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent credit activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCredits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No credits yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentCredits.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.project?.name ?? "—"}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">{Number(c.quantity).toFixed(1)} t</span>
                    <Badge variant="outline">{c.complianceMarket}</Badge>
                    <Badge
                      variant={c.status === "ISSUED" ? "default" : "secondary"}
                    >
                      {c.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
