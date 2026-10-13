export type EmailRow = { label: string; value: string };

export type EmailBadge = { label: string; bg: string; color: string };

export type EmailCta = { label: string; url: string };

export type EmailBadgePreset = "pending" | "approved" | "rejected" | "cancelled";

export const EMAIL_BADGES: Record<EmailBadgePreset, EmailBadge> = {
  pending: { label: "รออนุมัติ", bg: "#fff7ed", color: "#c2410c" },
  approved: { label: "อนุมัติแล้ว", bg: "#ecfdf5", color: "#047857" },
  rejected: { label: "ไม่อนุมัติ", bg: "#fef2f2", color: "#b91c1c" },
  cancelled: { label: "ยกเลิก", bg: "#f3f4f6", color: "#4b5563" },
};

export type RenderEmailOptions = {
  systemName?: string;
  accent?: string;
  badge?: EmailBadge | null;
  intro: string;
  rows: EmailRow[];
  cta?: EmailCta | null;
  loginCta?: EmailCta | null;
  footer?: string;
};

const PAGE_BG = "#f4f5f7";
const CARD_BORDER = "#e5e7eb";
const ROW_BORDER = "#eef0f3";
const LABEL_COLOR = "#6b7280";
const VALUE_COLOR = "#111827";

const DEFAULT_FOOTER =
  "อีเมลฉบับนี้เป็นข้อความแจ้งเตือนอัตโนมัติจากระบบใบลา<br />" +
  "กรุณาอย่าตอบกลับ<br />" +
  "This is an automated notification. Please do not reply.";

export function renderEmail({
  systemName = "ระบบใบลาออนไลน์",
  accent = "#2563eb",
  badge = null,
  intro,
  rows,
  cta = null,
  loginCta = null,
  footer = DEFAULT_FOOTER,
}: RenderEmailOptions): string {
  const detailRows = rows
    .map((r, index) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb";
      return `<tr>
              <td style="padding:10px 14px;background:${bg};border-bottom:1px solid ${ROW_BORDER};color:${LABEL_COLOR};font-size:13px;width:140px;vertical-align:top;white-space:nowrap;">${r.label}</td>
              <td style="padding:10px 14px;background:${bg};border-bottom:1px solid ${ROW_BORDER};color:${VALUE_COLOR};font-size:14px;vertical-align:top;">${r.value}</td>
            </tr>`;
    })
    .join("");

  const badgeHtml = badge
    ? `<div style="margin:0 0 14px;"><span style="display:inline-block;padding:7px 18px;border-radius:999px;font-size:16px;font-weight:700;letter-spacing:0.2px;background:${badge.bg};color:${badge.color};">${badge.label}</span></div>`
    : "";

  const buttons: string[] = [];
  if (cta) {
    buttons.push(
      `<a href="${cta.url}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600;">${cta.label}</a>`,
    );
  }
  if (loginCta) {
    buttons.push(
      `<a href="${loginCta.url}" style="display:inline-block;background:#eef2ff;color:${accent};text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #c7d2fe;">${loginCta.label}</a>`,
    );
  }

  const ctaHtml =
    buttons.length > 0
      ? `<tr>
            <td style="padding:6px 28px 28px;">
              ${buttons.join(`<span style="display:inline-block;width:10px;"></span>`)}
            </td>
          </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${systemName}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${CARD_BORDER};border-radius:12px;overflow:hidden;font-family:'Helvetica Neue',Arial,'Segoe UI',sans-serif;">
          <tr>
            <td style="background:${accent};padding:20px 28px;color:#ffffff;font-size:18px;font-weight:600;">
              ${systemName}
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px 8px;">
              ${badgeHtml}
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${ROW_BORDER};border-radius:8px;overflow:hidden;">
                ${detailRows}
              </table>
            </td>
          </tr>
          ${ctaHtml}
          <tr>
            <td style="padding:18px 28px;background:#f9fafb;border-top:1px solid ${ROW_BORDER};color:#9ca3af;font-size:12px;line-height:1.7;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
