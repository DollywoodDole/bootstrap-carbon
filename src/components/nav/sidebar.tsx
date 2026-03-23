"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Layers,
  MapPin,
  Calculator,
  Award,
  FileText,
  Settings,
} from "lucide-react"

const nav = [
  { href: "/dashboard",   label: "Overview",    icon: LayoutDashboard },
  { href: "/pools",       label: "Pools",       icon: Layers },
  { href: "/farms",       label: "Farms",       icon: MapPin },
  { href: "/calculator",  label: "Calculator",  icon: Calculator },
  { href: "/credits",     label: "Credits",     icon: Award },
  { href: "/cbam",        label: "CBAM",        icon: FileText },
  { href: "/admin",       label: "Admin",       icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar px-3 py-4">
      <div className="mb-6 px-2">
        <span className="text-sm font-semibold text-sidebar-foreground">
          Bootstrap Carbon
        </span>
        <p className="text-xs text-muted-foreground">Cooperative</p>
      </div>

      <nav className="flex flex-col gap-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
