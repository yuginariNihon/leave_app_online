-- CreateEnum
CREATE TYPE "LeaveMode" AS ENUM ('day', 'hour');

-- AlterTable
ALTER TABLE "DataLeave" ADD COLUMN     "end_time" TIME(6),
ADD COLUMN     "hours" DECIMAL(5,2),
ADD COLUMN     "leave_mode" "LeaveMode" NOT NULL DEFAULT 'day',
ADD COLUMN     "start_time" TIME(6);
