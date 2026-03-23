// src/lib/auth/config.ts
import type { AuthOptions, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { scrypt, randomBytes, timingSafeEqual } from "crypto"
import { promisify } from "util"
import { db } from "@/lib/db/client"

const scryptAsync = promisify(scrypt)

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return salt + ":" + derivedKey.toString("hex")
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [salt, key] = hash.split(":")
  if (!salt || !key) return false
  const keyBuffer = Buffer.from(key, "hex")
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return timingSafeEqual(keyBuffer, derivedKey)
}

export const authConfig: AuthOptions = {
  adapter: PrismaAdapter(db) as AuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) return null

        const valid = await verifyPassword(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id             = user.id
        token.role           = (user as User & { role: string }).role
        token.organizationId = (user as User & { organizationId: string }).organizationId
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id             = token.id as string
        session.user.role           = token.role as string
        session.user.organizationId = token.organizationId as string
        if (token.isDemo) session.user.isDemo = true
      }
      return session
    },
  },
}
