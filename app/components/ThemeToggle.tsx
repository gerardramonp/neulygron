"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE, type Theme } from "@/lib/theme/config";

const THEMES: Theme[] = ["light", "dark", "system"];

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
    html.classList.toggle("dark", theme === "dark");

    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${oneYear}`;
  }, [theme]);

  function cycleTheme() {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label =
    theme === "light"
      ? "Switch to dark mode"
      : theme === "dark"
        ? "Switch to system theme"
        : "Switch to light mode";

  return (
    <Button variant="outline" size="icon" onClick={cycleTheme} aria-label={label}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
