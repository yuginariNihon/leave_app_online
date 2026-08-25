-- CreateIndex
CREATE INDEX "DataLeave_updated_at_idx" ON "DataLeave"("updated_at");

-- CreateIndex
CREATE INDEX "DataLeave_leave_status_updated_at_idx" ON "DataLeave"("leave_status", "updated_at");

-- CreateIndex
CREATE INDEX "StaffInfo_department_id_idx" ON "StaffInfo"("department_id");
