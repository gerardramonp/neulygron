"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Config", href: "/config", icon: Settings },
];

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex bg-sidebar-desktop text-sidebar-desktop-foreground w-18 flex-col px-4 py-10 pb-16 md:sticky md:top-0 md:h-screen md:flex-shrink-0">
        <div className="mt-4 flex flex-col gap-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "group text-xs transition-colors flex flex-col items-center gap-0.5",
                  isActive ? "font-bold" : "font-medium",
                )}
              >
                <div
                  className={clsx(
                    " rounded-lg p-2",
                    isActive
                      ? "border-border bg-sidebar-accent text-sidebar-accent-foreground shadow"
                      : "border-transparent hover:border-border",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </div>

                <div>{item.label}</div>
              </Link>
            );
          })}
        </div>
      </aside>

      <nav className="md:hidden fixed inset-x-0 bottom-4 z-40 flex justify-center">
        <div className="flex gap-4 p-1 bg-sidebar backdrop-blur-xs rounded-full border border-border shadow-lg">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "rounded-full backdrop-blur-xs px-4 py-1 text-sm transition-colors flex flex-col items-center",
                  isActive
                    ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground"
                    : "border-border ",
                )}
              >
                <item.icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <div>{item.label}</div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
