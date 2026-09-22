import { prisma } from "@/lib/prisma";
import type { ApproverType } from "@/lib/generated/prisma/enums";
import { APPROVER_TYPE_LABELS } from "@/lib/services/approverUtils";
import { ConflictError, NotFoundError } from "@/lib/errors";

// ──────────────────────────────────────────────
// Workflow Display (HR)
// ──────────────────────────────────────────────

export type WorkflowStepDisplay = {
  level: number;
  approverType: string;
  approverLabel: string;
  isRequired: boolean;
};

export type WorkflowDisplayItem = {
  workflowId: string;
  positionName: string;
  positionLevel: number | null;
  isActive: boolean;
  steps: WorkflowStepDisplay[];
};

export async function getWorkflows(): Promise<WorkflowDisplayItem[]> {
  const workflows = await prisma.leaveWorkflow.findMany({
    include: {
      position: { select: { position_name: true, position_level: true } },
      steps: { select: { approval_level: true, approver_type: true, is_required: true }, orderBy: { approval_level: "asc" } },
    },
    orderBy: { position: { position_level: "asc" } },
  });

  return workflows.map((wf) => ({
    workflowId: wf.workflow_id,
    positionName: wf.position.position_name,
    positionLevel: wf.position.position_level,
    isActive: wf.is_active,
    steps: wf.steps.map((step) => ({
      level: step.approval_level,
      approverType: step.approver_type,
      approverLabel: APPROVER_TYPE_LABELS[step.approver_type] ?? step.approver_type,
      isRequired: step.is_required,
    })),
  }));
}

// ──────────────────────────────────────────────
// Workflow Edit (HR)
// ──────────────────────────────────────────────

export type WorkflowDetailItem = {
  workflowId: string;
  positionName: string;
  positionLevel: number | null;
  isActive: boolean;
  workflowName: string;
  steps: {
    workflowStepId: string;
    level: number;
    approverType: string;
    approverLabel: string;
    isRequired: boolean;
  }[];
};

export async function getWorkflowById(
  id: string
): Promise<WorkflowDetailItem | null> {
  const workflow = await prisma.leaveWorkflow.findUnique({
    where: { workflow_id: id },
    include: {
      position: { select: { position_name: true, position_level: true } },
      steps: { select: { workflow_step_id: true, approval_level: true, approver_type: true, is_required: true }, orderBy: { approval_level: "asc" } },
    },
  });

  if (!workflow) return null;

  return {
    workflowId: workflow.workflow_id,
    positionName: workflow.position.position_name,
    positionLevel: workflow.position.position_level,
    isActive: workflow.is_active,
    workflowName: workflow.workflow_name,
    steps: workflow.steps.map((step) => ({
      workflowStepId: step.workflow_step_id,
      level: step.approval_level,
      approverType: step.approver_type,
      approverLabel: APPROVER_TYPE_LABELS[step.approver_type] ?? step.approver_type,
      isRequired: step.is_required,
    })),
  };
}

export async function updateWorkflowSteps(
  id: string,
  steps: { approverType: ApproverType; isRequired: boolean }[]
) {
  return prisma.$transaction(async (tx) => {
    await tx.leaveWorkflowStep.deleteMany({
      where: { workflow_id: id },
    });

    const created = await Promise.all(
      steps.map((step, index) =>
        tx.leaveWorkflowStep.create({
          data: {
            workflow_id: id,
            approval_level: index + 1,
            approver_type: step.approverType,
            is_required: step.isRequired,
          },
        })
      )
    );

    return created;
  });
}

// ──────────────────────────────────────────────
// Workflow Create (HR)
// ──────────────────────────────────────────────

export type AvailablePositionItem = {
  positionId: string;
  positionName: string;
  positionLevel: number | null;
};

export async function getAvailableWorkflowPositions(): Promise<AvailablePositionItem[]> {
  const positions = await prisma.position.findMany({
    where: { workflow: null, is_active: true },
    select: { position_id: true, position_name: true, position_level: true },
    orderBy: { position_level: "asc" },
  });

  return positions.map((p) => ({
    positionId: p.position_id,
    positionName: p.position_name,
    positionLevel: p.position_level,
  }));
}

export async function createWorkflow(
  data: { positionId: string; steps: { approverType: ApproverType; isRequired: boolean }[] }
) {
  const existing = await prisma.leaveWorkflow.findUnique({
    where: { position_id: data.positionId },
    select: { workflow_id: true },
  });
  if (existing) {
    throw new ConflictError("ตำแหน่งนี้มีลำดับการอนุมัติแล้ว");
  }

  const position = await prisma.position.findUnique({
    where: { position_id: data.positionId },
    select: { position_name: true },
  });
  if (!position) {
    throw new NotFoundError("ไม่พบตำแหน่ง");
  }

  return prisma.$transaction(async (tx) => {
    const workflow = await tx.leaveWorkflow.create({
      data: {
        position_id: data.positionId,
        workflow_name: `Workflow - ${position.position_name}`,
        is_active: true,
      },
    });

    const steps = await Promise.all(
      data.steps.map((step, index) =>
        tx.leaveWorkflowStep.create({
          data: {
            workflow_id: workflow.workflow_id,
            approval_level: index + 1,
            approver_type: step.approverType,
            is_required: step.isRequired,
          },
        })
      )
    );

    return { workflowId: workflow.workflow_id, steps };
  });
}
