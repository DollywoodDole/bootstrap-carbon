// src/app/api/credits/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { db } from "@/lib/db/client"
import { issueCreditsOnChain, retireCreditsOnChain } from "@/lib/solana/credits"

const IssueSchema = z.object({
  projectId:       z.string().cuid(),
  quantity:        z.number().positive().max(1000000),
  vintageYear:     z.number().int().min(2020).max(2030),
  complianceMarket: z.enum(["AB-TIER", "CA-OBPS", "CA-CFR", "VOLUNTARY"]),
  recipientAddress: z.string().optional(),
})

const RetireSchema = z.object({
  creditId:        z.string().cuid(),
  retirementReason: z.string().min(5).max(500),
  retiredBy:       z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status  = searchParams.get("status")
  const market  = searchParams.get("market")

  const credits = await db.offsetCredit.findMany({
    where: {
      project: {
        farm: { organizationId: session.user.organizationId }
      },
      ...(status ? { status: status as never } : {}),
      ...(market ? { complianceMarket: market } : {}),
    },
    include: {
      project: { select: { id: true, name: true, farm: { select: { name: true } } } },
      pool:    { select: { id: true, name: true } },
      transfers: { select: { id: true, fromOwner: true, toOwner: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ data: credits, success: true })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user || session.user.role === "FARMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body   = await req.json()
  const action = body.action as string

  if (action === "issue") {
    const parsed = IssueSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const onChain = parsed.data.recipientAddress
      ? await issueCreditsOnChain(parsed.data.recipientAddress, parsed.data.quantity)
      : null

    const credit = await db.offsetCredit.create({
      data: {
        projectId:        parsed.data.projectId,
        quantity:         parsed.data.quantity,
        vintageYear:      parsed.data.vintageYear,
        complianceMarket: parsed.data.complianceMarket,
        status:           "ISSUED",
        issuedAt:         new Date(),
        mintAddress:      onChain?.mintAddress,
        onChainSignature: onChain?.signature,
      },
    })

    return NextResponse.json({ data: credit, success: true }, { status: 201 })
  }

  if (action === "retire") {
    const parsed = RetireSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const credit = await db.offsetCredit.findUnique({
      where: { id: parsed.data.creditId },
    })

    if (!credit || credit.status !== "ISSUED") {
      return NextResponse.json(
        { error: "Credit not found or not eligible for retirement" },
        { status: 404 }
      )
    }

    let retirementSig: string | undefined
    if (credit.mintAddress) {
      retirementSig = await retireCreditsOnChain(
        credit.mintAddress,
        parsed.data.retiredBy ?? session.user.id,
        Number(credit.quantity)
      )
    }

    const updated = await db.offsetCredit.update({
      where: { id: parsed.data.creditId },
      data: {
        status:              "RETIRED",
        retiredAt:           new Date(),
        retiredBy:           parsed.data.retiredBy ?? session.user.email,
        retirementReason:    parsed.data.retirementReason,
        retirementSignature: retirementSig,
      },
    })

    return NextResponse.json({ data: updated, success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
