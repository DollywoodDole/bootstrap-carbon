// src/types/index.ts
// Shared TypeScript types — define here, use everywhere
// Update this file first when building a new feature

import Decimal from "decimal.js";

// ── Protocol types ─────────────────────────────────────────
export interface ProtocolYieldRange {
  min: number;
  max: number;
}

export interface ProtocolVersion {
  effectiveDate: string;
  handbookVersion: string;
  baselinePractice: string[];
  projectPractice: string[];
  creditingPeriodYears: number;
  yieldRange: Record<string, ProtocolYieldRange>;
  monitoringFrequency: "continuous" | "annual" | "biennial";
  verificationRequired: boolean;
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
  currentVersion: string;
  complianceMarkets: string[];
  cfrStackEligible: boolean;
  voluntaryEligible: boolean;
  versions: Record<string, ProtocolVersion>;
}

// ── Calculator types ───────────────────────────────────────
export interface FarmInputs {
  protocolId: string;
  hectares: number;
  projectPractice: string;
  currentPractice: string;
  registrationDate?: Date;
  isFirstYearSwitch?: boolean;
}

export interface CreditEstimate {
  protocol: { id: string; name: string; version: string };
  annual: { low: Decimal; mid: Decimal; high: Decimal };
  total:  { low: Decimal; mid: Decimal; high: Decimal };
  creditingPeriodYears: number;
  isFirstYearBonus: boolean;
  cfrStackEligible: boolean;
  verificationRequired: boolean;
}

// ── Stacking types ─────────────────────────────────────────
export interface StackingInput {
  protocolId: string;
  projectPractice: string;
  hectares: number;
  isFirstYear: boolean;
  baseYieldTonnesPerHa: number;
}

export interface StackingEligibility {
  eligible: boolean;
  reason: string | null;
  markets: string[];
  cfrMultiplier?: number;
}

export interface CreditBreakdown {
  market: string;
  quantity: Decimal;
  priceFloor: Decimal;
  priceCeiling: Decimal;
  complianceType: "compliance" | "voluntary";
}

export interface StackingResult {
  breakdown: CreditBreakdown[];
  totalCredits: Decimal;
  tierCredits: Decimal;
  cfrCredits: Decimal;
  voluntaryCredits: Decimal;
  stackingMultiplier: Decimal;
  stackingEligibility: StackingEligibility;
  firstYearBonus: boolean;
  estimatedRevenue: Decimal;
}

// ── Optimizer types ────────────────────────────────────────
export interface FarmProfile {
  hectares: number;
  currentPractice: string;
  province: "SK" | "AB";
  hasLivestock: boolean;
  hasWetlands: boolean;
  soilZone?: string;
  landClass?: string;
  isFirstYearSwitch: boolean;
}

export interface OptimizationResult {
  protocolId: string;
  protocolName: string;
  practice: string;
  baseCreditsAnnual: Decimal;
  stackedCreditsAnnual: Decimal;
  stackingMultiplier: Decimal;
  stackingUpliftPercent: number;
  cfrEligible: boolean;
  estimatedAnnualRevenue: Decimal;
  recommendationScore: number;
}

// ── API response types ─────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export type ApiHandler<T> = () => Promise<ApiResponse<T>>;