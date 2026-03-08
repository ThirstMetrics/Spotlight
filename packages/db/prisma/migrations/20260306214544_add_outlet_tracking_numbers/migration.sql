-- CreateEnum
CREATE TYPE "TrackingNumberType" AS ENUM ('POS', 'COST_CENTER', 'PURCHASING_SYSTEM', 'GL_CODE', 'INVENTORY_SYSTEM', 'OTHER');

-- CreateTable
CREATE TABLE "outlet_tracking_numbers" (
    "id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "type" "TrackingNumberType" NOT NULL,
    "value" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlet_tracking_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outlet_tracking_numbers_outlet_id_idx" ON "outlet_tracking_numbers"("outlet_id");

-- CreateIndex
CREATE UNIQUE INDEX "outlet_tracking_numbers_outlet_id_type_key" ON "outlet_tracking_numbers"("outlet_id", "type");

-- AddForeignKey
ALTER TABLE "outlet_tracking_numbers" ADD CONSTRAINT "outlet_tracking_numbers_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
