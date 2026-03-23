"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-semibold text-sm">Bootstrap Carbon</span>
          <Badge variant="outline" className="ml-2 text-xs">Cooperative</Badge>
        </div>
        <div className="flex gap-2">
          <Link href="/contact" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Contact
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Sign in
          </Link>
          <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
            Get started
          </Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <Badge variant="outline">Saskatchewan · Alberta · Federal Cooperative</Badge>

        <h1 className="text-4xl font-bold tracking-tight max-w-2xl leading-tight">
          Prairie carbon credits,<br />aggregated and verified.
        </h1>

        <p className="text-muted-foreground max-w-xl text-lg">
          Bootstrap Carbon solves the MRV cost problem that locks small SK/AB farmers
          out of the carbon offset market. We aggregate farms into compliant pools,
          verify at scale, and issue credits — including CFR stacking where eligible.
        </p>

        <div className="flex gap-3">
          <Link href="/register" className={cn(buttonVariants())}>
            Join the cooperative
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
            Sign in
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-12 text-sm max-w-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">10%</p>
            <p className="text-muted-foreground">Pool management fee</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">2.2×</p>
            <p className="text-muted-foreground">Max stacking multiplier</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">$15–65K</p>
            <p className="text-muted-foreground">CBAM packages</p>
          </div>
        </div>
      </section>
    </main>
  )
}
