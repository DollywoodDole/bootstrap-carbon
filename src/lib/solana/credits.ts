// src/lib/solana/credits.ts
// On-chain credit issuance via SPL tokens
// Only active when ENABLE_ONCHAIN_ISSUANCE=true

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  burn,
  getMint,
} from "@solana/spl-token"
import { PublicKey } from "@solana/web3.js"
import { getConnection, getTreasuryKeypair } from "./client"

const ONCHAIN_ENABLED = process.env.ENABLE_ONCHAIN_ISSUANCE === "true"

export interface MintResult {
  mintAddress: string
  signature: string
  quantity: number
}

export async function issueCreditsOnChain(
  recipientAddress: string,
  quantityTonnes: number
): Promise<MintResult> {
  if (!ONCHAIN_ENABLED) {
    // Return simulated result in dev/disabled mode
    return {
      mintAddress: "SIMULATED_MINT_" + Date.now(),
      signature:   "SIMULATED_SIG_"  + Date.now(),
      quantity:    quantityTonnes,
    }
  }

  const connection = getConnection()
  const treasury   = getTreasuryKeypair()
  const recipient  = new PublicKey(recipientAddress)

  // 1 credit = 1 tonne CO2e = 1 token (6 decimals)
  const mint = await createMint(
    connection,
    treasury,
    treasury.publicKey,
    treasury.publicKey,
    6
  )

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    mint,
    recipient
  )

  const amount = BigInt(Math.round(quantityTonnes * 1_000_000))
  const sig = await mintTo(
    connection,
    treasury,
    mint,
    tokenAccount.address,
    treasury,
    amount
  )

  return {
    mintAddress: mint.toBase58(),
    signature:   sig,
    quantity:    quantityTonnes,
  }
}

export async function retireCreditsOnChain(
  mintAddress: string,
  holderAddress: string,
  quantityTonnes: number
): Promise<string> {
  if (!ONCHAIN_ENABLED) {
    return "SIMULATED_RETIRE_SIG_" + Date.now()
  }

  const connection = getConnection()
  const treasury   = getTreasuryKeypair()
  const mint       = new PublicKey(mintAddress)
  const holder     = new PublicKey(holderAddress)

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    mint,
    holder
  )

  const amount = BigInt(Math.round(quantityTonnes * 1_000_000))
  return burn(connection, treasury, tokenAccount.address, mint, treasury, amount)
}

export async function getOnChainBalance(
  mintAddress: string
): Promise<number> {
  if (!ONCHAIN_ENABLED) return 0
  const connection = getConnection()
  const mintInfo   = await getMint(connection, new PublicKey(mintAddress))
  return Number(mintInfo.supply) / 1_000_000
}
