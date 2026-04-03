-- CreateEnum
CREATE TYPE "JoinMode" AS ENUM ('OPEN', 'INVITE_ONLY');

-- Null out any existing invite_code values to avoid unique constraint violations
UPDATE "Pool" SET "invite_code" = NULL WHERE "invite_code" IS NOT NULL;

-- AlterTable
ALTER TABLE "Pool" ADD COLUMN "join_mode" "JoinMode" NOT NULL DEFAULT 'INVITE_ONLY';

-- CreateIndex
CREATE UNIQUE INDEX "Pool_invite_code_key" ON "Pool"("invite_code");
