// src/lib/carbon/calculator.ts
// Core credit yield calculation engine
// All math uses Decimal.js — never floats for financial calculations

import Decimal from "decimal.js";
import { PROTOCOLS, getVersionForDate } from "./protocols";
import type {
  FarmInputs,
  CreditEstimate,
  ProtocolYieldRange,
} from "@/types";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function estimateCredits(inputs: FarmInputs): CreditEstimate {
  const {
    protocolId,
    hectares,
    projectPractice,
    currentPractice,
    registrationDate = new Date(),
    isFirstYearSwitch = false,
  } = inputs;

  const protocol = PROTOCOLS[protocolId];
  if (!protocol) {
    throw new Error(`Unknown protocol: ${protocolId}`);
  }

  const version = getVersionForDate(protocolId, registrationDate);
  if (!version) {
    throw new Error(`No valid protocol version for date: ${registrationDate}`);
  }

  // Get yield range for this practice combination
  const yieldKey = isFirstYearSwitch ? "firstYear" : projectPractice;
  const yieldRange = version.yieldRange[yieldKey] as ProtocolYieldRange | undefined;

  if (!yieldRange) {
    throw new Error(
      `No yield range for practice: ${projectPractice} (version ${version})`
    );
  }

  const ha = new Decimal(hectares);
  const low  = new Decimal(yieldRange.min).times(ha);
  const mid  = new Decimal((yieldRange.min + yieldRange.max) / 2).times(ha);
  const high = new Decimal(yieldRange.max).times(ha);

  // Per-year estimates
  const annualLow  = low.toDecimalPlaces(3);
  const annualMid  = mid.toDecimalPlaces(3);
  const annualHigh = high.toDecimalPlaces(3);

  // Full crediting period
  const years = new Decimal(version.creditingPeriodYears);
  const totalLow  = annualLow.times(years);
  const totalMid  = annualMid.times(years);
  const totalHigh = annualHigh.times(years);

  return {
    protocol: {
      id: protocolId,
      name: protocol.name,
      version: Object.keys(protocol.versions).find(
        k => protocol.versions[k] === version
      ) ?? "unknown",
    },
    annual: {
      low:  annualLow,
      mid:  annualMid,
      high: annualHigh,
    },
    total: {
      low:  totalLow,
      mid:  totalMid,
      high: totalHigh,
    },
    creditingPeriodYears: version.creditingPeriodYears,
    isFirstYearBonus: isFirstYearSwitch,
    cfrStackEligible: protocol.cfrStackEligible,
    verificationRequired: version.verificationRequired,
  };
}

export function estimatePoolEconomics(
  credits: Decimal,
  price: Decimal,
  platformFeeRate: Decimal = new Decimal("0.10"),
  verificationCost: Decimal = new Decimal("30000")
): {
  grossRevenue: Decimal;
  platformFee: Decimal;
  verificationCostPerFarm: (farms: number) => Decimal;
  netToFarmers: Decimal;
} {
  const grossRevenue = credits.times(price);
  const platformFee = grossRevenue.times(platformFeeRate);
  const netToFarmers = grossRevenue.minus(platformFee);

  return {
    grossRevenue,
    platformFee,
    verificationCostPerFarm: (farms: number) =>
      verificationCost.div(new Decimal(farms)).toDecimalPlaces(2),
    netToFarmers,
  };
}