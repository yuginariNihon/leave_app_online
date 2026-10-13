import { after } from "next/server";
import { LeaveStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail/sendEmail";
import {
  EMAIL_BADGES,
  renderEmail,
  type EmailCta,
  type EmailRow,
} from "@/lib/mail/emailTemplate";
import { getApproverContacts } from "@/lib/services/approverUtils";
import { formatLeaveDateRange, timeFromDb } from "@/lib/utils";

const LEAVE_PERIOD_LABELS: Record<string, string> = {
  full_day: "เต็มวัน",
  morning: "ครึ่งวันเช้า",
  afternoon: "ครึ่งวันบ่าย",
};

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dedupeEmails(contacts: { email: string }[]): string[] {
  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const contact of contacts) {
    const email = contact.email.trim();
    const key = email.toLowerCase();
    if (!email || seen.has(key)) continue;
    seen.add(key);
    recipients.push(email);
  }
  return recipients;
}

/**
 * Registers a mail task to run after the response is sent (`after()`), with a
 * plain fire-and-forget fallback when called outside a request scope. Failures
 * are only logged — mail must never break the leave/approval flow.
 */
function schedule(task: () => Promise<void>): void {
  const run = () =>
    task().catch((error) => {
      console.error("[leaveMailer] ส่งอีเมลไม่สำเร็จ:", error);
    });

  try {
    after(run);
  } catch {
    void run();
  }
}

async function loadLeave(leaveId: string) {
  return prisma.dataLeave.findUnique({
    where: { leave_id: leaveId },
    include: {
      staff: {
        select: {
          staff_id: true,
          staff_code: true,
          name: true,
          department_id: true,
          position_id: true,
          department: { select: { department_name: true } },
          user: { select: { email: true } },
        },
      },
      leaveType: { select: { leave_type_name: true } },
      leaveCase: { select: { case_name: true } },
      approvals: {
        orderBy: { approval_level: "asc" },
        select: { approval_level: true, approval_status: true },
      },
    },
  });
}

type LeaveWithRelations = NonNullable<Awaited<ReturnType<typeof loadLeave>>>;

function row(label: string, value: string): EmailRow {
  return { label, value };
}

function renderSummary(leave: LeaveWithRelations): {
  reference: string;
  rows: EmailRow[];
} {
  const reference =
    leave.leave_no ?? `#LV-${leave.leave_id.slice(0, 8).toUpperCase()}`;

  const dateRange = formatLeaveDateRange(
    leave.start_date ? leave.start_date.toISOString() : null,
    leave.end_date ? leave.end_date.toISOString() : null,
  );

  const periodText =
    leave.leave_mode === "hour" && leave.start_time && leave.end_time
      ? `${timeFromDb(leave.start_time)} – ${timeFromDb(leave.end_time)} น. (${leave.hours ?? "-"} ชม.)`
      : LEAVE_PERIOD_LABELS[leave.leave_period] ?? String(leave.leave_period);

  const rows: EmailRow[] = [
    row("เลขที่ใบลา", `<b>${escapeHtml(reference)}</b>`),
    row(
      "พนักงาน",
      `${escapeHtml(leave.staff.name)} (${escapeHtml(leave.staff.staff_code)})`,
    ),
    row("แผนก", escapeHtml(leave.staff.department.department_name)),
    row(
      "ประเภทการลา",
      `${escapeHtml(leave.leaveType.leave_type_name)} - ${escapeHtml(leave.leaveCase.case_name)}`,
    ),
    row("วันที่", escapeHtml(dateRange)),
    row("ช่วงเวลา", escapeHtml(periodText)),
    row("จำนวน", `${leave.total_days ?? "-"} วัน`),
    row("เหตุผล", escapeHtml(leave.reason)),
  ];

  return { reference, rows };
}

const APPROVER_ACTION_URL = (leaveId: string) =>
  `/dashboard/approval-requests/detail?leaveId=${leaveId}`;
const HR_ACTION_URL = (leaveId: string) =>
  `/dashboard/approval-requests/hr/detail?leaveId=${leaveId}`;
const OWNER_ACTION_URL = (leaveId: string) =>
  `/dashboard/leave-details?leaveId=${leaveId}`;

