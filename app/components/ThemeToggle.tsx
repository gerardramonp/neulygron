"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { THEME_COOKIE } from "@/lib/theme/config";
import type { UiTheme } from "@/lib/theme/resolve-ui-theme";
import { useResolvedUiTheme } from "./ThemeUiProvider";

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)",
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Client-only: read cookie + OS preference when cookie is missing/system. */
function resolveCookieToUiTheme(): UiTheme {
  const raw = readCookie(THEME_COOKIE)?.trim().toLowerCase();
  if (raw === "light") return "light";
  if (raw === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(theme: UiTheme) {
  const html = document.documentElement;
  if (theme === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

const MODES: { mode: UiTheme; Icon: typeof Sun; label: string }[] = [
  { mode: "light", Icon: Sun, label: "Light mode" },
  { mode: "dark", Icon: Moon, label: "Dark mode" },
];

export type ThemeToggleProps = {
  /** floating = fixed corner pill; inline = compact icons for navbars */
  variant?: "floating" | "inline";
  orientation?: "horizontal" | "vertical";
  /** onPrimary = icons for blue desktop sidebar */
  tone?: "default" | "onPrimary";
  className?: string;
};

export default function ThemeToggle({
  variant = "floating",
  orientation = "horizontal",
  tone = "default",
  className,
}: ThemeToggleProps) {
  const serverUiTheme = useResolvedUiTheme();
  const [theme, setTheme] = useState<UiTheme>(serverUiTheme);

  useLayoutEffect(() => {
    setTheme(resolveCookieToUiTheme());
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${oneYear}`;
  }, [theme]);

  const triggerSide = orientation === "vertical" ? "right" : "bottom";

  const modeControls = MODES.map(({ mode, Icon, label }) => {
    const selected = theme === mode;
    return (
      <Tooltip key={mode}>
        <TooltipTrigger
          type="button"
          aria-label={label}
          aria-checked={selected}
          role="radio"
          onClick={() => setTheme(mode)}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected
              ? tone === "onPrimary"
                ? "bg-white/15 text-white ring-1 ring-white/30"
                : "bg-muted text-foreground ring-1 ring-ring"
              : tone === "onPrimary"
                ? "text-sidebar-desktop-foreground/75 hover:bg-white/10 hover:text-sidebar-desktop-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </TooltipTrigger>
        <TooltipContent side={triggerSide}>{label}</TooltipContent>
      </Tooltip>
    );
  });

  if (variant === "floating") {
    return (
      <TooltipProvider delayDuration={300}>
        <div
          className={cn(
            "fixed top-4 right-4 z-50 flex items-center gap-0.5 rounded-full border border-border bg-background/95 px-1.5 py-1 text-foreground shadow-md backdrop-blur-sm",
          )}
          role="radiogroup"
          aria-label="Color theme"
        >
          {modeControls}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex gap-0.5 rounded-lg border p-0.5",
          orientation === "vertical" ? "flex-col" : "flex-row items-center",
          tone === "onPrimary"
            ? "border-white/15 bg-white/5 text-sidebar-desktop-foreground"
            : "border-border bg-background/80 text-foreground backdrop-blur-sm",
          className,
        )}
        role="radiogroup"
        aria-label="Color theme"
      >
        {modeControls}
      </div>
    </TooltipProvider>
  );
}
