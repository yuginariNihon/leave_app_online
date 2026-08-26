-- CreateIndex
CREATE INDEX "LoginHistory_user_id_is_success_login_at_idx" ON "LoginHistory"("user_id", "is_success", "login_at");
