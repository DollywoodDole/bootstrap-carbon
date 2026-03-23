import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Plus } from "lucide-react"

export default async function FarmsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user) return null

  const farms = await db.farm.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      owner:    { select: { name: true, email: true } },
      projects: { select: { id: true, name: true, status: true, protocolId: true } },
      _count:   { select: { projects: true, memberships: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Farms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {farms.length} farm{farms.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4" />
          Add farm
        </Button>
      </div>

      {farms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No farms registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map(farm => (
            <Card key={farm.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{farm.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {farm.municipality ? `${farm.municipality}, ` : ""}{farm.province}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hectares</span>
                  <span className="font-medium tabular-nums">
                    {farm.totalHectares.toLocaleString("en-CA")} ha
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Projects</span>
                  <span className="font-medium">{farm._count.projects}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pool memberships</span>
                  <span className="font-medium">{farm._count.memberships}</span>
                </div>
                {farm.projects.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {farm.projects.slice(0, 3).map(p => (
                      <Badge key={p.id} variant="outline" className="text-xs">
                        {p.status}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
