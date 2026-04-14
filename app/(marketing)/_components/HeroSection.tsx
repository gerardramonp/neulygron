"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { stagger, createTimeline } from "animejs";
import { Button } from "@/components/ui/button";

function useParallax(speeds: Record<string, number>) {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const raf = useRef(0);

  const setRef = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      refs.current[key] = el;
    },
    [],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        for (const [key, speed] of Object.entries(speeds)) {
          const el = refs.current[key];
          if (el) el.style.transform = `translate3d(0,${y * speed}px,0)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, [speeds]);

  return setRef;
}

function HeroVisual() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cardRef.current
        .querySelectorAll<HTMLElement>(".opacity-0")
        .forEach((el) => el.classList.remove("opacity-0"));
      return;
    }

    const tl = createTimeline({ defaults: { ease: "outExpo" } });

    tl.add(cardRef.current, {
      opacity: [0, 1],
      scale: [0.92, 1],
      translateY: [30, 0],
      duration: 700,
    }, 400);

    tl.add(cardRef.current.querySelectorAll("[data-row]"), {
      opacity: [0, 1],
      translateX: [24, 0],
      delay: stagger(80),
      duration: 500,
    }, 700);
  }, []);

  const rows = [
    { label: "Grocery Store", amount: "$142.50", cat: "Food", color: "bg-emerald-500" },
    { label: "Electric Bill", amount: "$89.00", cat: "Utilities", color: "bg-blue-500" },
    { label: "Netflix", amount: "$15.99", cat: "Entertainment", color: "bg-purple-500" },
    { label: "Gas Station", amount: "$52.30", cat: "Transport", color: "bg-amber-500" },
    { label: "Pharmacy", amount: "$34.20", cat: "Health", color: "bg-rose-500" },
  ];

  return (
    <div
      ref={cardRef}
      className="relative mx-auto w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-5 shadow-2xl backdrop-blur-sm opacity-0"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          March 2026
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          5 expenses
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.label}
            data-row
            className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/60 px-3 py-2.5 opacity-0"
          >
            <div className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
            <span className="flex-1 text-sm font-medium">{r.label}</span>
            <span className="text-xs text-muted-foreground">{r.cat}</span>
            <span className="text-sm font-semibold tabular-nums">
              {r.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PARALLAX_SPEEDS = { blobs: -0.15, content: -0.06, visual: -0.1 } as const;

export default function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const setParallax = useParallax(PARALLAX_SPEEDS);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      [headlineRef, subtitleRef].forEach((r) => {
        if (!r.current) return;
        r.current.classList.remove("opacity-0");
        r.current
          .querySelectorAll<HTMLElement>(".opacity-0")
          .forEach((el) => el.classList.remove("opacity-0"));
      });
      if (ctaRef.current) {
        Array.from(ctaRef.current.children).forEach((node) => {
          if (node instanceof HTMLElement) {
            node.classList.remove("opacity-0", "translate-y-5");
          }
        });
      }
      return;
    }

    const tl = createTimeline({ defaults: { ease: "outExpo" } });

    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll("[data-word]");
      tl.add(words, {
        opacity: [0, 1],
        translateY: [40, 0],
        filter: ["blur(8px)", "blur(0px)"],
        delay: stagger(80),
        duration: 900,
      }, 0);
    }

    if (subtitleRef.current) {
      tl.add(subtitleRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
      }, 350);
    }

    if (ctaRef.current) {
      tl.add(ctaRef.current.children, {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.9, 1],
        delay: stagger(120),
        duration: 500,
      }, 550);
    }
  }, []);

  const headline = "AI That Understands Your Expenses";

  return (
    <section className="relative flex min-h-svh items-center overflow-hidden py-24 pt-28 lg:py-0 lg:pt-20 lg:min-h-[90vh]">
      {/* Parallax floating blobs */}
      <div
        ref={setParallax("blobs")}
        className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform"
        aria-hidden="true"
      >
        <div className="absolute -top-20 -left-20 h-72 w-72 animate-pulse rounded-full bg-primary/8 blur-3xl [animation-duration:6s]" />
        <div className="absolute top-1/3 right-0 h-64 w-64 animate-pulse rounded-full bg-chart-2/8 blur-3xl [animation-duration:8s] [animation-delay:1s]" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 animate-pulse rounded-full bg-chart-5/8 blur-3xl [animation-duration:7s] [animation-delay:2s]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        {/* Parallax text content */}
        <div ref={setParallax("content")} className="space-y-8 will-change-transform">
          <h1
            ref={headlineRef}
            className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            {headline.split(" ").map((word, i) => (
              <span key={i} data-word className="inline-block opacity-0 mr-[0.3em]">
                {word}
              </span>
            ))}
          </h1>
          <p
            ref={subtitleRef}
            className="max-w-lg text-lg text-muted-foreground opacity-0"
          >
            Upload your bank statement. Get every expense extracted, classified,
            and organized — automatically.
          </p>
          <div ref={ctaRef} className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="text-base px-8 py-6 translate-y-5 opacity-0"
              asChild
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 translate-y-5 opacity-0"
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See How It Works
            </Button>
          </div>
        </div>
        {/* Parallax hero visual — stacks below text on mobile, side-by-side on lg */}
        <div ref={setParallax("visual")} className="will-change-transform">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
