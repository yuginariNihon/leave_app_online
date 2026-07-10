-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('active', 'inactive', 'probation', 'terminated');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "Department" (
    "department_id" UUID NOT NULL,
    "department_code" VARCHAR(20) NOT NULL,
    "department_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "Section" (
    "section_id" UUID NOT NULL,
    "section_code" VARCHAR(20) NOT NULL,
    "section_name" VARCHAR(100) NOT NULL,
    "department_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("section_id")
);

-- CreateTable
CREATE TABLE "Position" (
    "position_id" UUID NOT NULL,
    "position_name" VARCHAR(100) NOT NULL,
    "position_level" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("position_id")
);

-- CreateTable
CREATE TABLE "Role" (
    "role_id" UUID NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "leave_type_id" UUID NOT NULL,
    "leave_type_name" VARCHAR(100) NOT NULL,
    "max_days_per_year" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "requires_attachment" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("leave_type_id")
);

-- CreateTable
CREATE TABLE "LeaveCase" (
    "leave_case_id" UUID NOT NULL,
    "leave_type_id" UUID NOT NULL,
    "case_name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveCase_pkey" PRIMARY KEY ("leave_case_id")
);

-- CreateTable
CREATE TABLE "StaffInfo" (
    "staff_id" UUID NOT NULL,
    "auth_user_id" UUID,
    "staff_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "Date_Of_Birth" DATE,
    "position_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "supervisor_id" UUID,
    "start_date" DATE,
    "employment_type" VARCHAR(50),
    "employment_status" "EmploymentStatus" NOT NULL DEFAULT 'active',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "terminated_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInfo_pkey" PRIMARY KEY ("staff_id")
);

-- CreateTable
CREATE TABLE "StaffRole" (
    "staff_role_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "StaffRole_pkey" PRIMARY KEY ("staff_role_id")
);

-- CreateTable
CREATE TABLE "DataLeave" (
    "leave_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "leave_type_id" UUID NOT NULL,
    "leave_case_id" UUID NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "total_days" DECIMAL(5,2),
    "reason" VARCHAR(500),
    "leave_status" "LeaveStatus" NOT NULL DEFAULT 'pending',
    "cancelled_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataLeave_pkey" PRIMARY KEY ("leave_id")
);

-- CreateTable
CREATE TABLE "LeaveApproval" (
    "approval_id" UUID NOT NULL,
    "leave_id" UUID NOT NULL,
    "approver_id" UUID NOT NULL,
    "approval_level" INTEGER NOT NULL,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "approval_comment" VARCHAR(200),
    "approved_at" TIMESTAMP(6),

    CONSTRAINT "LeaveApproval_pkey" PRIMARY KEY ("approval_id")
);

-- CreateTable
CREATE TABLE "LeaveAttachment" (
    "attachment_id" UUID NOT NULL,
    "leave_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" VARCHAR(20),
    "uploaded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeaveAttachment_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "UserLeaveLimit" (
    "limit_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "leave_type_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "max_days" INTEGER NOT NULL DEFAULT 0,
    "used_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLeaveLimit_pkey" PRIMARY KEY ("limit_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_department_code_key" ON "Department"("department_code");

-- CreateIndex
CREATE UNIQUE INDEX "Section_section_code_key" ON "Section"("section_code");

-- CreateIndex
CREATE INDEX "Section_department_id_idx" ON "Section"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "Position_position_name_key" ON "Position"("position_name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_name_key" ON "Role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_leave_type_name_key" ON "LeaveType"("leave_type_name");

-- CreateIndex
CREATE INDEX "LeaveCase_leave_type_id_idx" ON "LeaveCase"("leave_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveCase_leave_type_id_case_name_key" ON "LeaveCase"("leave_type_id", "case_name");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInfo_auth_user_id_key" ON "StaffInfo"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInfo_staff_code_key" ON "StaffInfo"("staff_code");

-- CreateIndex
CREATE INDEX "StaffInfo_position_id_idx" ON "StaffInfo"("position_id");

-- CreateIndex
CREATE INDEX "StaffInfo_section_id_idx" ON "StaffInfo"("section_id");

-- CreateIndex
CREATE INDEX "StaffInfo_supervisor_id_idx" ON "StaffInfo"("supervisor_id");

-- CreateIndex
CREATE INDEX "StaffInfo_employment_status_idx" ON "StaffInfo"("employment_status");

-- CreateIndex
CREATE INDEX "StaffRole_role_id_idx" ON "StaffRole"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "StaffRole_staff_id_role_id_key" ON "StaffRole"("staff_id", "role_id");

-- CreateIndex
CREATE INDEX "DataLeave_staff_id_idx" ON "DataLeave"("staff_id");

-- CreateIndex
CREATE INDEX "DataLeave_leave_type_id_idx" ON "DataLeave"("leave_type_id");

-- CreateIndex
CREATE INDEX "DataLeave_leave_case_id_idx" ON "DataLeave"("leave_case_id");

-- CreateIndex
CREATE INDEX "DataLeave_leave_status_idx" ON "DataLeave"("leave_status");

-- CreateIndex
CREATE INDEX "DataLeave_start_date_end_date_idx" ON "DataLeave"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "LeaveApproval_approver_id_idx" ON "LeaveApproval"("approver_id");

-- CreateIndex
CREATE INDEX "LeaveApproval_approval_status_idx" ON "LeaveApproval"("approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApproval_leave_id_approver_id_key" ON "LeaveApproval"("leave_id", "approver_id");

-- CreateIndex
CREATE INDEX "LeaveAttachment_leave_id_idx" ON "LeaveAttachment"("leave_id");

-- CreateIndex
CREATE INDEX "UserLeaveLimit_leave_type_id_idx" ON "UserLeaveLimit"("leave_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserLeaveLimit_staff_id_leave_type_id_year_key" ON "UserLeaveLimit"("staff_id", "leave_type_id", "year");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveCase" ADD CONSTRAINT "LeaveCase_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "LeaveType"("leave_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInfo" ADD CONSTRAINT "StaffInfo_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("position_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInfo" ADD CONSTRAINT "StaffInfo_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("section_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInfo" ADD CONSTRAINT "StaffInfo_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "StaffInfo"("staff_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRole" ADD CONSTRAINT "StaffRole_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "StaffInfo"("staff_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRole" ADD CONSTRAINT "StaffRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLeave" ADD CONSTRAINT "DataLeave_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "StaffInfo"("staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLeave" ADD CONSTRAINT "DataLeave_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "LeaveType"("leave_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLeave" ADD CONSTRAINT "DataLeave_leave_case_id_fkey" FOREIGN KEY ("leave_case_id") REFERENCES "LeaveCase"("leave_case_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApproval" ADD CONSTRAINT "LeaveApproval_leave_id_fkey" FOREIGN KEY ("leave_id") REFERENCES "DataLeave"("leave_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApproval" ADD CONSTRAINT "LeaveApproval_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "StaffInfo"("staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAttachment" ADD CONSTRAINT "LeaveAttachment_leave_id_fkey" FOREIGN KEY ("leave_id") REFERENCES "DataLeave"("leave_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLeaveLimit" ADD CONSTRAINT "UserLeaveLimit_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "StaffInfo"("staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLeaveLimit" ADD CONSTRAINT "UserLeaveLimit_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "LeaveType"("leave_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
