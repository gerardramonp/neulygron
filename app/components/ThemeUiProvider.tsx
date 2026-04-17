"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { UiTheme } from "@/lib/theme/resolve-ui-theme";

const ThemeUiContext = createContext<UiTheme>("light");

export function ThemeUiProvider({
  value,
  children,
}: {
  value: UiTheme;
  children: ReactNode;
}) {
  return (
    <ThemeUiContext.Provider value={value}>{children}</ThemeUiContext.Provider>
  );
}

export function useResolvedUiTheme(): UiTheme {
  return useContext(ThemeUiContext);
}

export default ThemeUiProvider;
