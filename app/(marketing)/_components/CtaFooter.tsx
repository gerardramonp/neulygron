"use client";

import { useCallback } from "react";
import Link from "next/link";
import { animate } from "animejs";
import { Button } from "@/components/ui/button";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";

export default function CtaFooter() {
  const animateCta = useCallback((el: HTMLElement) => {
    animate(el.querySelectorAll("[data-cta-content]"), {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 700,
      ease: "outExpo",
    });
  }, []);

  const ref = useScrollAnimate(animateCta, { threshold: 0.2 });

  return (
    <>
      <section
        ref={ref}
        className="relative overflow-hidden bg-primary py-24 text-primary-foreground md:py-32"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-foreground/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl" />
        </div>

        <div
          data-cta-content
          className="relative mx-auto max-w-2xl px-6 text-center opacity-0"
        >
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Take Control of Your Finances
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-primary-foreground/80">
            Stop guessing where your money goes. Let AI handle the tedious work
            so you can focus on what matters.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              variant="secondary"
              className="text-base px-10 py-6 font-semibold"
              asChild
            >
              <Link href="/register">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            <span className="font-semibold text-foreground">NeuLygron</span>{" "}
            &copy; {new Date().getFullYear()}
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
