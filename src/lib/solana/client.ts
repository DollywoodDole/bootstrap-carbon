// src/lib/solana/client.ts
// Solana RPC connection — audit ledger only
// Users never see "token", "mint", or "blockchain" in the UI

import { Connection, Keypair, PublicKey } from "@solana/web3.js"

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com"

let _connection: Connection | null = null

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, "confirmed")
  }
  return _connection
}

export function getTreasuryKeypair(): Keypair {
  const raw = process.env.SOLANA_TREASURY_KEYPAIR
  if (!raw) throw new Error("SOLANA_TREASURY_KEYPAIR not set")
  // Expects comma-separated byte array or base64
  const bytes = raw.includes(",")
    ? Uint8Array.from(raw.split(",").map(Number))
    : Uint8Array.from(Buffer.from(raw, "base64"))
  return Keypair.fromSecretKey(bytes)
}

export function getProgramId(): PublicKey {
  const id = process.env.SOLANA_PROGRAM_ID
  if (!id) throw new Error("SOLANA_PROGRAM_ID not set")
  return new PublicKey(id)
}
