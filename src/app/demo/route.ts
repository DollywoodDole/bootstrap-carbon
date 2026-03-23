// src/app/demo/route.ts
// Auto-login as the Palliser demo user and redirect to /dashboard.
// No password required. Session expires in 4 hours.
// Scoped to the Palliser Cooperative org — cannot read other orgs' data.

import { NextRequest, NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import { db } from "@/lib/db/client"

const DEMO_EMAIL   = "admin@palliser.example"
const SESSION_SECS = 60 * 60 * 4 // 4 hours

export async function GET(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const user = await db.user.findUnique({
    where:  { email: DEMO_EMAIL },
    select: { id: true, name: true, email: true, role: true, organizationId: true },
  })

  if (!user) {
    // Demo data hasn't been seeded yet
    const origin = new URL(request.url).origin
    return NextResponse.redirect(
      new URL("/login?error=DemoNotSeeded", origin)
    )
  }

  // Build a NextAuth-compatible JWT with all fields the session callback expects
  const now  = Math.floor(Date.now() / 1000)
  const token = await encode({
    secret,
    maxAge: SESSION_SECS,
    token: {
      sub:            user.id,
      name:           user.name ?? undefined,
      email:          user.email,
      // Custom fields from src/lib/auth/config.ts jwt callback
      id:             user.id,
      role:           user.role,
      organizationId: user.organizationId,
      // Mark as demo so the UI can show the banner
      isDemo:         true,
      iat:            now,
      exp:            now + SESSION_SECS,
    },
  })

  // NextAuth uses __Secure- prefix on HTTPS deployments
  const secure     = new URL(request.url).protocol === "https:"
  const cookieName = secure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token"

  const origin   = new URL(request.url).origin
  const response = NextResponse.redirect(new URL("/dashboard", origin))

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge:   SESSION_SECS,
    path:     "/",
  })

  return response
}
