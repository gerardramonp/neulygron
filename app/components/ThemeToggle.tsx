"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE, type Theme } from "@/lib/theme/config";

const themes: Theme[] = ["light", "dark", "system"];

const icons: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

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
    setTheme((current) => {
      const idx = themes.indexOf(current);
      return themes[(idx + 1) % themes.length];
    });
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Switch theme (current: ${theme})`}
    >
      {icons[theme]}
    </Button>
  );
}
