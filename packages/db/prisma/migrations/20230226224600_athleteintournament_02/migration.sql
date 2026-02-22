/*
  Warnings:

  - A unique constraint covering the columns `[full_name]` on the table `Athlete` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AthletesInTournaments" ALTER COLUMN "status" SET DEFAULT 'Active';

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_full_name_key" ON "Athlete"("full_name");
