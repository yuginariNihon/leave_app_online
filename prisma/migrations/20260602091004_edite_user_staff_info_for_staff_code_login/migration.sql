/*
  Warnings:

  - You are about to drop the column `auth_user_id` on the `StaffInfo` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[staff_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supabase_auth_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `staff_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StaffInfo" DROP CONSTRAINT "StaffInfo_auth_user_id_fkey";

-- DropIndex
DROP INDEX "StaffInfo_auth_user_id_key";

-- AlterTable
ALTER TABLE "StaffInfo" DROP COLUMN "auth_user_id";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "staff_id" UUID NOT NULL,
ADD COLUMN     "supabase_auth_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "User_staff_id_key" ON "User"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabase_auth_id_key" ON "User"("supabase_auth_id");

-- CreateIndex
CREATE INDEX "User_staff_id_idx" ON "User"("staff_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "StaffInfo"("staff_id") ON DELETE CASCADE ON UPDATE CASCADE;
