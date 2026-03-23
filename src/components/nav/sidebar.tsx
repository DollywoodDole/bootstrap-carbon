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
  ShieldCheck,
} from "lucide-react"

const nav = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/pools",      label: "Pools",        icon: Layers },
  { href: "/farms",      label: "Farms",        icon: MapPin },
  { href: "/calculator", label: "Calculator",   icon: Calculator },
  { href: "/credits",    label: "Credits",      icon: Award },
  { href: "/cbam",       label: "CBAM",         icon: FileText },
  { href: "/admin",      label: "Admin",        icon: ShieldCheck },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-52 flex-col border-r bg-sidebar shrink-0">
      <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "opacity-100" : "opacity-60")} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t px-3 py-3">
        <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
          Bootstrap Carbon
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
          Cooperative platform v0.1
        </p>
      </div>
    </aside>
  )
}
