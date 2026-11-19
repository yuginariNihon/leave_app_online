import z from "zod";

// ────────────────────────────────────
// Workflow Step Schemas
// ────────────────────────────────────

export const updateWorkflowStepSchema = z.object({
  approverType: z.enum([
    "Supervisor",
    "Senior_Supervisor",
    "Supervisor_or_Senior_Supervisor",
    "Assistant_Manager",
    "Department_Manager",
    "General_Manager",
    "Director",
    "HR",
    "Specific_Person",
  ]),
  isRequired: z.boolean().default(true),
});

export type UpdateWorkflowStepValues = z.infer<typeof updateWorkflowStepSchema>;

export const updateWorkflowStepsSchema = z.object({
  steps: z.array(updateWorkflowStepSchema).min(1, "ต้องมีอย่างน้อย 1 ขั้นตอน"),
});

export type UpdateWorkflowStepsValues = z.infer<typeof updateWorkflowStepsSchema>;

export const createWorkflowStepSchema = z.object({
  approverType: z.enum([
    "Supervisor",
    "Senior_Supervisor",
    "Supervisor_or_Senior_Supervisor",
    "Assistant_Manager",
    "Department_Manager",
    "General_Manager",
    "Director",
    "HR",
    "Specific_Person",
  ]),
  isRequired: z.boolean().default(true),
});

export type CreateWorkflowStepValues = z.infer<typeof createWorkflowStepSchema>;

export const createWorkflowSchema = z.object({
  positionId: z.string().uuid("กรุณาเลือกตำแหน่ง"),
  steps: z.array(createWorkflowStepSchema).min(1, "ต้องมีอย่างน้อย 1 ขั้นตอน"),
});

export type CreateWorkflowValues = z.infer<typeof createWorkflowSchema>;
