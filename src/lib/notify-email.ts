import { prisma } from "@/lib/prisma";
import { getPublicBaseUrl, sendMail } from "@/lib/mail";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Queue helper: never throws; logs failures. */
export function mailFireAndForget(p: Promise<unknown>): void {
  void p.catch((e) => console.error("[notify-email]", e));
}

export async function notifyUserByEmail(
  userId: string,
  payload: { subject: string; html: string; text: string },
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return;
  await sendMail({ to: user.email, ...payload });
}

/** In-app notification mirrored to email (tasks, projects, admin). */
export async function notifyUserAppEmail(
  userId: string,
  title: string,
  message: string,
  path = "/notifications",
): Promise<void> {
  const base = getPublicBaseUrl();
  const href = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  await notifyUserByEmail(userId, {
    subject: title,
    html: `<p><strong>${esc(title)}</strong></p><p>${esc(message)}</p><p><a href="${href}">Open in AgencyOS</a></p>`,
    text: `${title}\n\n${message}\n\n${href}`,
  });
}

export async function sendInvitationEmail(params: {
  to: string;
  companyName: string;
  role: string;
  code: string;
  expiresAt: Date;
  invitedByName: string;
}): Promise<void> {
  const base = getPublicBaseUrl();
  const registerUrl = `${base}/register?invite=${encodeURIComponent(params.code)}`;
  const joinExistingUrl = `${base}/join?invite=${encodeURIComponent(params.code)}`;
  const html = `
    <p>Hi,</p>
    <p><strong>${esc(params.invitedByName)}</strong> invited you to join <strong>${esc(params.companyName)}</strong> on AgencyOS as <strong>${esc(params.role)}</strong>.</p>
    <p><strong>Invitation code:</strong> ${esc(params.code)}</p>
    <p>This code expires on ${esc(params.expiresAt.toLocaleString())}.</p>
    <p><a href="${registerUrl}">New to AgencyOS — create your account</a></p>
    <p><a href="${joinExistingUrl}">Already registered — sign in and accept</a></p>
    <p style="color:#666;font-size:12px">If you did not expect this email, you can ignore it.</p>
  `;
  const text = `${params.invitedByName} invited you to ${params.companyName} on AgencyOS.\nCode: ${params.code}\nRegister: ${registerUrl}\nAlready have an account: ${joinExistingUrl}\nExpires: ${params.expiresAt.toISOString()}`;
  await sendMail({
    to: params.to,
    subject: `You're invited to ${params.companyName} on AgencyOS`,
    html,
    text,
  });
}
