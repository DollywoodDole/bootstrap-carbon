// src/lib/carbon/stacking.ts
// ============================================================
// CORE IP — Bootstrap IP Ltd.
// CFR + TIER dual-issuance stacking logic
// Alberta TIER + federal Clean Fuels Regulation simultaneously
// One project, two compliance markets, no incremental land.
// Do not simplify this logic. It is the competitive moat.
// ============================================================

import Decimal from "decimal.js";
import { PROTOCOLS } from "./protocols";
import type {
  StackingInput,
  StackingResult,
  StackingEligibility,
  CreditBreakdown,
} from "@/types";

// CFR stacking multiplier by activity type
// Source: Canada Clean Fuels Regulation, Schedule 2
const CFR_MULTIPLIERS: Record<string, number> = {
  "conservation-cropping-reduced-till":  0.45,
  "conservation-cropping-no-till":       0.50,
  "conservation-cropping-first-year":    0.65,  // higher additionality
  "wetland-restoration-restoration":     0.55,
  "wetland-restoration-conservation":    0.48,
  "manure-management-covered":           0.40,
  "manure-management-digester":          0.52,
};

// Activities explicitly ineligible for CFR stacking
const CFR_INELIGIBLE = new Set([
  "beef-methane-feed-additive",
  "cover-crops",
]);

export function checkStackingEligibility(
  protocolId: string,
  projectPractice: string
): StackingEligibility {
  if (CFR_INELIGIBLE.has(protocolId)) {
    return {
      eligible: false,
      reason: `${protocolId} is explicitly excluded from CFR stacking`,
      markets: [],
    };
  }

  const protocol = PROTOCOLS[protocolId];
  if (!protocol) {
    return { eligible: false, reason: "Unknown protocol", markets: [] };
  }

  if (!protocol.cfrStackEligible) {
    return {
      eligible: false,
      reason: "Protocol not designated as CFR-stackable",
      markets: [],
    };
  }

  const multiplierKey = `${protocolId}-${projectPractice}`;
  const multiplier = CFR_MULTIPLIERS[multiplierKey];

  if (!multiplier) {
    return {
      eligible: false,
      reason: `No CFR multiplier defined for practice: ${projectPractice}`,
      markets: [],
    };
  }

  return {
    eligible: true,
    reason: null,
    markets: ["AB-TIER", "CA-CFR"],
    cfrMultiplier: multiplier,
  };
}

export function calculateStackedCredits(input: StackingInput): StackingResult {
  const {
    protocolId,
    projectPractice,
    hectares,
    isFirstYear,
    baseYieldTonnesPerHa,
  } = input;

  const baseDecimal = new Decimal(baseYieldTonnesPerHa);
  const haDecimal = new Decimal(hectares);

  // Base TIER credits
  const tierCredits = baseDecimal.times(haDecimal);

  // First-year additionality premium
  const firstYearMultiplier = isFirstYear ? new Decimal("1.35") : new Decimal("1.0");
  const adjustedTier = tierCredits.times(firstYearMultiplier);

  // CFR stacking eligibility
  const eligibility = checkStackingEligibility(protocolId, projectPractice);

  const breakdown: CreditBreakdown[] = [
    {
      market: "AB-TIER",
      quantity: adjustedTier,
      priceFloor: new Decimal("17"),    // market floor as of Q1 2026
      priceCeiling: new Decimal("95"),  // fund price ceiling
      complianceType: "compliance",
    },
  ];

  let cfrCredits = new Decimal(0);

  if (eligibility.eligible && eligibility.cfrMultiplier) {
    cfrCredits = adjustedTier.times(
      new Decimal(eligibility.cfrMultiplier)
    );
    breakdown.push({
      market: "CA-CFR",
      quantity: cfrCredits,
      priceFloor: new Decimal("20"),
      priceCeiling: new Decimal("95"),
      complianceType: "compliance",
    });
  }

  // Voluntary market premium for high-integrity credits
  // (on-chain provenance + continuous monitoring qualifies)
  const voluntaryPremiumMultiplier = new Decimal("0.15");
  const voluntaryCredits = adjustedTier.times(voluntaryPremiumMultiplier);

  if (PROTOCOLS[protocolId]?.voluntaryEligible) {
    breakdown.push({
      market: "VOLUNTARY",
      quantity: voluntaryCredits,
      priceFloor: new Decimal("30"),    // ICVCM-aligned credits
      priceCeiling: new Decimal("120"),
      complianceType: "voluntary",
    });
  }

  const totalCredits = breakdown.reduce(
    (sum, b) => sum.plus(b.quantity),
    new Decimal(0)
  );

  const stackingMultiplier = tierCredits.isZero()
    ? new Decimal(1)
    : totalCredits.div(tierCredits);

  return {
    breakdown,
    totalCredits,
    tierCredits: adjustedTier,
    cfrCredits,
    voluntaryCredits,
    stackingMultiplier,
    stackingEligibility: eligibility,
    firstYearBonus: isFirstYear,
    estimatedRevenue: estimateRevenue(breakdown),
  };
}

function estimateRevenue(breakdown: CreditBreakdown[]): Decimal {
  return breakdown.reduce((sum, b) => {
    // Use mid-point of price range for estimate
    const midPrice = b.priceFloor.plus(b.priceCeiling).div(2);
    return sum.plus(b.quantity.times(midPrice));
  }, new Decimal(0));
}

// Pool-level stacking: aggregate across all projects in a pool
export function calculatePoolStacking(
  projects: StackingInput[]
): {
  totalCredits: Decimal;
  totalRevenue: Decimal;
  avgStackingMultiplier: Decimal;
  perProject: StackingResult[];
} {
  const perProject = projects.map(calculateStackedCredits);

  const totalCredits = perProject.reduce(
    (sum, r) => sum.plus(r.totalCredits),
    new Decimal(0)
  );

  const totalRevenue = perProject.reduce(
    (sum, r) => sum.plus(r.estimatedRevenue),
    new Decimal(0)
  );

  const avgStackingMultiplier = perProject.length === 0
    ? new Decimal(1)
    : perProject
        .reduce((sum, r) => sum.plus(r.stackingMultiplier), new Decimal(0))
        .div(perProject.length);

  return { totalCredits, totalRevenue, avgStackingMultiplier, perProject };
}