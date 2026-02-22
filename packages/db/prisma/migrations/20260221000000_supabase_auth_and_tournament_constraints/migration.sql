-- Migration: Supabase Auth + Tournament constraint changes
-- This migration captures all schema changes applied via `db push` since the
-- last tracked migration (20230404201328_username).
--
-- Changes:
-- 1. Drop NextAuth tables (Account, Session, VerificationToken, BetaList)
-- 2. Remove legacy User columns (name, emailVerified, image, createdAt, updatedAt, role)
-- 3. Add Supabase Auth columns to User (created_at, updated_at, is_admin, nickname)
-- 4. Make User.email NOT NULL again
-- 5. Add PoolRole enum and role column on PoolMember
-- 6. Remove unique constraint on Tournament.name
-- 7. Add unique constraint on Tournament.external_id

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "VerificationToken";
DROP TABLE IF EXISTS "BetaList";

-- Remove legacy NextAuth columns from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";
ALTER TABLE "User" DROP COLUMN IF EXISTS "image";
ALTER TABLE "User" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";

-- Add Supabase Auth columns to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT;

-- Make email NOT NULL
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- Add unique constraint on nickname
CREATE UNIQUE INDEX IF NOT EXISTS "User_nickname_key" ON "User"("nickname");

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PoolRole" AS ENUM ('COMMISSIONER', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to PoolMember
ALTER TABLE "PoolMember" ADD COLUMN IF NOT EXISTS "role" "PoolRole" NOT NULL DEFAULT 'MEMBER';

-- Remove unique constraint on Tournament.name
DROP INDEX IF EXISTS "Tournament_name_key";

-- Add unique constraint on Tournament.external_id
CREATE UNIQUE INDEX IF NOT EXISTS "Tournament_external_id_key" ON "Tournament"("external_id");
