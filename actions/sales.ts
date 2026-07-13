"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole, scopeEmployeeIds, UnauthorizedError } from "@/lib/authorization";
import { salesRecordSchema } from "@/lib/validation/sales";
import { monthlyPeriodKey } from "@/lib/period";

async function assertPeriodNotFinalized(employeeId: string, saleDate: Date) {
  const periodKey = monthlyPeriodKey(saleDate);
  const calc = await prisma.commissionCalculation.findUnique({
    where: {
      employeeId_periodType_periodKey: { employeeId, periodType: "MONTHLY", periodKey },
    },
    select: { status: true },
  });
  if (calc?.status === "FINALIZED") {
    throw new Error(`此期間（${periodKey}）獎金已結算鎖定，無法修改銷售紀錄`);
  }
}

export async function listSalesRecords() {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  return prisma.salesRecord.findMany({
    where: ids ? { employeeId: { in: ids } } : undefined,
    orderBy: { saleDate: "desc" },
    include: { employee: true },
  });
}

export async function getSalesRecord(id: string) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  const record = await prisma.salesRecord.findUniqueOrThrow({
    where: { id },
    include: { employee: true },
  });
  if (ids && !ids.includes(record.employeeId)) {
    throw new UnauthorizedError("無權查看此銷售紀錄");
  }
  return record;
}

export async function listSalesEmployeeOptions() {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  return prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      ...(ids ? { id: { in: ids } } : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });
}

async function assertCanWriteFor(employeeId: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "MANAGER", "SALES_REP"]);
  const ids = await scopeEmployeeIds(user);
  if (ids && !ids.includes(employeeId)) {
    throw new UnauthorizedError("無權為此員工建立/編輯銷售紀錄");
  }
}

export async function createSalesRecord(input: unknown) {
  const data = salesRecordSchema.parse(input);
  await assertCanWriteFor(data.employeeId);
  const saleDate = new Date(data.saleDate);
  await assertPeriodNotFinalized(data.employeeId, saleDate);

  await prisma.salesRecord.create({
    data: {
      employeeId: data.employeeId,
      customerName: data.customerName,
      amount: data.amount,
      saleDate,
      notes: data.notes || null,
    },
  });
  revalidatePath("/sales");
}

export async function updateSalesRecord(id: string, input: unknown) {
  const existing = await prisma.salesRecord.findUniqueOrThrow({ where: { id } });
  const data = salesRecordSchema.parse(input);
  await assertCanWriteFor(data.employeeId);
  const saleDate = new Date(data.saleDate);
  await assertPeriodNotFinalized(existing.employeeId, existing.saleDate);
  await assertPeriodNotFinalized(data.employeeId, saleDate);

  await prisma.salesRecord.update({
    where: { id },
    data: {
      employeeId: data.employeeId,
      customerName: data.customerName,
      amount: data.amount,
      saleDate,
      notes: data.notes || null,
    },
  });
  revalidatePath("/sales");
  revalidatePath(`/sales/${id}`);
}

export async function deleteSalesRecord(id: string) {
  const existing = await prisma.salesRecord.findUniqueOrThrow({ where: { id } });
  await assertCanWriteFor(existing.employeeId);
  await assertPeriodNotFinalized(existing.employeeId, existing.saleDate);
  await prisma.salesRecord.delete({ where: { id } });
  revalidatePath("/sales");
}
