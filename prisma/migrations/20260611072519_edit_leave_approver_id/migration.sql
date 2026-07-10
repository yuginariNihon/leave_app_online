/*
  Warnings:

  - A unique constraint covering the columns `[leave_id,approval_level]` on the table `LeaveApproval` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "LeaveApproval_leave_id_approver_id_key";

-- AlterTable
ALTER TABLE "LeaveApproval" ALTER COLUMN "approver_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApproval_leave_id_approval_level_key" ON "LeaveApproval"("leave_id", "approval_level");
