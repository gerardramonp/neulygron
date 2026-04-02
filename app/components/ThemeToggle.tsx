"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";
import { THEME_COOKIE, type Theme } from "@/lib/theme/config";

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "light";
    const v = readCookie(THEME_COOKIE) as Theme | null;
    return v === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", theme === "dark");

    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${oneYear}`;
  }, [theme]);

  function toggle() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={clsx(
        "text-xs flex flex-col items-center gap-0.5 transition-colors",
        className,
      )}
    >
      <span className="rounded-lg border border-current/20 p-2 hover:border-current/50">
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
