-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "default_role_id" UUID;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_default_role_id_fkey" FOREIGN KEY ("default_role_id") REFERENCES "Role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;
