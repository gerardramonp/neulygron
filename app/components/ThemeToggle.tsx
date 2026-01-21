"use client";

import { useEffect, useState } from "react";
import { THEME_COOKIE, type Theme } from "@/lib/theme/config";

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "system";
    const v = readCookie(THEME_COOKIE) as Theme | null;
    return v ?? "system";
  });

  useEffect(() => {
    const html = document.documentElement;
    const isDark = theme === "dark";
    html.classList.toggle("dark", isDark);

    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${oneYear}`;
  }, [theme]);

  function set(next: Theme) {
    setTheme(next);
  }

  const btnBase =
    "rounded-full px-2 py-1 transition-colors hover:bg-muted hover:ring-1 hover:ring-ring ";
  const selectedThemeClass = "font-semibold ring-1 ring-ring";

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm bg-background text-foreground backdrop-blur">
      <span className="opacity-70">Theme:</span>
      <button
        type="button"
        onClick={() => set("light")}
        aria-pressed={theme === "light"}
        className={`${btnBase} ${theme === "light" ? selectedThemeClass : ""}`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => set("dark")}
        aria-pressed={theme === "dark"}
        className={`${btnBase} ${theme === "dark" ? selectedThemeClass : ""}`}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => set("system")}
        aria-pressed={theme === "system"}
        className={`${btnBase} ${theme === "system" ? selectedThemeClass : ""}`}
      >
        System
      </button>
    </div>
  );
}
