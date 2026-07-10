/*
  Warnings:

  - You are about to drop the column `file_type` on the `LeaveAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `is_archived` on the `LeaveAttachment` table. All the data in the column will be lost.
  - You are about to alter the column `file_path` on the `LeaveAttachment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `file_name` on the `LeaveAttachment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "LeaveAttachment" DROP COLUMN "file_type",
DROP COLUMN "is_archived",
ADD COLUMN     "archived_at" TIMESTAMP(6),
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "mime_type" VARCHAR(100),
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "file_path" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "file_name" SET DATA TYPE VARCHAR(255);
