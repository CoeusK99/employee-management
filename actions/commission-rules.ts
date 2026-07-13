"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/authorization";
import {
  commissionRuleFormSchema,
  validateConfigForType,
} from "@/lib/validation/commission-rule";
import type { RuleType } from "@/app/generated/prisma/enums";

export async function listCommissionRules() {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);
  return prisma.commissionRule.findMany({ orderBy: [{ type: "asc" }, { createdAt: "desc" }] });
}

export async function getCommissionRule(id: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);
  return prisma.commissionRule.findUniqueOrThrow({ where: { id } });
}

export async function createCommissionRule(input: unknown) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);
  const data = commissionRuleFormSchema.parse(input);
  const config = validateConfigForType(data.type, data.config);

  await prisma.$transaction(async (tx) => {
    if (data.active) {
      await tx.commissionRule.updateMany({
        where: { type: data.type as RuleType, active: true },
        data: { active: false },
      });
    }
    await tx.commissionRule.create({
      data: {
        name: data.name,
        type: data.type as RuleType,
        active: data.active,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        config,
      },
    });
  });
  revalidatePath("/commission-rules");
}

export async function updateCommissionRule(id: string, input: unknown) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);
  const data = commissionRuleFormSchema.parse(input);
  const config = validateConfigForType(data.type, data.config);

  await prisma.$transaction(async (tx) => {
    if (data.active) {
      await tx.commissionRule.updateMany({
        where: { type: data.type as RuleType, active: true, id: { not: id } },
        data: { active: false },
      });
    }
    await tx.commissionRule.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type as RuleType,
        active: data.active,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        config,
      },
    });
  });
  revalidatePath("/commission-rules");
  revalidatePath(`/commission-rules/${id}`);
}

export async function deleteCommissionRule(id: string) {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);
  await prisma.commissionRule.delete({ where: { id } });
  revalidatePath("/commission-rules");
}
