/*
  Warnings:

  - You are about to drop the column `approved_at` on the `LeaveApproval` table. All the data in the column will be lost.
  - You are about to drop the column `supervisor_id` on the `StaffInfo` table. All the data in the column will be lost.
  - You are about to alter the column `max_days` on the `UserLeaveLimit` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `used_days` on the `UserLeaveLimit` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - A unique constraint covering the columns `[leave_id,approval_level,approver_id]` on the table `LeaveApproval` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LeavePeriod" AS ENUM ('full_day', 'morning', 'afternoon');

-- CreateEnum
CREATE TYPE "ApproverType" AS ENUM ('supervisor', 'department_manager', 'hr', 'specific_person');

-- DropForeignKey
ALTER TABLE "StaffInfo" DROP CONSTRAINT "StaffInfo_supervisor_id_fkey";

-- DropIndex
DROP INDEX "LeaveApproval_leave_id_approval_level_key";

-- DropIndex
DROP INDEX "StaffInfo_supervisor_id_idx";

-- AlterTable
ALTER TABLE "DataLeave" ADD COLUMN     "current_approval_level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "leave_period" "LeavePeriod" NOT NULL DEFAULT 'full_day',
ADD COLUMN     "requested_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "LeaveApproval" DROP COLUMN "approved_at",
ADD COLUMN     "acted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "LeaveAttachment" ADD COLUMN     "uploaded_by" UUID;

-- AlterTable
ALTER TABLE "LoginHistory" ADD COLUMN     "device_info" TEXT;

-- AlterTable
ALTER TABLE "StaffInfo" DROP COLUMN "supervisor_id";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "force_change_password" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "UserLeaveLimit" ALTER COLUMN "max_days" SET DEFAULT 0,
ALTER COLUMN "max_days" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "used_days" SET DEFAULT 0,
ALTER COLUMN "used_days" SET DATA TYPE DECIMAL(5,2);

-- CreateTable
CREATE TABLE "StaffSupervisor" (
    "staff_supervisor_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "supervisor_id" UUID NOT NULL,

    CONSTRAINT "StaffSupervisor_pkey" PRIMARY KEY ("staff_supervisor_id")
);

-- CreateTable
CREATE TABLE "LeaveWorkflow" (
    "workflow_id" UUID NOT NULL,
    "leave_type_id" UUID NOT NULL,
    "workflow_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveWorkflow_pkey" PRIMARY KEY ("workflow_id")
);

-- CreateTable
CREATE TABLE "LeaveWorkflowStep" (
    "workflow_step_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "approval_level" INTEGER NOT NULL,
    "approver_type" "ApproverType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeaveWorkflowStep_pkey" PRIMARY KEY ("workflow_step_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffSupervisor_staff_id_supervisor_id_key" ON "StaffSupervisor"("staff_id", "supervisor_id");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveWorkflow_leave_type_id_key" ON "LeaveWorkflow"("leave_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveWorkflowStep_workflow_id_approval_level_key" ON "LeaveWorkflowStep"("workflow_id", "approval_level");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApproval_leave_id_approval_level_approver_id_key" ON "LeaveApproval"("leave_id", "approval_level", "approver_id");

-- AddForeignKey
ALTER TABLE "StaffSupervisor" ADD CONSTRAINT "StaffSupervisor_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "StaffInfo"("staff_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSupervisor" ADD CONSTRAINT "StaffSupervisor_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "StaffInfo"("staff_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveWorkflow" ADD CONSTRAINT "LeaveWorkflow_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "LeaveType"("leave_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveWorkflowStep" ADD CONSTRAINT "LeaveWorkflowStep_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "LeaveWorkflow"("workflow_id") ON DELETE RESTRICT ON UPDATE CASCADE;
