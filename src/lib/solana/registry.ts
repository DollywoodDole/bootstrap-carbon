// src/lib/solana/registry.ts
// Read on-chain registry data
// Used for provenance verification — read-only

import { PublicKey } from "@solana/web3.js"
import { getConnection, getProgramId } from "./client"

const ONCHAIN_ENABLED = process.env.ENABLE_ONCHAIN_ISSUANCE === "true"

export interface RegistryEntry {
  creditId:      string
  projectId:     string
  quantity:      number
  vintageYear:   number
  issuedAt:      number   // unix timestamp
  retired:       boolean
  retiredAt?:    number
}

export async function getRegistryEntry(
  mintAddress: string
): Promise<RegistryEntry | null> {
  if (!ONCHAIN_ENABLED) return null

  try {
    const connection = getConnection()
    const programId  = getProgramId()
    const mint       = new PublicKey(mintAddress)

    // Derive the PDA for this credit's registry entry
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credit_registry"), mint.toBuffer()],
      programId
    )

    const accountInfo = await connection.getAccountInfo(pda)
    if (!accountInfo) return null

    // Parse the account data (layout: creditId[32], projectId[32], quantity[8], ...)
    const data = accountInfo.data
    return {
      creditId:    data.slice(0, 32).toString("hex"),
      projectId:   data.slice(32, 64).toString("hex"),
      quantity:    Number(data.readBigUInt64LE(64)) / 1_000_000,
      vintageYear: data.readUInt32LE(72),
      issuedAt:    Number(data.readBigInt64LE(76)),
      retired:     data.readUInt8(84) === 1,
      retiredAt:   data.readUInt8(84) === 1
        ? Number(data.readBigInt64LE(85))
        : undefined,
    }
  } catch {
    return null
  }
}

export async function verifySignature(signature: string): Promise<boolean> {
  if (!ONCHAIN_ENABLED) return true  // assume valid in dev
  try {
    const connection = getConnection()
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    })
    return tx !== null && !tx.meta?.err
  } catch {
    return false
  }
}
