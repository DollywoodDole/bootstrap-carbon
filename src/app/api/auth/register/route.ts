// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/client"
import { hashPassword } from "@/lib/auth/config"

const RegisterSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.email(),
  password: z.string().min(8),
  orgName:  z.string().min(2).max(200),
})

export async function POST(req: NextRequest) {
  const body   = await req.json()
  const parsed = RegisterSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const passwordHash = await hashPassword(parsed.data.password)
  const slug = parsed.data.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const user = await db.user.create({
    data: {
      name:         parsed.data.name,
      email:        parsed.data.email,
      passwordHash,
      role:         "FARMER",
      organization: {
        create: {
          name: parsed.data.orgName,
          slug: slug + "-" + Date.now().toString(36),
          type: "COOPERATIVE",
        },
      },
    },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json({ data: user, success: true }, { status: 201 })
}
