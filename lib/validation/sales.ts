import { z } from "zod";

export const salesRecordSchema = z.object({
  employeeId: z.string().min(1, "請選擇員工"),
  customerName: z.string().min(1, "必填"),
  amount: z.number().positive("金額必須大於 0"),
  saleDate: z.string().min(1, "必填"),
  notes: z.string().optional(),
});

export type SalesRecordFormValues = z.infer<typeof salesRecordSchema>;
