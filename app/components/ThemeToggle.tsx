"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE, type Theme } from "@/lib/theme/config";

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

const themes: Theme[] = ["light", "dark", "system"];

const icons: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

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

  function cycleTheme() {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Current theme: ${theme}. Click to switch theme.`}
      title={`Theme: ${theme}`}
    >
      {icons[theme]}
    </Button>
  );
}
