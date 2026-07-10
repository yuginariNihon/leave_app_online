/*
  Warnings:

  - The values [Supervisor_or_Manager] on the enum `ApproverType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApproverType_new" AS ENUM ('Supervisor', 'Senior_Supervisor', 'Supervisor_or_Senior_Supervisor', 'Department_Manager', 'General_Manager', 'Director', 'HR', 'Specific_Person');
ALTER TABLE "LeaveWorkflowStep" ALTER COLUMN "approver_type" TYPE "ApproverType_new" USING ("approver_type"::text::"ApproverType_new");
ALTER TYPE "ApproverType" RENAME TO "ApproverType_old";
ALTER TYPE "ApproverType_new" RENAME TO "ApproverType";
DROP TYPE "public"."ApproverType_old";
COMMIT;
