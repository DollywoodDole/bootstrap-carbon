// src/app/api/calculator/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { optimizeFarm } from "@/lib/carbon/optimizer";
import { calculateStackedCredits } from "@/lib/carbon/stacking";
import { estimateCredits } from "@/lib/carbon/calculator";
import type { ApiResponse } from "@/types";

const OptimizeSchema = z.object({
  hectares:        z.number().positive().max(100000),
  currentPractice: z.string().min(1),
  province:        z.enum(["SK", "AB"]),
  hasLivestock:    z.boolean().default(false),
  hasWetlands:     z.boolean().default(false),
  isFirstYearSwitch: z.boolean().default(false),
});

const EstimateSchema = z.object({
  protocolId:      z.string().min(1),
  hectares:        z.number().positive(),
  projectPractice: z.string().min(1),
  currentPractice: z.string().min(1),
  isFirstYearSwitch: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, ...inputs } = body;

    if (mode === "optimize") {
      const parsed = OptimizeSchema.safeParse(inputs);
      if (!parsed.success) {
        return NextResponse.json<ApiResponse<null>>({
          data: null,
          error: parsed.error.message,
          success: false,
        }, { status: 400 });
      }

      const results = optimizeFarm(parsed.data);

      return NextResponse.json<ApiResponse<typeof results>>({
        data: results.slice(0, 5),  // top 5 recommendations
        error: null,
        success: true,
      });
    }

    if (mode === "estimate") {
      const parsed = EstimateSchema.safeParse(inputs);
      if (!parsed.success) {
        return NextResponse.json<ApiResponse<null>>({
          data: null,
          error: parsed.error.message,
          success: false,
        }, { status: 400 });
      }

      const estimate = estimateCredits(parsed.data);
      const stacked = calculateStackedCredits({
        protocolId: parsed.data.protocolId,
        projectPractice: parsed.data.projectPractice,
        hectares: parsed.data.hectares,
        isFirstYear: parsed.data.isFirstYearSwitch,
        baseYieldTonnesPerHa: estimate.annual.mid
          .div(parsed.data.hectares)
          .toNumber(),
      });

      return NextResponse.json({
        data: { estimate, stacked },
        error: null,
        success: true,
      });
    }

    return NextResponse.json(
      { data: null, error: "Invalid mode", success: false },
      { status: 400 }
    );
  } catch (err) {
    console.error("[calculator]", err);
    return NextResponse.json(
      { data: null, error: "Internal error", success: false },
      { status: 500 }
    );
  }
}