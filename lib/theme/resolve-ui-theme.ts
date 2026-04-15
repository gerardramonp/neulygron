/**
 * Maps persisted cookie (+ optional client hint on the server) to a concrete
 * light/dark UI theme. Used by the root layout and client theme toggle.
 */
export type UiTheme = "light" | "dark";

export function cookieValueToUiTheme(
  cookieValue: string | undefined,
  secChPrefersColorScheme?: string | null,
): UiTheme {
  const v = cookieValue?.trim().toLowerCase();
  if (v === "dark") return "dark";
  if (v === "light") return "light";
  const sec = secChPrefersColorScheme?.trim().toLowerCase();
  if (sec === "dark") return "dark";
  return "light";
}
