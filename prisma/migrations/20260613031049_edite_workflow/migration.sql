/*
  Warnings:

  - A unique constraint covering the columns `[leave_type_id,position_id]` on the table `LeaveWorkflow` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ApproverType" ADD VALUE 'supervisor_or_manager';

-- DropIndex
DROP INDEX "LeaveWorkflow_leave_type_id_key";

-- AlterTable
ALTER TABLE "LeaveWorkflow" ADD COLUMN     "position_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "LeaveWorkflow_leave_type_id_position_id_key" ON "LeaveWorkflow"("leave_type_id", "position_id");
