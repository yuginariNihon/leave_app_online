/*
  Warnings:

  - Added the required column `department_id` to the `StaffInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StaffInfo" ADD COLUMN     "department_id" UUID NOT NULL,
ADD COLUMN     "employment_type_id" UUID;

-- CreateTable
CREATE TABLE "EmploymentType" (
    "employment_type_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentType_pkey" PRIMARY KEY ("employment_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentType_code_key" ON "EmploymentType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentType_name_key" ON "EmploymentType"("name");

-- CreateIndex
CREATE INDEX "EmploymentType_code_idx" ON "EmploymentType"("code");

-- AddForeignKey
ALTER TABLE "StaffInfo" ADD CONSTRAINT "StaffInfo_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInfo" ADD CONSTRAINT "StaffInfo_employment_type_id_fkey" FOREIGN KEY ("employment_type_id") REFERENCES "EmploymentType"("employment_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
