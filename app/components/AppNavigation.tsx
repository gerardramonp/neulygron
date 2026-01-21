"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Config", href: "/config" },
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
                    "group rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-border bg-sidebar-primary text-sidebar-primary-foreground shadow"
                      : "border-transparent bg-sidebar-accent text-sidebar-accent-foreground hover:border-border",
                  )}
                >
                  <div>{item.label}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed inset-x-0 bottom-4 z-40 flex justify-center">
        <div className="flex gap-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "rounded-full border px-5 py-2 text-sm font-semibold shadow backdrop-blur transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
