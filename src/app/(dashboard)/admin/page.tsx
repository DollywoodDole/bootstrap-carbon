import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { db } from "@/lib/db/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [orgs, users, recentOrgs] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { users: true, farms: true, pools: true } } },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organizations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Users</th>
                <th className="px-4 py-3 font-medium text-right">Farms</th>
                <th className="px-4 py-3 font-medium text-right">Pools</th>
              </tr>
            </thead>
            <tbody>
              {recentOrgs.map(org => (
                <tr key={org.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {org.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{org._count.users}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{org._count.farms}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{org._count.pools}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
