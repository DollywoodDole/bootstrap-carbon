// src/constants/protocols.ts
// Protocol names, versions, registry IDs
// Keep in sync with src/lib/carbon/protocols.ts

export const PROTOCOL_NAMES: Record<string, string> = {
  "conservation-cropping":        "Conservation Cropping",
  "wetland-restoration":          "Wetland Restoration and Conservation",
  "beef-methane-feed-additive":   "Reducing GHG Emissions from Beef Cattle — Feed Additives",
  "manure-management":            "Quantifying GHG Emissions Reductions from Anaerobic Digesters",
  "cover-crops":                  "Cover Cropping for Soil Carbon",
}

export const PROTOCOL_VERSIONS: Record<string, string> = {
  "conservation-cropping":        "2.1",
  "wetland-restoration":          "1.3",
  "beef-methane-feed-additive":   "1.0",
  "manure-management":            "2.0",
  "cover-crops":                  "1.1",
}

// Alberta Emissions Offset Registry protocol IDs
export const AB_REGISTRY_IDS: Record<string, string> = {
  "conservation-cropping":        "AEOR-CC-v2.1",
  "wetland-restoration":          "AEOR-WR-v1.3",
  "beef-methane-feed-additive":   "AEOR-BF-v1.0",
  "manure-management":            "AEOR-MM-v2.0",
  "cover-crops":                  "AEOR-CV-v1.1",
}

// Current handbook and standard versions (from CLAUDE.md)
export const HANDBOOK_VERSION        = "3.2"  // Carbon Offset Emission Factors Handbook
export const STANDARD_VERSION        = "3.3"  // Standard for GHG Offset Project Developers
export const VERIFICATION_TEMPLATE   = "4.0"  // Offset Verification Report Template

// Compliance markets
export const COMPLIANCE_MARKETS = {
  "AB-TIER":  "Alberta Technology Innovation and Emissions Reduction",
  "CA-OBPS":  "Canada Output-Based Pricing System",
  "CA-CFR":   "Canada Clean Fuels Regulation",
  "VOLUNTARY": "Voluntary Carbon Market",
} as const

export type ComplianceMarket = keyof typeof COMPLIANCE_MARKETS

// Stacking eligible protocols (CFR stackable)
export const STACKABLE_PROTOCOLS = [
  "conservation-cropping",
  "wetland-restoration",
  "manure-management",
]

// Protocols NOT eligible for CFR stacking
export const NON_STACKABLE_PROTOCOLS = [
  "beef-methane-feed-additive",
  "cover-crops",
]
