import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { Sidebar } from "@/components/nav/sidebar"
import { Header } from "@/components/nav/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authConfig)
  if (!session?.user) redirect("/login")

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-7">{children}</div>
        </main>
      </div>
    </div>
  )
}
