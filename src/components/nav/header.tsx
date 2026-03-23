"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
  ADMIN:        "Admin",
  POOL_MANAGER: "Pool manager",
  FARMER:       "Farmer",
  VERIFIER:     "Verifier",
}

function initials(name?: string | null) {
  if (!name) return "?"
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

export function Header() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const user = session?.user
  const role = ROLE_LABELS[user?.role ?? ""] ?? user?.role

  return (
    <header className="h-12 border-b bg-background/95 backdrop-blur flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Bootstrap Carbon</span>
        <span>/</span>
        <span>Cooperative Platform</span>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors"
        >
          <Avatar className="size-6">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium leading-none">{user?.name ?? user?.email}</p>
          </div>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border bg-popover shadow-md ring-1 ring-foreground/5 z-50 py-1 text-sm">
            <div className="px-3 py-2 border-b mb-1">
              <p className="font-medium truncate">{user?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <Badge variant="outline" className="mt-1 text-[10px] h-4">
                {role}
              </Badge>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground",
                "hover:bg-muted hover:text-foreground transition-colors"
              )}
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
