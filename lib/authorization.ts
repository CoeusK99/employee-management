import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@/app/generated/prisma/enums";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export type CurrentUser = {
  id: string;
  role: Role;
  employeeId: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await auth();
  if (!session?.user?.role) {
    throw new UnauthorizedError("Not signed in");
  }
  return {
    id: session.user.id,
    role: session.user.role,
    employeeId: session.user.employeeId,
  };
}

export function requireRole(user: CurrentUser, roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new UnauthorizedError(`Requires role: ${roles.join(", ")}`);
  }
}

/** Returns every employeeId in the subtree rooted at (and including) `rootId`, via BFS over manager relations. */
export async function getSubtreeEmployeeIds(rootId: string): Promise<string[]> {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const reports = await prisma.employee.findMany({
      where: { managerId: { in: frontier } },
      select: { id: true },
    });
    frontier = reports.map((r) => r.id);
    ids.push(...frontier);
  }
  return ids;
}

/** Prisma `where` clause scoping Employee (and Employee-keyed) queries to what `user` may see. */
export async function scopeEmployeeIds(user: CurrentUser): Promise<string[] | null> {
  if (user.role === "ADMIN" || user.role === "HR") return null; // null = unrestricted
  if (!user.employeeId) return [];
  if (user.role === "MANAGER") return getSubtreeEmployeeIds(user.employeeId);
  return [user.employeeId]; // SALES_REP
}
