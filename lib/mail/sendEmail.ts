type SendEmailParams = {
  to: string | string[];
  subject: string;
  body: string;
};

const SEND_TIMEOUT_MS = 8000;

export async function sendEmail({ to, subject, body }: SendEmailParams) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.SENDMAIL_WEBHOOK_SECRET;

  if (!url || !secret) {
    throw new Error("Email environment variables are missing");
  }

  const recipients = (Array.isArray(to) ? to : [to])
    .map((value) => value.trim())
    .filter(Boolean)
    .join(",");

  if (!recipients) {
    throw new Error("Email recipient list is empty");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        secret,
        to: recipients,
        subject,
        body,
      }),
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Email service HTTP error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success !== true) {
      throw new Error("Email service rejected the request");
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}
