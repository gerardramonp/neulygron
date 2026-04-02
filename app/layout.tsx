import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";

import AppNavigation from "./components/AppNavigation";
import AuthSessionProvider from "./components/AuthSessionProvider";
import "./globals.css";
import { cookies } from "next/headers";
import { THEME_COOKIE, type Theme } from "@/lib/theme/config";

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
  const theme =
    (cookieStore.get(THEME_COOKIE)?.value as Theme | undefined) ?? "light";
  const htmlClass = theme === "dark" ? "dark" : "";
  return (
    <html lang="en" className={htmlClass}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <NextIntlClientProvider>
            <div className="min-h-screen bg-background text-foreground md:flex">
              <AppNavigation />
              <div className="flex-1 min-h-screen pb-24 md:pb-0 bg-background">
                {children}
              </div>
            </div>
          </NextIntlClientProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
