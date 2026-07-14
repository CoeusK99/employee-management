"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole, UnauthorizedError } from "@/lib/authorization";

export type PayrollAdjustment = { label: string; amount: number };

const adjustmentsSchema = z.array(
  z.object({
    label: z.string().min(1, "項目名稱必填"),
    amount: z.number(),
  })
);

function sumTotal(base: number, commission: number, adjustments: PayrollAdjustment[]) {
  return base + commission + adjustments.reduce((s, a) => s + a.amount, 0);
}

/** 產生（或重算）某月所有在職員工的薪資單草稿；已發布的略過不動。 */
export async function generatePayroll(periodKey: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodKey)) {
    throw new Error("期間格式需為 2026-07");
  }

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, baseSalary: true },
  });

  const commissions = await prisma.commissionCalculation.findMany({
    where: { periodType: "MONTHLY", periodKey, status: "FINALIZED" },
    select: { employeeId: true, totalAmount: true },
  });
  const commissionByEmployee = new Map(
    commissions.map((c) => [c.employeeId, Number(c.totalAmount)])
  );

  const draftCommissions = await prisma.commissionCalculation.count({
    where: { periodType: "MONTHLY", periodKey, status: "DRAFT" },
  });

  const existing = await prisma.payrollRecord.findMany({
    where: { periodKey },
    select: { employeeId: true, status: true, adjustments: true },
  });
  const existingByEmployee = new Map(existing.map((e) => [e.employeeId, e]));

  let generated = 0;
  let skippedPublished = 0;

  for (const emp of employees) {
    const prior = existingByEmployee.get(emp.id);
    if (prior?.status === "PUBLISHED") {
      skippedPublished += 1;
      continue;
    }
    const base = Number(emp.baseSalary);
    const commission = commissionByEmployee.get(emp.id) ?? 0;
    // 重算時保留 HR 已輸入的加減項
    const adjustments = (prior?.adjustments as PayrollAdjustment[] | undefined) ?? [];
    const total = sumTotal(base, commission, adjustments);

    await prisma.payrollRecord.upsert({
      where: { employeeId_periodKey: { employeeId: emp.id, periodKey } },
      update: {
        baseSalary: base,
        commissionTotal: commission,
        adjustments,
        totalAmount: total,
        status: "DRAFT",
      },
      create: {
        employeeId: emp.id,
        periodKey,
        baseSalary: base,
        commissionTotal: commission,
        adjustments,
        totalAmount: total,
        status: "DRAFT",
      },
    });
    generated += 1;
  }

  revalidatePath("/payroll");
  return { generated, skippedPublished, draftCommissions };
}

export async function listPayroll(periodKey: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  return prisma.payrollRecord.findMany({
    where: { periodKey },
    include: { employee: true },
    orderBy: { totalAmount: "desc" },
  });
}

export async function updatePayrollAdjustments(id: string, input: unknown) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  const adjustments = adjustmentsSchema.parse(input);

  const record = await prisma.payrollRecord.findUniqueOrThrow({ where: { id } });
  if (record.status === "PUBLISHED") {
    throw new Error("薪資單已發布，無法修改；請先取消發布");
  }

  const total = sumTotal(Number(record.baseSalary), Number(record.commissionTotal), adjustments);
  await prisma.payrollRecord.update({
    where: { id },
    data: { adjustments, totalAmount: total },
  });
  revalidatePath("/payroll");
}

export async function publishPayroll(periodKey: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  const result = await prisma.payrollRecord.updateMany({
    where: { periodKey, status: "DRAFT" },
    data: { status: "PUBLISHED", publishedAt: new Date(), publishedBy: user.id },
  });
  revalidatePath("/payroll");
  return { published: result.count };
}

export async function unpublishPayroll(periodKey: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  const result = await prisma.payrollRecord.updateMany({
    where: { periodKey, status: "PUBLISHED" },
    data: { status: "DRAFT", publishedAt: null, publishedBy: null },
  });
  revalidatePath("/payroll");
  return { unpublished: result.count };
}

/** 員工（含醫師）查看自己已發布的薪資單。 */
export async function listMyPayroll() {
  const user = await getCurrentUser();
  if (!user.employeeId) {
    throw new UnauthorizedError("此帳號未連結員工資料");
  }
  return prisma.payrollRecord.findMany({
    where: { employeeId: user.employeeId, status: "PUBLISHED" },
    orderBy: { periodKey: "desc" },
  });
}
