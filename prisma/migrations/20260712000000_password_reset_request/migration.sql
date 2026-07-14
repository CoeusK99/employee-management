-- CreateEnum
CREATE TYPE "ResetRequestStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateTable
CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "ResetRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetRequest_status_createdAt_idx" ON "PasswordResetRequest"("status", "createdAt");

