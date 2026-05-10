import { Resend } from "resend";
import { normalizeAuthBaseUrl } from "@/lib/normalize-auth-url";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function isMailConfigured(): boolean {
  return Boolean(resend && process.env.EMAIL_FROM);
}

/** Public URL for links in emails (invite, password reset). */
export function getPublicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const authUrl = normalizeAuthBaseUrl(process.env.BETTER_AUTH_URL);
  if (authUrl) return authUrl.replace(/\/$/, "");

  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;

  return "http://localhost:3000";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sendMail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const from = process.env.EMAIL_FROM?.trim();
  if (!resend || !from) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[mail] Skipped (set RESEND_API_KEY and EMAIL_FROM):",
        params.subject,
      );
    }
    return { ok: false, skipped: true };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text ?? stripHtml(params.html),
    });
    if (error) {
      console.error("[mail] Resend:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[mail]", e);
    return { ok: false };
  }
}
