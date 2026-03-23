// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from "resend"

const ContactSchema = z.object({
  name:         z.string().min(2).max(100),
  organization: z.string().min(2).max(200),
  email:        z.email(),
  type:         z.enum(["request-access", "partner-inquiry"]),
  message:      z.string().min(10).max(2000),
})

const TYPE_LABEL: Record<string, string> = {
  "request-access":  "Request access",
  "partner-inquiry": "Partner inquiry",
}

export async function POST(req: NextRequest) {
  const body   = await req.json()
  const parsed = ContactSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission", success: false }, { status: 400 })
  }

  const { name, organization, email, type, message } = parsed.data
  const typeLabel = TYPE_LABEL[type]
  const toEmail   = process.env.CONTACT_EMAIL

  if (process.env.RESEND_API_KEY && toEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from:    "Bootstrap Carbon <contact@bootstrapcarbon.ca>",
      to:      toEmail,
      replyTo: email,
      subject: `[${typeLabel}] ${name} — ${organization}`,
      html: `
        <p><strong>Type:</strong> ${typeLabel}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Organization:</strong> ${organization}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    })
  } else {
    // Log locally if Resend isn't configured yet
    console.log("[contact]", { name, organization, email, type, message })
  }

  return NextResponse.json({ success: true })
}
