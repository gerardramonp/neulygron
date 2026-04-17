import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";

import MixpanelProvider from "@/components/MixpanelProvider";
import { cookieValueToUiTheme } from "@/lib/theme/resolve-ui-theme";
import AuthSessionProvider from "./components/AuthSessionProvider";
import ThemeUiProvider from "./components/ThemeUiProvider";
import "./globals.css";
import { cookies, headers } from "next/headers";
import { THEME_COOKIE } from "@/lib/theme/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuLygron",
  description: "NeuLygron platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerList = await headers();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const uiTheme = cookieValueToUiTheme(
    themeCookie,
    headerList.get("sec-ch-prefers-color-scheme"),
  );
  const htmlClass = uiTheme === "dark" ? "dark" : "";
  return (
    <html lang="en" className={htmlClass}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeUiProvider value={uiTheme}>
          <AuthSessionProvider>
            <NextIntlClientProvider>
              <MixpanelProvider>{children}</MixpanelProvider>
            </NextIntlClientProvider>
          </AuthSessionProvider>
        </ThemeUiProvider>
      </body>
    </html>
  );
}
