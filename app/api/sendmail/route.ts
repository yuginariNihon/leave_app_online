import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail/sendEmail";
import { requireHR } from "@/lib/api-guards";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * HR-only test endpoint for the Google Apps Script mail webhook.
 * Sends to TEST_EMAIL_TO so the integration can be verified without
 * touching real leave notifications.
 */
export async function POST() {
  const guard = await requireHR();
  if (guard.error) return guard.error;

  const recipient = process.env.TEST_EMAIL_TO;

  if (!recipient) {
    return NextResponse.json(
      { success: false, error: "TEST_EMAIL_TO is missing" },
      { status: 500 },
    );
  }

  try {
    await sendEmail({
      to: recipient,
      subject: "Test Email - Leave Online",
      body: "ทดสอบส่งอีเมลจาก localhost ผ่าน Google Apps Script",
    });

    return NextResponse.json({
      success: true,
      message: `ส่งคำขออีเมลไปยัง ${recipient} สำเร็จ`,
    });
  } catch (error) {
    logger.error("sendmail", "test email failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Email test failed",
      },
      { status: 500 },
    );
  }
}
