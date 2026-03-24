"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type NativeSelectProps = React.ComponentPropsWithoutRef<"select">;

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  NativeSelectProps
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative w-full max-w-[220px]">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full cursor-pointer appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-9 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
});
NativeSelect.displayName = "NativeSelect";