function buildCta(path: string, label: string): EmailCta | null {
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;
  return { label, url: `${baseUrl}${path}` };
}

/**
 * Picks the action URL based on who receives the email:
 * - HR/SUPER_ADMIN approver step -> the HR action page (approve/reject buttons there).
 * - Position-based approver -> the employee approval detail page.
 */
function approverCta(leaveId: string, approverType: string): EmailCta | null {
  const path =
    approverType === "HR"
      ? HR_ACTION_URL(leaveId)
      : APPROVER_ACTION_URL(leaveId);
  return buildCta(path, "เปิดดูรายการขออนุมัติ");
}

/**
 * New leave request -> first pending approver(s) + HR.
 */
export async function sendLeaveCreatedEmail(leaveId: string): Promise<void> {
  const leave = await loadLeave(leaveId);
  if (!leave) return;

  const firstPending = leave.approvals.find(
    (a) => a.approval_status === "pending",
  );

  // Auto-approved leaves have no human approver to notify.
  if (!firstPending) return;

  const workflow = await prisma.leaveWorkflow.findFirst({
    where: { position_id: leave.staff.position_id, is_active: true },
    include: { steps: { orderBy: { approval_level: "asc" } } },
  });

  const step =
    workflow?.steps.find(
      (s) => s.approval_level === firstPending.approval_level,
    ) ?? workflow?.steps[0];

  if (!step) return;

  const stepContacts = await getApproverContacts(
    leave.staff_id,
    leave.staff.department_id,
    step.approver_type,
  );

  const recipients = dedupeEmails(stepContacts);

  if (recipients.length === 0) {
    console.warn(
      `[leaveMailer] No approver email found for leave ${leaveId}; skipped.`,
    );
    return;
  }

  const { reference, rows } = renderSummary(leave);
  const subject = `[ระบบลา] ใบลาใหม่ ${reference} - ${leave.staff.name}`;
  const body = renderEmail({
    badge: EMAIL_BADGES.pending,
    intro: "มีคำขอลาใหม่รอการอนุมัติ",
    rows,
    cta: approverCta(leave.leave_id, step.approver_type),
    loginCta: buildCta("/login", "เข้าสู่ระบบ"),
  });

  await sendEmail({ to: recipients, subject, body });
}

/**
 * Leave advanced to the next approval step -> the approver(s) of that step.
 */
export async function sendLeaveNextApproverEmail(
  leaveId: string,
): Promise<void> {
  const leave = await loadLeave(leaveId);
  if (!leave) return;
  if (leave.leave_status !== LeaveStatus.pending) return;

  const workflow = await prisma.leaveWorkflow.findFirst({
    where: { position_id: leave.staff.position_id, is_active: true },
    include: { steps: { orderBy: { approval_level: "asc" } } },
  });

  const step =
    workflow?.steps.find(
      (s) => s.approval_level === leave.current_approval_level,
    ) ?? workflow?.steps[0];

  if (!step) return;

  const recipients = dedupeEmails(
    await getApproverContacts(
      leave.staff_id,
      leave.staff.department_id,
      step.approver_type,
    ),
  );

  if (recipients.length === 0) {
    console.warn(
      `[leaveMailer] No approver email for the current step of leave ${leaveId}; skipped.`,
    );
    return;
  }

  const { reference, rows } = renderSummary(leave);
  const subject = `[ระบบลา] ใบลา ${reference} ถึงคิวการอนุมัติของคุณแล้ว`;
  const body = renderEmail({
    badge: EMAIL_BADGES.pending,
    intro: `ใบลาของ ${escapeHtml(leave.staff.name)} ถึงคิวการอนุมัติของคุณแล้ว`,
    rows,
    cta: approverCta(leave.leave_id, step.approver_type),
    loginCta: buildCta("/login", "เข้าสู่ระบบ"),
  });

  await sendEmail({ to: recipients, subject, body });
}

/**
 * Leave fully approved -> the requesting employee.
 */
