"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole, scopeEmployeeIds, UnauthorizedError } from "@/lib/authorization";
import { targetSchema } from "@/lib/validation/target";

export async function listTargetsForEmployee(employeeId: string) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  if (ids && !ids.includes(employeeId)) {
    throw new UnauthorizedError("無權查看此員工的配額");
  }
  return prisma.target.findMany({
    where: { employeeId },
    orderBy: [{ periodType: "asc" }, { periodKey: "desc" }],
  });
}

export async function upsertTarget(input: unknown) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "MANAGER"]);
  const data = targetSchema.parse(input);
  const ids = await scopeEmployeeIds(user);
  if (ids && !ids.includes(data.employeeId)) {
    throw new UnauthorizedError("無權為此員工設定配額");
  }

  await prisma.target.upsert({
    where: {
      employeeId_periodType_periodKey: {
        employeeId: data.employeeId,
        periodType: data.periodType,
        periodKey: data.periodKey,
      },
    },
    update: { quotaAmount: data.quotaAmount },
    create: data,
  });
  revalidatePath(`/employees/${data.employeeId}`);
}

export async function deleteTarget(id: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "MANAGER"]);
  const target = await prisma.target.findUniqueOrThrow({ where: { id } });
  const ids = await scopeEmployeeIds(user);
  if (ids && !ids.includes(target.employeeId)) {
    throw new UnauthorizedError("無權刪除此配額");
  }
  await prisma.target.delete({ where: { id } });
  revalidatePath(`/employees/${target.employeeId}`);
}
