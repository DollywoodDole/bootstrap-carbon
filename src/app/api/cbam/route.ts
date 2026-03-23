// src/app/api/cbam/route.ts
// EU Carbon Border Adjustment Mechanism documentation generator
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"

const CreateCBAMSchema = z.object({
  facilityName:   z.string().min(2).max(200),
  facilityType:   z.enum(["FERTILIZER", "CEMENT", "STEEL", "OIL_GAS"]),
  reportingYear:  z.number().int().min(2023).max(2030),
  totalCarbon:    z.number().positive(),
  currency:       z.enum(["CAD", "USD", "EUR"]).default("CAD"),
})

// CBAM package pricing by facility type
const CBAM_PRICING: Record<string, number> = {
  FERTILIZER: 15000,
  CEMENT:     25000,
  STEEL:      35000,
  OIL_GAS:    65000,
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const packages = await db.cBAMPackage.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ data: packages, success: true })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = CreateCBAMSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message, success: false },
      { status: 400 }
    )
  }

  const totalCost = CBAM_PRICING[parsed.data.facilityType] ?? 15000

  const pkg = await db.cBAMPackage.create({
    data: {
      organizationId: session.user.organizationId,
      facilityName:   parsed.data.facilityName,
      facilityType:   parsed.data.facilityType,
      reportingYear:  parsed.data.reportingYear,
      totalCarbon:    parsed.data.totalCarbon,
      totalCost,
      currency:       parsed.data.currency,
      status:         "draft",
    },
  })

  return NextResponse.json({ data: pkg, success: true }, { status: 201 })
}