export async function sendLeaveApprovedEmail(leaveId: string): Promise<void> {
  const leave = await loadLeave(leaveId);
  if (!leave) return;

  const ownerEmail = leave.staff.user?.email?.trim();
  if (!ownerEmail) {
    console.warn(
      `[leaveMailer] Leave owner ${leave.staff_id} has no email; approved mail skipped.`,
    );
    return;
  }

  const { reference, rows } = renderSummary(leave);
  const subject = `[ระบบลา] ใบลาของคุณได้รับอนุมัติแล้ว ${reference}`;
  const body = renderEmail({
    badge: EMAIL_BADGES.approved,
    intro: "ใบลาของคุณได้รับการอนุมัติครบทุกขั้นตอนแล้ว",
    rows,
    cta: buildCta(OWNER_ACTION_URL(leave.leave_id), "เปิดดูรายละเอียดใบลา"),
    loginCta: buildCta("/login", "เข้าสู่ระบบ"),
  });

  await sendEmail({ to: ownerEmail, subject, body });
}

/**
 * Leave cancelled -> the requesting employee.
 */
export async function sendLeaveCancelledEmail(leaveId: string): Promise<void> {
  const leave = await loadLeave(leaveId);
  if (!leave) return;

  const ownerEmail = leave.staff.user?.email?.trim();
  if (!ownerEmail) {
    console.warn(
      `[leaveMailer] Leave owner ${leave.staff_id} has no email; cancelled mail skipped.`,
    );
    return;
  }

  const { reference, rows } = renderSummary(leave);
  const extraRows: EmailRow[] = leave.cancel_reason
    ? [row("เหตุผลการยกเลิก", escapeHtml(leave.cancel_reason))]
    : [];
  const subject = `[ระบบลา] ใบลาของคุณถูกยกเลิก ${reference}`;
  const body = renderEmail({
    badge: EMAIL_BADGES.cancelled,
    intro: "ใบลาของคุณถูกยกเลิกแล้ว",
    rows: [...rows, ...extraRows],
    cta: buildCta(OWNER_ACTION_URL(leave.leave_id), "เปิดดูรายละเอียดใบลา"),
    loginCta: buildCta("/login", "เข้าสู่ระบบ"),
  });

  await sendEmail({ to: ownerEmail, subject, body });
}

/**
 * Leave rejected -> the requesting employee.
 */
export async function sendLeaveRejectedEmail(
  leaveId: string,
  reason?: string | null,
): Promise<void> {
  const leave = await loadLeave(leaveId);
  if (!leave) return;

  const ownerEmail = leave.staff.user?.email?.trim();
  if (!ownerEmail) {
    console.warn(
      `[leaveMailer] Leave owner ${leave.staff_id} has no email; rejected mail skipped.`,
    );
    return;
  }

  const { reference, rows } = renderSummary(leave);
  const reasonRows: EmailRow[] = reason
    ? [row("เหตุผลที่ไม่อนุมัติ", escapeHtml(reason))]
    : [];
  const subject = `[ระบบลา] ใบลาของคุณไม่ได้รับอนุมัติ ${reference}`;
  const body = renderEmail({
    badge: EMAIL_BADGES.rejected,
    intro: "ใบลาของคุณไม่ได้รับการอนุมัติ",
    rows: [...rows, ...reasonRows],
    cta: buildCta(OWNER_ACTION_URL(leave.leave_id), "เปิดดูรายละเอียดใบลา"),
    loginCta: buildCta("/login", "เข้าสู่ระบบ"),
  });

  await sendEmail({ to: ownerEmail, subject, body });
}

export function scheduleLeaveCreatedEmail(leaveId: string): void {
  schedule(() => sendLeaveCreatedEmail(leaveId));
}

export function scheduleLeaveNextApproverEmail(leaveId: string): void {
  schedule(() => sendLeaveNextApproverEmail(leaveId));
}

export function scheduleLeaveApprovedEmail(leaveId: string): void {
  schedule(() => sendLeaveApprovedEmail(leaveId));
}

export function scheduleLeaveCancelledEmail(leaveId: string): void {
  schedule(() => sendLeaveCancelledEmail(leaveId));
}

export function scheduleLeaveRejectedEmail(
  leaveId: string,
  reason?: string | null,
): void {
  schedule(() => sendLeaveRejectedEmail(leaveId, reason));
}
