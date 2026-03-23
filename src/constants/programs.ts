// src/constants/programs.ts
// Solana program addresses
// IMPORTANT: These are devnet addresses. Mainnet addresses set via env vars.

export const PROGRAMS = {
  // Bootstrap Carbon credit registry program
  CREDIT_REGISTRY: process.env.SOLANA_PROGRAM_ID ?? "BootCr1RegistryProgramAddressHere11111111",

  // SPL Token program (standard)
  TOKEN_PROGRAM:   "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",

  // Associated Token Account program
  ASSOCIATED_TOKEN: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bv",

  // System program
  SYSTEM:          "11111111111111111111111111111111",
} as const

// Registry PDA seeds
export const PDA_SEEDS = {
  CREDIT_REGISTRY: "credit_registry",
  POOL_REGISTRY:   "pool_registry",
} as const
