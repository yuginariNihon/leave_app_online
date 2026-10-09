/*
  Warnings:

  - A unique constraint covering the columns `[leave_no]` on the table `DataLeave` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DataLeave" ADD COLUMN     "leave_no" VARCHAR(20);

-- CreateTable
CREATE TABLE "LeaveCounter" (
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeaveCounter_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataLeave_leave_no_key" ON "DataLeave"("leave_no");
