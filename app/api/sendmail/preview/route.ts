import { NextResponse } from "next/server";
import {
  EMAIL_BADGES,
  renderEmail,
  type EmailBadge,
  type EmailCta,
  type EmailRow,
} from "@/lib/mail/emailTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_ROWS: EmailRow[] = [
  { label: "เลขที่ใบลา", value: "<b>2569-0001</b>" },
  { label: "พนักงาน", value: "สมชาย ใจดี (NFT22070001)" },
  { label: "แผนก", value: "ทรัพยากรบุคคล" },
  { label: "ประเภทการลา", value: "ลาป่วย - ป่วยทั่วไป" },
  { label: "วันที่", value: "12-10-2026" },
  { label: "ช่วงเวลา", value: "09:00 – 12:00 น. (3 ชม.)" },
  { label: "จำนวน", value: "0.38 วัน" },
  { label: "เหตุผล", value: "พักผ่อนไม่เพียงพอ" },
];

type Variant = { title: string; badge: EmailBadge; intro: string; rows: EmailRow[]; cta: EmailCta };

const VARIANTS: Variant[] = [
  {
    title: "สร้างใบลาใหม่ (created)",
    badge: EMAIL_BADGES.pending,
    intro: "มีคำขอลาใหม่รอการอนุมัติ",
    rows: SAMPLE_ROWS,
    cta: { label: "เปิดดูรายการขออนุมัติ", url: "#" },
  },
  {
    title: "ถึงคิวขั้นถัดไป (next approver)",
    badge: EMAIL_BADGES.pending,
    intro: "ใบลาของ สมชาย ใจดี ถึงคิวการอนุมัติของคุณแล้ว",
    rows: SAMPLE_ROWS,
    cta: { label: "เปิดดูรายการขออนุมัติ", url: "#" },
  },
  {
    title: "อนุมัติครบทุกขั้น (approved)",
    badge: EMAIL_BADGES.approved,
    intro: "ใบลาของคุณได้รับการอนุมัติครบทุกขั้นตอนแล้ว",
    rows: SAMPLE_ROWS,
    cta: { label: "เปิดดูรายละเอียดใบลา", url: "#" },
  },
  {
    title: "ถูกยกเลิก (cancelled)",
    badge: EMAIL_BADGES.cancelled,
    intro: "ใบลาของคุณถูกยกเลิกแล้ว",
    rows: [...SAMPLE_ROWS, { label: "เหตุผลการยกเลิก", value: "ผู้ขอลายกเลิกเอง" }],
    cta: { label: "เปิดดูรายละเอียดใบลา", url: "#" },
  },
  {
    title: "ไม่อนุมัติ (rejected)",
    badge: EMAIL_BADGES.rejected,
    intro: "ใบลาของคุณไม่ได้รับการอนุมัติ",
    rows: [...SAMPLE_ROWS, { label: "เหตุผลที่ไม่อนุมัติ", value: "ช่วงเวลาที่ขอลาไม่เหมาะสม" }],
    cta: { label: "เปิดดูรายละเอียดใบลา", url: "#" },
  },
];

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const blocks = VARIANTS.map((variant) => {
    const title = `<p style="font-family:Arial,sans-serif;text-align:center;color:#374151;font-size:13px;margin:0 0 12px;">${variant.title}</p>`;
    const email = renderEmail({
      badge: variant.badge,
      intro: variant.intro,
      rows: variant.rows,
      cta: variant.cta,
    });
    return `<section style="margin:0 0 48px;">${title}${email}</section>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>พรีวิวอีเมลแจ้งเตือน</title>
</head>
<body style="margin:0;padding:32px 12px;background:#e9eaee;">
  <h1 style="font-family:Arial,sans-serif;text-align:center;color:#111827;font-size:20px;margin:0 0 32px;">พรีวิวอีเมลแจ้งเตือน (ตัวอย่าง)</h1>
  ${blocks}
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
