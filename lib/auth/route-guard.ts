/**
 * Central list of URL path prefixes that require a signed-in session.
 * When you add a prefix here, extend `middleware.ts` `config.matcher` with that
 * path and `${prefix}/:path*` so the edge middleware runs for those routes.
 */
export const AUTH_REQUIRED_PATH_PREFIXES = ["/config", "/reports"] as const;

export function pathRequiresAuthentication(pathname: string): boolean {
  return AUTH_REQUIRED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

