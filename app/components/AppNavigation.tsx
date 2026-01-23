"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, Settings, User2 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Config", href: "/config", icon: Settings },
];

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex text-sidebar-foreground w-64 flex-col border-r border-border bg-sidebar px-6 py-10 pb-16">
        <div>
          <p className="text-md uppercase tracking-widest text-muted-foreground">
            NeuLygron
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "group rounded-2xl border px-4 py-3 text-sm font-medium transition-colors flex items-center gap-3",
                    isActive
                      ? "border-border bg-sidebar-accent text-sidebar-accent-foreground shadow"
                      : "border-transparent hover:border-border",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <div>{item.label}</div>
                </Link>
              );
            })}
          </div>
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
