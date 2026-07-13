"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser, scopeEmployeeIds } from "@/lib/authorization";
import { monthlyPeriodKey, periodDateRange } from "@/lib/period";

function recentMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(monthlyPeriodKey(d));
  }
  return keys;
}

export async function getSalesTrend(months = 6) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  const keys = recentMonthKeys(months);

  const results = await Promise.all(
    keys.map(async (periodKey) => {
      const { start, end } = periodDateRange("MONTHLY", periodKey);
      const agg = await prisma.salesRecord.aggregate({
        where: {
          saleDate: { gte: start, lt: end },
          ...(ids ? { employeeId: { in: ids } } : {}),
        },
        _sum: { amount: true },
      });
      return { periodKey, total: Number(agg._sum.amount ?? 0) };
    })
  );
  return results;
}

export async function getCommissionTrend(months = 6) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  const keys = recentMonthKeys(months);

  const results = await Promise.all(
    keys.map(async (periodKey) => {
      const agg = await prisma.commissionCalculation.aggregate({
        where: {
          periodType: "MONTHLY",
          periodKey,
          ...(ids ? { employeeId: { in: ids } } : {}),
        },
        _sum: { totalAmount: true },
      });
      return { periodKey, total: Number(agg._sum.totalAmount ?? 0) };
    })
  );
  return results;
}

export async function getLeaderboard(periodKey: string) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  const records = await prisma.commissionCalculation.findMany({
    where: {
      periodType: "MONTHLY",
      periodKey,
      ...(ids ? { employeeId: { in: ids } } : {}),
    },
    include: { employee: true },
    orderBy: { totalAmount: "desc" },
    take: 10,
  });
  return records.map((r) => ({
    name: `${r.employee.lastName} ${r.employee.firstName}`,
    total: Number(r.totalAmount),
  }));
}

export async function getDashboardSummary() {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  const periodKey = monthlyPeriodKey(new Date());
  const { start, end } = periodDateRange("MONTHLY", periodKey);

  const [salesAgg, commissionAgg, teamSize] = await Promise.all([
    prisma.salesRecord.aggregate({
      where: { saleDate: { gte: start, lt: end }, ...(ids ? { employeeId: { in: ids } } : {}) },
      _sum: { amount: true },
    }),
    prisma.commissionCalculation.aggregate({
      where: { periodType: "MONTHLY", periodKey, ...(ids ? { employeeId: { in: ids } } : {}) },
      _sum: { totalAmount: true },
    }),
    ids ? ids.length : prisma.employee.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    periodKey,
    salesTotal: Number(salesAgg._sum.amount ?? 0),
    commissionTotal: Number(commissionAgg._sum.totalAmount ?? 0),
    teamSize: typeof teamSize === "number" ? teamSize : 0,
  };
}
