// src/lib/carbon/protocols.ts
// Alberta quantification protocol registry
// ALL protocol data lives here — no external API dependencies

import type { Protocol, ProtocolVersion } from "@/types";

export const PROTOCOLS: Record<string, Protocol> = {
  "conservation-cropping": {
    id: "conservation-cropping",
    name: "Conservation Cropping",
    description: "Reduced tillage and no-till on annual cropland",
    currentVersion: "2.1",
    complianceMarkets: ["AB-TIER", "CA-OBPS"],
    cfrStackEligible: true,
    voluntaryEligible: true,
    versions: {
      "2.1": {
        effectiveDate: "2024-01-01",
        handbookVersion: "3.2",
        baselinePractice: ["conventional-till", "minimum-till"],
        projectPractice: ["reduced-till", "no-till"],
        creditingPeriodYears: 5,
        yieldRange: {
          reducedTill:  { min: 0.08, max: 0.18 },  // tCO2e/ha/yr
          noTill:       { min: 0.10, max: 0.28 },
          firstYear:    { min: 0.18, max: 0.35 },  // additionality premium
        },
        monitoringFrequency: "annual",
        verificationRequired: true,
      }
    }
  },

  "wetland-restoration": {
    id: "wetland-restoration",
    name: "Wetland Restoration and Conservation",
    description: "Restoration of drained prairie potholes and wetlands",
    currentVersion: "1.3",
    complianceMarkets: ["AB-TIER", "CA-OBPS"],
    cfrStackEligible: true,
    voluntaryEligible: true,
    versions: {
      "1.3": {
        effectiveDate: "2023-06-01",
        handbookVersion: "3.1",
        baselinePractice: ["drained", "cultivated"],
        projectPractice: ["restored", "conserved"],
        creditingPeriodYears: 10,
        yieldRange: {
          restoration:  { min: 0.30, max: 0.80 },
          conservation: { min: 0.20, max: 0.55 },
        },
        monitoringFrequency: "annual",
        verificationRequired: true,
      }
    }
  },

  "beef-methane-feed-additive": {
    id: "beef-methane-feed-additive",
    name: "Reducing GHG Emissions from Beef Cattle — Feed Additives",
    description: "Enteric methane reduction via Bovaer (3-NOP) or similar",
    currentVersion: "1.0",
    complianceMarkets: ["AB-TIER"],
    cfrStackEligible: false,   // NOT stackable — important
    voluntaryEligible: true,
    versions: {
      "1.0": {
        effectiveDate: "2023-01-01",
        handbookVersion: "3.0",
        baselinePractice: ["standard-feeding"],
        projectPractice: ["feed-additive"],
        creditingPeriodYears: 5,
        yieldRange: {
          bovaer: { min: 0.15, max: 0.28 },  // tCO2e/head/yr
        },
        monitoringFrequency: "continuous",
        verificationRequired: true,
      }
    }
  },

  "manure-management": {
    id: "manure-management",
    name: "Quantifying GHG Emissions Reductions from Anaerobic Digesters",
    description: "Methane capture from livestock manure lagoons",
    currentVersion: "2.0",
    complianceMarkets: ["AB-TIER", "CA-OBPS"],
    cfrStackEligible: true,
    voluntaryEligible: true,
    versions: {
      "2.0": {
        effectiveDate: "2022-01-01",
        handbookVersion: "3.0",
        baselinePractice: ["open-lagoon"],
        projectPractice: ["covered-lagoon", "anaerobic-digester"],
        creditingPeriodYears: 10,
        yieldRange: {
          covered:   { min: 0.40, max: 0.90 },
          digester:  { min: 0.60, max: 1.40 },
        },
        monitoringFrequency: "continuous",
        verificationRequired: true,
      }
    }
  },

  "cover-crops": {
    id: "cover-crops",
    name: "Cover Cropping for Soil Carbon",
    description: "Annual cover crops for soil organic carbon sequestration",
    currentVersion: "1.1",
    complianceMarkets: ["AB-TIER"],
    cfrStackEligible: false,   // limited eligibility
    voluntaryEligible: true,
    versions: {
      "1.1": {
        effectiveDate: "2023-01-01",
        handbookVersion: "3.1",
        baselinePractice: ["no-cover-crop"],
        projectPractice: ["cover-crop"],
        creditingPeriodYears: 5,
        yieldRange: {
          annual: { min: 0.06, max: 0.14 },
        },
        monitoringFrequency: "annual",
        verificationRequired: true,
      }
    }
  },
};

export const HANDBOOK_VERSION = "3.2";
export const STANDARD_VERSION = "3.3";
export const VERIFICATION_TEMPLATE_VERSION = "4.0";

export function getProtocol(id: string): Protocol | undefined {
  return PROTOCOLS[id];
}

export function getStackableProtocols(): Protocol[] {
  return Object.values(PROTOCOLS).filter(p => p.cfrStackEligible);
}

export function getVersionForDate(
  protocolId: string,
  date: Date
): ProtocolVersion | null {
  const protocol = PROTOCOLS[protocolId];
  if (!protocol) return null;
  const versions = Object.entries(protocol.versions)
    .filter(([, v]) => new Date(v.effectiveDate) <= date)
    .sort(([, a], [, b]) =>
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
  return versions[0]?.[1] ?? null;
}