// src/lib/carbon/optimizer.ts
// Protocol optimizer: given farm inputs → max yield recommendation
// This is the sales tool. Show "base" vs "with stacking" clearly.

import Decimal from "decimal.js";
import { PROTOCOLS } from "./protocols";
import { estimateCredits } from "./calculator";
import { calculateStackedCredits } from "./stacking";
import type { FarmProfile, OptimizationResult } from "@/types";

export function optimizeFarm(profile: FarmProfile): OptimizationResult[] {
  const {
    hectares,
    currentPractice,
    province,
    hasLivestock,
    hasWetlands,
    isFirstYearSwitch,
  } = profile;

  const results: OptimizationResult[] = [];

  for (const [id, protocol] of Object.entries(PROTOCOLS)) {
    // Filter by province/eligibility
    if (province === "SK" && id === "wetland-restoration" && !hasWetlands) {
      continue;
    }
    if (!hasLivestock && id === "beef-methane-feed-additive") {
      continue;
    }

    try {
      // Find best-fit practice
      const version = Object.values(protocol.versions)[0];
      const practices = version?.projectPractice ?? [];

      for (const practice of practices) {
        const base = estimateCredits({
          protocolId: id,
          hectares,
          projectPractice: practice,
          currentPractice,
          isFirstYearSwitch,
        });

        const stacked = calculateStackedCredits({
          protocolId: id,
          projectPractice: practice,
          hectares,
          isFirstYear: isFirstYearSwitch,
          baseYieldTonnesPerHa: base.annual.mid.div(hectares).toNumber(),
        });

        const upliftPct = base.annual.mid.isZero() ? 0 :
          stacked.stackingMultiplier.minus(1).times(100).toNumber();

        results.push({
          protocolId: id,
          protocolName: protocol.name,
          practice,
          baseCreditsAnnual: base.annual.mid,
          stackedCreditsAnnual: stacked.totalCredits.div(
            new Decimal(version?.creditingPeriodYears ?? 5)
          ),
          stackingMultiplier: stacked.stackingMultiplier,
          stackingUpliftPercent: Math.round(upliftPct),
          cfrEligible: protocol.cfrStackEligible,
          estimatedAnnualRevenue: stacked.estimatedRevenue.div(
            new Decimal(version?.creditingPeriodYears ?? 5)
          ),
          recommendationScore: scoreRecommendation(stacked, upliftPct),
        });
      }
    } catch {
      // Protocol not applicable for this farm — skip
    }
  }

  return results.sort((a, b) =>
    b.recommendationScore - a.recommendationScore
  );
}

function scoreRecommendation(
  result: ReturnType<typeof import("./stacking").calculateStackedCredits>,
  upliftPct: number
): number {
  let score = result.totalCredits.toNumber() * 10;
  score += upliftPct * 2;
  if (result.firstYearBonus) score += 50;
  if (result.stackingEligibility.eligible) score += 30;
  return Math.round(score);
}