-- AlterTable
ALTER TABLE "AthletesInTournaments" ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "thru" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "cut_line" INTEGER;

-- CreateTable
CREATE TABLE "BetaList" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "BetaList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaList_email_key" ON "BetaList"("email");
