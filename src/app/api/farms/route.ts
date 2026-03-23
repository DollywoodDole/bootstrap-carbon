// src/app/api/farms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"

const CreateFarmSchema = z.object({
  name:          z.string().min(2).max(200),
  province:      z.enum(["SK", "AB"]),
  municipality:  z.string().optional(),
  lat:           z.number().min(49).max(60).optional(),
  lng:           z.number().min(-140).max(-95).optional(),
  totalHectares: z.number().positive().max(100000),
  soilZone:      z.string().optional(),
  landClass:     z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const province = searchParams.get("province")

  const farms = await db.farm.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(province ? { province } : {}),
    },
    include: {
      owner:    { select: { id: true, name: true, email: true } },
      projects: { select: { id: true, name: true, status: true, protocolId: true } },
      _count:   { select: { projects: true, memberships: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ data: farms, success: true })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = CreateFarmSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message, success: false },
      { status: 400 }
    )
  }

  const farm = await db.farm.create({
    data: {
      ...parsed.data,
      ownerId:        session.user.id,
      organizationId: session.user.organizationId,
    },
  })

  return NextResponse.json({ data: farm, success: true }, { status: 201 })
}
