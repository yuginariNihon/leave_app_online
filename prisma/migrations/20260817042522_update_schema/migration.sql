-- CreateIndex
CREATE INDEX "DataLeave_created_at_idx" ON "DataLeave"("created_at");

-- CreateIndex
CREATE INDEX "DataLeave_created_at_leave_status_idx" ON "DataLeave"("created_at", "leave_status");
