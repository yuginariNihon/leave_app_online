-- CreateIndex
CREATE INDEX "DataLeave_staff_id_leave_status_idx" ON "DataLeave"("staff_id", "leave_status");

-- CreateIndex
CREATE INDEX "LeaveApproval_approval_status_approver_id_idx" ON "LeaveApproval"("approval_status", "approver_id");

-- CreateIndex
CREATE INDEX "LeaveApproval_approver_id_approval_status_idx" ON "LeaveApproval"("approver_id", "approval_status");

-- CreateIndex
CREATE INDEX "LoginHistory_ip_address_is_success_login_at_idx" ON "LoginHistory"("ip_address", "is_success", "login_at");
