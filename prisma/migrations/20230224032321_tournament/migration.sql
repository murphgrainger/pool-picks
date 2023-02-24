-- CreateTable
CREATE TABLE "Tournament" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "start_date" DATE,
    "par" INTEGER,
    "cut" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_name_key" ON "Tournament"("name");
