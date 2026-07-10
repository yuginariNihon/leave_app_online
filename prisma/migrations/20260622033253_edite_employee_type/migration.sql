/*
  Warnings:

  - A unique constraint covering the columns `[thainame]` on the table `EmploymentType` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "EmploymentType" ADD COLUMN     "thainame" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentType_thainame_key" ON "EmploymentType"("thainame");
