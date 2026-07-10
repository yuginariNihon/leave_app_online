-- AddForeignKey
ALTER TABLE "LeaveWorkflow" ADD CONSTRAINT "LeaveWorkflow_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("position_id") ON DELETE SET NULL ON UPDATE CASCADE;
