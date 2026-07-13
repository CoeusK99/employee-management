"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole, scopeEmployeeIds, UnauthorizedError } from "@/lib/authorization";
import {
  applyKpiThresholds,
  applyPercentageTiers,
  overridePercentForLevel,
  type KpiThreshold,
  type OverrideLevel,
  type PercentageTier,
} from "@/lib/commission-engine";
import { periodDateRange } from "@/lib/period";
import type { PeriodType } from "@/app/generated/prisma/enums";

export async function listCommissionCalculations(periodType: PeriodType, periodKey: string) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  return prisma.commissionCalculation.findMany({
    where: {
      periodType,
      periodKey,
      ...(ids ? { employeeId: { in: ids } } : {}),
    },
    include: { employee: true },
    orderBy: { totalAmount: "desc" },
  });
}

export async function getCommissionCalculation(id: string) {
  const user = await getCurrentUser();
  const ids = await scopeEmployeeIds(user);
  const calc = await prisma.commissionCalculation.findUniqueOrThrow({
    where: { id },
    include: { employee: true },
  });
  if (ids && !ids.includes(calc.employeeId)) {
    throw new UnauthorizedError("無權查看此獎金結算");
  }
  return calc;
}

export async function runCalculation(periodType: PeriodType, periodKey: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);

  const { start, end } = periodDateRange(periodType, periodKey);

  const [percentageRule, kpiRule, overrideRule] = await Promise.all([
    prisma.commissionRule.findFirst({
      where: {
        type: "PERCENTAGE_TIER",
        active: true,
        effectiveFrom: { lt: end },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
      },
    }),
    prisma.commissionRule.findFirst({
      where: {
        type: "KPI_BONUS",
        active: true,
        effectiveFrom: { lt: end },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
      },
    }),
    prisma.commissionRule.findFirst({
      where: {
        type: "OVERRIDE",
        active: true,
        effectiveFrom: { lt: end },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
      },
    }),
  ]);

  const tiers = ((percentageRule?.config as { tiers?: PercentageTier[] } | undefined)?.tiers ?? []);
  const thresholds = ((kpiRule?.config as { thresholds?: KpiThreshold[] } | undefined)?.thresholds ?? []);
  const levels = ((overrideRule?.config as { levels?: OverrideLevel[] } | undefined)?.levels ?? []);

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, managerId: true, firstName: true, lastName: true },
  });

  const salesAgg = await prisma.salesRecord.groupBy({
    by: ["employeeId"],
    where: { saleDate: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const salesByEmployee = new Map(salesAgg.map((s) => [s.employeeId, Number(s._sum.amount ?? 0)]));

  const targets = await prisma.target.findMany({ where: { periodType, periodKey } });
  const targetByEmployee = new Map(targets.map((t) => [t.employeeId, Number(t.quotaAmount)]));

  type Breakdown = {
    salesTotal: number;
    target: number | null;
    achievementPct: number | null;
    overrideSources: {
      subordinateId: string;
      subordinateName: string;
      level: number;
      subordinateOwnCommission: number;
      percent: number;
      amount: number;
    }[];
  };
  type Rec = { base: number; kpi: number; own: number; overrideAmount: number; breakdown: Breakdown };

  const records = new Map<string, Rec>();

  for (const emp of employees) {
    const salesTotal = salesByEmployee.get(emp.id) ?? 0;
    const base = applyPercentageTiers(salesTotal, tiers);
    const quota = targetByEmployee.get(emp.id) ?? null;
    let achievementPct: number | null = null;
    let kpi = 0;
    if (quota && quota > 0) {
      achievementPct = (salesTotal / quota) * 100;
      kpi = applyKpiThresholds(achievementPct, thresholds);
    }
    records.set(emp.id, {
      base,
      kpi,
      own: base + kpi,
      overrideAmount: 0,
      breakdown: { salesTotal, target: quota, achievementPct, overrideSources: [] },
    });
  }

  const childrenByManager = new Map<string, typeof employees>();
  for (const emp of employees) {
    if (!emp.managerId) continue;
    const list = childrenByManager.get(emp.managerId) ?? [];
    list.push(emp);
    childrenByManager.set(emp.managerId, list);
  }

  for (const emp of employees) {
    const rec = records.get(emp.id)!;
    let frontier = childrenByManager.get(emp.id) ?? [];
    let level = 1;
    while (frontier.length > 0 && level <= 10) {
      const percent = overridePercentForLevel(level, levels);
      if (percent == null) break;
      for (const sub of frontier) {
        const subRec = records.get(sub.id);
        if (!subRec) continue;
        const amount = subRec.own * percent;
        rec.overrideAmount += amount;
        rec.breakdown.overrideSources.push({
          subordinateId: sub.id,
          subordinateName: `${sub.lastName} ${sub.firstName}`,
          level,
          subordinateOwnCommission: subRec.own,
          percent,
          amount,
        });
      }
      const next: typeof employees = [];
      for (const sub of frontier) next.push(...(childrenByManager.get(sub.id) ?? []));
      frontier = next;
      level += 1;
    }
  }

  const existing = await prisma.commissionCalculation.findMany({
    where: { periodType, periodKey },
    select: { employeeId: true, status: true },
  });
  const finalizedIds = new Set(existing.filter((e) => e.status === "FINALIZED").map((e) => e.employeeId));

  let calculated = 0;
  let skipped = 0;
  let totalPayout = 0;

  for (const [employeeId, rec] of records) {
    if (finalizedIds.has(employeeId)) {
      skipped += 1;
      continue;
    }
    const total = rec.base + rec.kpi + rec.overrideAmount;
    await prisma.commissionCalculation.upsert({
      where: { employeeId_periodType_periodKey: { employeeId, periodType, periodKey } },
      update: {
        baseCommission: rec.base,
        kpiBonus: rec.kpi,
        overrideAmount: rec.overrideAmount,
        totalAmount: total,
        breakdown: rec.breakdown,
        status: "DRAFT",
        calculatedAt: new Date(),
      },
      create: {
        employeeId,
        periodType,
        periodKey,
        baseCommission: rec.base,
        kpiBonus: rec.kpi,
        overrideAmount: rec.overrideAmount,
        totalAmount: total,
        breakdown: rec.breakdown,
        status: "DRAFT",
      },
    });
    calculated += 1;
    totalPayout += total;
  }

  revalidatePath("/commissions");
  return { calculated, skipped, totalPayout };
}

export async function finalizeCommissions(periodType: PeriodType, periodKey: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);

  const result = await prisma.commissionCalculation.updateMany({
    where: { periodType, periodKey, status: "DRAFT" },
    data: { status: "FINALIZED", finalizedAt: new Date(), finalizedBy: user.id },
  });

  revalidatePath("/commissions");
  return { finalized: result.count };
}

export async function reopenCommissions(periodType: PeriodType, periodKey: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);

  const result = await prisma.commissionCalculation.updateMany({
    where: { periodType, periodKey, status: "FINALIZED" },
    data: { status: "DRAFT", finalizedAt: null, finalizedBy: null },
  });

  revalidatePath("/commissions");
  return { reopened: result.count };
}
