import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award } from "lucide-react"

const STATUS_COLOUR: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING:     "outline",
  ISSUED:      "default",
  TRANSFERRED: "secondary",
  RETIRED:     "secondary",
  CANCELLED:   "destructive",
}

export default async function CreditsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user) return null

  const credits = await db.offsetCredit.findMany({
    where: {
      project: { farm: { organizationId: session.user.organizationId } },
    },
    include: {
      project: { select: { name: true, farm: { select: { name: true } } } },
      pool:    { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalIssued = credits
    .filter((c) => c.status === "ISSUED")
    .reduce((s: number, c) => s + Number(c.quantity), 0)

  const totalRetired = credits
    .filter((c) => c.status === "RETIRED")
    .reduce((s: number, c) => s + Number(c.quantity), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Credits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verified offset credits registry
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="text-right">
            <p className="text-muted-foreground">Issued</p>
            <p className="font-semibold tabular-nums">
              {totalIssued.toLocaleString("en-CA", { maximumFractionDigits: 1 })} t
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Retired</p>
            <p className="font-semibold tabular-nums">
              {totalRetired.toLocaleString("en-CA", { maximumFractionDigits: 1 })} t
            </p>
          </div>
        </div>
      </div>

      {credits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No credits issued yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Project / Pool</th>
                  <th className="px-4 py-3 font-medium text-right">Quantity (t)</th>
                  <th className="px-4 py-3 font-medium">Market</th>
                  <th className="px-4 py-3 font-medium">Vintage</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {credits.map(credit => (
                  <tr key={credit.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {credit.project?.name ?? credit.pool?.name ?? "—"}
                      </p>
                      {credit.project?.farm && (
                        <p className="text-xs text-muted-foreground">
                          {credit.project.farm.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {Number(credit.quantity).toLocaleString("en-CA", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{credit.complianceMarket}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{credit.vintageYear}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLOUR[credit.status] ?? "outline"}>
                        {credit.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
