-- CreateTable
CREATE TABLE "PoolInvite" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Invited',
    "pool_id" INTEGER NOT NULL,

    CONSTRAINT "PoolInvite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PoolInvite" ADD CONSTRAINT "PoolInvite_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "Pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
