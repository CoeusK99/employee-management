import { z } from "zod";

export const percentageTierConfigSchema = z.object({
  tiers: z
    .array(
      z.object({
        min: z.number().min(0),
        max: z.number().nullable(),
        rate: z.number().min(0).max(1),
      })
    )
    .min(1, "至少需要一個級距"),
});

export const kpiBonusConfigSchema = z.object({
  thresholds: z
    .array(
      z.object({
        achievementPct: z.number().min(0),
        bonus: z.number().min(0),
      })
    )
    .min(1, "至少需要一個門檻"),
});

export const overrideConfigSchema = z.object({
  levels: z
    .array(
      z.object({
        level: z.number().int().min(1),
        percent: z.number().min(0).max(1),
      })
    )
    .min(1, "至少需要一個層級"),
});

export const commissionRuleFormSchema = z.object({
  name: z.string().min(1, "必填"),
  type: z.enum(["PERCENTAGE_TIER", "KPI_BONUS", "OVERRIDE"]),
  active: z.boolean(),
  effectiveFrom: z.string().min(1, "必填"),
  effectiveTo: z.string().nullable().optional(),
  config: z.union([percentageTierConfigSchema, kpiBonusConfigSchema, overrideConfigSchema]),
});

export type CommissionRuleFormValues = z.infer<typeof commissionRuleFormSchema>;

export function validateConfigForType(type: string, config: unknown) {
  if (type === "PERCENTAGE_TIER") return percentageTierConfigSchema.parse(config);
  if (type === "KPI_BONUS") return kpiBonusConfigSchema.parse(config);
  if (type === "OVERRIDE") return overrideConfigSchema.parse(config);
  throw new Error("Unknown rule type");
}
