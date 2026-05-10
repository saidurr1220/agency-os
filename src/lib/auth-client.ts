import { createAuthClient } from "better-auth/react";
import { normalizeAuthBaseUrl } from "@/lib/normalize-auth-url";

/** Same host as the page in the browser so sign-up/in stay same-origin (avoids CORS preflight to a mismatched localhost vs 127.0.0.1 base URL). */
function resolveAuthClientBaseURL(): string | undefined {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return normalizeAuthBaseUrl(process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
}

export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
