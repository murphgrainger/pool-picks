-- CreateTable
CREATE TABLE "SchemaAlert" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT NOT NULL,
    "alert_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchemaAlert_endpoint_alert_date_key" ON "SchemaAlert"("endpoint", "alert_date");
