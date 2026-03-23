// src/app/api/pools/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"

const CreatePoolSchema = z.object({
  name:             z.string().min(3).max(100),
  description:      z.string().optional(),
  province:         z.enum(["SK", "AB"]),
  farmIds:          z.array(z.string().cuid()).min(2),
  platformFeeRate:  z.number().min(0.05).max(0.20).default(0.10),
  verifierName:     z.string().optional(),
  verificationCost: z.number().positive().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get("status")
  const province = searchParams.get("province")

  const pools = await db.pool.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(status   ? { status:   status   as never } : {}),
      ...(province ? { province: province           } : {}),
    },
    include: {
      memberships: { include: { farm: true } },
      credits: { select: { id: true, quantity: true, status: true } },
      _count: { select: { memberships: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ data: pools, success: true })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = CreatePoolSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message, success: false },
      { status: 400 }
    )
  }

  const farms = await db.farm.findMany({
    where: {
      id:             { in: parsed.data.farmIds },
      organizationId: session.user.organizationId,
    },
  })

  if (farms.length !== parsed.data.farmIds.length) {
    return NextResponse.json(
      { error: "One or more farms not found", success: false },
      { status: 404 }
    )
  }

  const totalHectares = farms.reduce((sum: number, f) => sum + f.totalHectares, 0)

  const pool = await db.pool.create({
    data: {
      name:             parsed.data.name,
      description:      parsed.data.description,
      province:         parsed.data.province,
      organizationId:   session.user.organizationId,
      platformFeeRate:  parsed.data.platformFeeRate,
      verifierName:     parsed.data.verifierName,
      verificationCost: parsed.data.verificationCost,
      totalHectares,
      status: "FORMING",
      memberships: {
        create: farms.map(farm => ({
          farmId:         farm.id,
          contributionHa: farm.totalHectares,
          creditShare:    farm.totalHectares / totalHectares,
        })),
      },
    },
    include: { memberships: { include: { farm: true } } },
  })

  return NextResponse.json({ data: pool, success: true }, { status: 201 })
}
