/*
  Warnings:

  - You are about to drop the column `sport` on the `Athlete` table. All the data in the column will be lost.
  - The `amount_sum` column on the `Pool` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `cut` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `par` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `sport` on the `Tournament` table. All the data in the column will be lost.
  - Changed the type of `amount_entry` on the `Pool` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `city` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_date` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Made the column `start_date` on table `Tournament` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Athlete" DROP COLUMN "sport";

-- AlterTable
ALTER TABLE "Pool" DROP COLUMN "amount_entry",
ADD COLUMN     "amount_entry" INTEGER NOT NULL,
DROP COLUMN "amount_sum",
ADD COLUMN     "amount_sum" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "cut",
DROP COLUMN "par",
DROP COLUMN "sport",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "course" TEXT NOT NULL,
ADD COLUMN     "end_date" DATE NOT NULL,
ADD COLUMN     "region" TEXT NOT NULL,
ALTER COLUMN "start_date" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Scheduled';
