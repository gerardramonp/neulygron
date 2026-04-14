"use client";

import { useCallback } from "react";
import Link from "next/link";
import { animate, createTimeline } from "animejs";
import { Button } from "@/components/ui/button";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";

export default function CtaFooter() {
  const animateCta = useCallback((el: HTMLElement) => {
    const tl = createTimeline({ defaults: { ease: "outExpo" } });

    const heading = el.querySelector("[data-cta-heading]");
    if (heading) {
      tl.add(heading, {
        opacity: [0, 1],
        translateY: [40, 0],
        letterSpacing: ["0.15em", "0em"],
        duration: 900,
      }, 0);
    }

    const sub = el.querySelector("[data-cta-sub]");
    if (sub) {
      tl.add(sub, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
      }, 200);
    }

    const btn = el.querySelector("[data-cta-btn]");
    if (btn) {
      tl.add(btn, {
        opacity: [0, 1],
        scale: [0.85, 1],
        duration: 500,
      }, 400);

      animate(btn, {
        boxShadow: [
          "0 0 0 0 rgba(255,255,255,0)",
          "0 0 0 8px rgba(255,255,255,0.15)",
          "0 0 0 0 rgba(255,255,255,0)",
        ],
        duration: 2000,
        ease: "inOutSine",
        loop: true,
        delay: 1200,
      });
    }
  }, []);

  const ref = useScrollAnimate(animateCta, { threshold: 0.2 });

  return (
    <>
      <section
        ref={ref}
        className="relative overflow-hidden bg-primary py-24 text-primary-foreground md:py-32"
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute -top-24 -right-24 h-80 w-80 animate-pulse rounded-full bg-primary-foreground/5 blur-3xl [animation-duration:5s]" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 animate-pulse rounded-full bg-primary-foreground/5 blur-3xl [animation-duration:7s] [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary-foreground/3 blur-3xl [animation-duration:6s] [animation-delay:2s]" />
        </div>

        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2
            data-cta-heading
            className="text-3xl font-bold opacity-0 sm:text-4xl lg:text-5xl"
          >
            Take Control of Your Finances
          </h2>
          <p
            data-cta-sub
            className="mx-auto mt-4 max-w-md text-lg opacity-0 text-primary-foreground/80"
          >
            Stop guessing where your money goes. Let AI handle the tedious work
            so you can focus on what matters.
          </p>
          <div className="mt-8">
            <Button
              data-cta-btn
              size="lg"
              variant="secondary"
              className="text-base px-10 py-6 font-semibold opacity-0"
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
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="transition-colors hover:text-foreground"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
