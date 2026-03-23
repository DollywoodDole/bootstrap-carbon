"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle } from "lucide-react"

const TYPES = [
  {
    value: "request-access",
    label: "Request access",
    desc:  "Join as a farmer, pool manager, or cooperative — get a demo login and onboarding call.",
  },
  {
    value: "partner-inquiry",
    label: "Partner inquiry",
    desc:  "ClearBlue, ATB, verifiers, buyers, or technology partners — let's talk.",
  },
]

interface FormState {
  name:         string
  organization: string
  email:        string
  type:         string
  message:      string
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name:         "",
    organization: "",
    email:        "",
    type:         "request-access",
    message:      "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const res  = await fetch("/api/contact", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    })
    const json = await res.json()

    if (!json.success) {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <CheckCircle className="size-10 text-primary mx-auto" />
          <h1 className="text-xl font-semibold">Message sent</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll be in touch within one business day.
          </p>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" />
          Bootstrap Carbon
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Get in touch</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Farmers, cooperatives, buyers, and partners — we respond within one business day.
            </p>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left transition-colors",
                  form.type === t.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "hover:bg-muted/50"
                )}
              >
                <p className="text-sm font-medium leading-none">{t.label}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{t.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org" className="text-xs font-medium">Organization</Label>
                <Input
                  id="org"
                  value={form.organization}
                  onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                  placeholder="Palliser Co-op"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs font-medium">Message</Label>
              <textarea
                id="message"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder={
                  form.type === "request-access"
                    ? "Tell us about your operation — hectares, province, current practice."
                    : "Tell us what you're working on and how we might collaborate."
                }
                required
                minLength={10}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={cn(buttonVariants({ size: "sm" }), "w-full")}
            >
              {submitting ? "Sending…" : "Send message"}
            </button>
          </form>

          <p className="text-[11px] text-center text-muted-foreground">
            Prefer email?{" "}
            <a href="mailto:hello@bootstrapcarbon.ca" className="underline underline-offset-2 hover:text-foreground">
              hello@bootstrapcarbon.ca
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
