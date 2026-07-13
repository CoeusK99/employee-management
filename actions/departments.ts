"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/authorization";
import { departmentSchema } from "@/lib/validation/employee";

export async function listDepartments() {
  await getCurrentUser();
  return prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true } } },
  });
}

export async function createDepartment(input: unknown) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  const data = departmentSchema.parse(input);
  await prisma.department.create({ data });
  revalidatePath("/departments");
}

export async function updateDepartment(id: string, input: unknown) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  const data = departmentSchema.parse(input);
  await prisma.department.update({ where: { id }, data });
  revalidatePath("/departments");
}

export async function deleteDepartment(id: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  const count = await prisma.employee.count({ where: { departmentId: id } });
  if (count > 0) {
    throw new Error("此部門仍有員工，無法刪除");
  }
  await prisma.department.delete({ where: { id } });
  revalidatePath("/departments");
}
