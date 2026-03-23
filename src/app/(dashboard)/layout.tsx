import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { Sidebar } from "@/components/nav/sidebar"
import { Header } from "@/components/nav/header"
import { Eye } from "lucide-react"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authConfig)
  if (!session?.user) redirect("/login")

  const isDemo = !!session.user.isDemo

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      {isDemo && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between gap-2 text-xs text-amber-800">
          <div className="flex items-center gap-1.5">
            <Eye className="size-3.5 shrink-0" />
            <span>
              <strong>Demo mode</strong> — Palliser Cooperative · Read-only view · Session expires in 4 hours
            </span>
          </div>
          <Link
            href="/contact?type=request-access"
            className="shrink-0 font-medium underline underline-offset-2 hover:text-amber-900 transition-colors"
          >
            Request access →
          </Link>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-7">{children}</div>
        </main>
      </div>
    </div>
  )
}
