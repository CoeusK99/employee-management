"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  getCurrentUser,
  requireRole,
  scopeEmployeeIds,
  getSubtreeEmployeeIds,
  UnauthorizedError,
} from "@/lib/authorization";
import { employeeSchema } from "@/lib/validation/employee";

async function wouldCreateCycle(employeeId: string, proposedManagerId: string) {
  if (proposedManagerId === employeeId) return true;
  let current: string | null = proposedManagerId;
  const seen = new Set<string>();
  while (current) {
    if (current === employeeId) return true;
    if (seen.has(current)) break; // defensive: pre-existing corrupt data, stop looping
    seen.add(current);
    const manager: { managerId: string | null } | null = await prisma.employee.findUnique({
      where: { id: current },
      select: { managerId: true },
    });
    current = manager?.managerId ?? null;
  }
  return false;
}

export async function listEmployees() {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  return prisma.employee.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { department: true, manager: true },
  });
}

export async function getEmployee(id: string) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  if (ids && !ids.includes(id)) {
    throw new UnauthorizedError("無權查看此員工");
  }
  return prisma.employee.findUniqueOrThrow({
    where: { id },
    include: { department: true, manager: true, reports: true },
  });
}

export async function listDepartmentOptions() {
  await getCurrentUser();
  return prisma.department.findMany({ orderBy: { name: "asc" } });
}

export async function listManagerOptions() {
  await getCurrentUser();
  return prisma.employee.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, title: true },
  });
}

export async function createEmployee(input: unknown) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  const data = employeeSchema.parse(input);
  await prisma.employee.create({
    data: {
      ...data,
      managerId: data.managerId || null,
      hireDate: new Date(data.hireDate),
    },
  });
  revalidatePath("/employees");
}

export async function updateEmployee(id: string, input: unknown) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN", "HR"]);
  const data = employeeSchema.parse(input);

  if (data.managerId && (await wouldCreateCycle(id, data.managerId))) {
    throw new Error("無法指派此主管：會形成組織圖循環");
  }

  await prisma.employee.update({
    where: { id },
    data: {
      ...data,
      managerId: data.managerId || null,
      hireDate: new Date(data.hireDate),
    },
  });
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
}

export async function getOrgSubtree(rootId: string) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  if (ids && !ids.includes(rootId)) {
    throw new UnauthorizedError("無權查看此員工");
  }
  const subtreeIds = await getSubtreeEmployeeIds(rootId);
  return prisma.employee.findMany({
    where: { id: { in: subtreeIds } },
    select: { id: true, firstName: true, lastName: true, title: true, managerId: true },
  });
}
