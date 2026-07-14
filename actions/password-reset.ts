"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/authorization";

const requestSchema = z.object({
  email: z.string().email("email 格式錯誤"),
});

/**
 * Public action (no auth) — called from the forgot-password page.
 * Always succeeds from the caller's perspective so it never reveals
 * whether an email exists in the system.
 */
export async function requestPasswordReset(input: unknown) {
  const { email } = requestSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const existingPending = await prisma.passwordResetRequest.findFirst({
      where: { email, status: "PENDING" },
    });
    if (!existingPending) {
      await prisma.passwordResetRequest.create({ data: { email } });
    }
  }
  return { ok: true };
}

export async function listResetRequests() {
  const user = await getCurrentUser();
  requireRole(user, ["ADMIN"]);
  return prisma.passwordResetRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
}

const resetSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8, "密碼至少 8 碼"),
});

export async function resetUserPassword(input: unknown) {
  const admin = await getCurrentUser();
  requireRole(admin, ["ADMIN"]);
  const { email, newPassword } = resetSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("查無此帳號");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetRequest.updateMany({
      where: { email, status: "PENDING" },
      data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy: admin.id },
    }),
  ]);

  revalidatePath("/password-resets");
}

export async function dismissResetRequest(id: string) {
  const admin = await getCurrentUser();
  requireRole(admin, ["ADMIN"]);
  await prisma.passwordResetRequest.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy: admin.id },
  });
  revalidatePath("/password-resets");
}
