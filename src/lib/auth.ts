import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { normalizeAuthBaseUrl } from "@/lib/normalize-auth-url";

/** Trust localhost ↔ 127.0.0.1 interchangeably so dev works regardless of which loopback host is in BETTER_AUTH_URL. */
function loopbackTrustedOrigins(baseUrl: string): string[] {
  try {
    const u = new URL(baseUrl);
    const h = u.hostname;
    if (h !== "localhost" && h !== "127.0.0.1") return [];
    const other = new URL(baseUrl);
    other.hostname = h === "localhost" ? "127.0.0.1" : "localhost";
    const a = u.origin;
    const b = other.origin;
    return a === b ? [a] : [a, b];
  } catch {
    return [];
  }
}

/** When BETTER_AUTH_URL points at a non-loopback URL, origin checks still need loopback during local `next dev`. */
function developmentLoopbackOrigins(): string[] {
  if (process.env.NODE_ENV !== "development") return [];
  const port = process.env.PORT || "3000";
  return [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
}

const serverAuthBaseUrl =
  normalizeAuthBaseUrl(process.env.BETTER_AUTH_URL) ?? "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: serverAuthBaseUrl,
  trustedOrigins: [
    ...loopbackTrustedOrigins(serverAuthBaseUrl),
    ...developmentLoopbackOrigins(),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Reset your AgencyOS password",
        html: `<p>Hello,</p><p>We received a request to reset the password for your AgencyOS account.</p><p><a href="${url.replace(/"/g, "&quot;")}">Choose a new password</a></p><p>If you didn&apos;t ask for this, you can ignore this email.</p>`,
        text: `Reset your AgencyOS password: ${url}`,
      });
    },
  },
  user: {
    modelName: "User",
    fields: {
      emailVerified: "emailVerified",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    additionalFields: {
      systemRole: { type: "string", required: false, input: false },
      companyId: { type: "string", required: false, input: false },
      companyRole: { type: "string", required: false, input: false },
      departmentId: { type: "string", required: false, input: false },
    },
  },
  session: {
    modelName: "Session",
    fields: {
      token: "sessionToken",
      userId: "userId",
      expiresAt: "expires",
      ipAddress: "ipAddress",
      userAgent: "userAgent",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
  account: {
    modelName: "Account",
    fields: {
      userId: "userId",
      accountId: "providerAccountId",
      providerId: "provider",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      expiresAt: "expires_at",
    },
  },
});

export type Session = typeof auth.$Infer.Session;
