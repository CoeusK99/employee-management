import { z } from "zod";

export const targetSchema = z.object({
  employeeId: z.string().min(1),
  periodType: z.enum(["MONTHLY", "QUARTERLY"]),
  periodKey: z
    .string()
    .min(1, "必填")
    .regex(/^\d{4}-(0[1-9]|1[0-2]|Q[1-4])$/, "格式需為 2026-07 或 2026-Q3"),
  quotaAmount: z.number().positive("配額必須大於 0"),
});

export type TargetFormValues = z.infer<typeof targetSchema>;
