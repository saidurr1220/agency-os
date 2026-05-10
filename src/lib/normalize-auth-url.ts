/**
 * Better Auth uses `new URL(baseURL)` — host-only values fail (common when env is set to a bare domain).
 * Production hosts get `https://`; loopback gets `http://`.
 */
export function normalizeAuthBaseUrl(raw: string | undefined): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^localhost\b/i.test(s) || /^127\.0\.0\.1\b/.test(s)) {
    return `http://${s}`;
  }
  return `https://${s}`;
}
