-- CreateEnum
CREATE TYPE "SetupRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO');

-- CreateTable
CREATE TABLE "item_setup_requests" (
    "id" TEXT NOT NULL,
    "distributor_id" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "rwlv_description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "vendor" TEXT NOT NULL DEFAULT '',
    "vendor_product_num" TEXT NOT NULL DEFAULT '',
    "vendor_description" TEXT NOT NULL DEFAULT '',
    "vendor_pack" TEXT NOT NULL DEFAULT '',
    "mfg" TEXT NOT NULL DEFAULT '',
    "mfg_num" TEXT NOT NULL DEFAULT '',
    "storage_type" TEXT NOT NULL DEFAULT 'Shelf-stable',
    "case_splittable" TEXT NOT NULL DEFAULT 'Yes',
    "stocked_status" TEXT NOT NULL DEFAULT 'Stocked',
    "lead_time" TEXT NOT NULL DEFAULT 'Stocked',
    "vendor_cost" TEXT NOT NULL DEFAULT '',
    "can_split_case" TEXT NOT NULL DEFAULT 'Yes',
    "order_by" TEXT NOT NULL DEFAULT 'case',
    "price_by" TEXT NOT NULL DEFAULT 'case',
    "status" "SetupRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "review_note" TEXT,
    "approved_product_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_setup_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "item_setup_requests" ADD CONSTRAINT "item_setup_requests_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "distributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_setup_requests" ADD CONSTRAINT "item_setup_requests_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_setup_requests" ADD CONSTRAINT "item_setup_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
