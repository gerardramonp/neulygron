/**
 * Returns a same-origin relative path safe for post-login redirects.
 * Rejects missing values, non-root-relative paths, and protocol-relative URLs.
 */
export function safeInternalRedirectPath(
  candidate: string | null | undefined,
  fallback = "/",
): string {
  if (!candidate) {
    return fallback;
  }
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }
  return candidate;
}
