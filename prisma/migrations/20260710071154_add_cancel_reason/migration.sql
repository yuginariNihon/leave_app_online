-- AlterTable
ALTER TABLE "DataLeave" ADD COLUMN     "cancel_reason" VARCHAR(500);

-- CreateTable
CREATE TABLE "Holiday" (
    "holiday_id" UUID NOT NULL,
    "holiday_name" VARCHAR(200) NOT NULL,
    "holiday_date" DATE NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("holiday_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_holiday_date_holiday_name_key" ON "Holiday"("holiday_date", "holiday_name");
