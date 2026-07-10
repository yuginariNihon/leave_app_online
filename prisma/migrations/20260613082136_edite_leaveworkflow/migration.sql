/*
  Warnings:

  - You are about to drop the column `leave_type_id` on the `LeaveWorkflow` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[position_id]` on the table `LeaveWorkflow` will be added. If there are existing duplicate values, this will fail.
  - Made the column `position_id` on table `LeaveWorkflow` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "LeaveWorkflow" DROP CONSTRAINT "LeaveWorkflow_leave_type_id_fkey";

-- DropForeignKey
ALTER TABLE "LeaveWorkflow" DROP CONSTRAINT "LeaveWorkflow_position_id_fkey";

-- DropIndex
DROP INDEX "LeaveWorkflow_leave_type_id_position_id_key";

-- AlterTable
ALTER TABLE "LeaveWorkflow" DROP COLUMN "leave_type_id",
ALTER COLUMN "position_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LeaveWorkflow_position_id_key" ON "LeaveWorkflow"("position_id");

-- AddForeignKey
ALTER TABLE "LeaveWorkflow" ADD CONSTRAINT "LeaveWorkflow_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("position_id") ON DELETE CASCADE ON UPDATE CASCADE;
