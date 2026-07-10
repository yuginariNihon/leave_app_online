-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255),
    "password_hash" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "login_history_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "login_method" VARCHAR(20) NOT NULL,
    "is_success" BOOLEAN NOT NULL DEFAULT true,
    "login_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(50),

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("login_history_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LoginHistory_user_id_idx" ON "LoginHistory"("user_id");

-- AddForeignKey
ALTER TABLE "StaffInfo" ADD CONSTRAINT "StaffInfo_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
