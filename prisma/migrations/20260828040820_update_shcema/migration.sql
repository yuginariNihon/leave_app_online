-- CreateIndex
CREATE INDEX "Holiday_holiday_date_idx" ON "Holiday"("holiday_date");

-- CreateIndex
CREATE INDEX "UserLeaveLimit_year_leave_type_id_idx" ON "UserLeaveLimit"("year", "leave_type_id");
