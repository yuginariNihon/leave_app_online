/*
  Warnings:

  - The values [supervisor,department_manager,hr,supervisor_or_manager] on the enum `ApproverType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApproverType_new" AS ENUM ('Supervisor_or_Senior_Supervisor_or_Manager', 'Department_Manager', 'HR', 'specific_person');
ALTER TABLE "LeaveWorkflowStep" ALTER COLUMN "approver_type" TYPE "ApproverType_new" USING ("approver_type"::text::"ApproverType_new");
ALTER TYPE "ApproverType" RENAME TO "ApproverType_old";
ALTER TYPE "ApproverType_new" RENAME TO "ApproverType";
DROP TYPE "public"."ApproverType_old";
COMMIT;
