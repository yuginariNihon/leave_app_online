/*
  Warnings:

  - You are about to drop the column `uploaded_by` on the `LeaveAttachment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[leave_id,approval_level]` on the table `LeaveApproval` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "LeaveApproval_leave_id_approval_level_approver_id_key";

-- AlterTable
ALTER TABLE "LeaveAttachment" DROP COLUMN "uploaded_by";

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApproval_leave_id_approval_level_key" ON "LeaveApproval"("leave_id", "approval_level");
