"use client";

import { useCallback } from "react";
import { animate, stagger, createTimeline, createDrawable } from "animejs";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";

const RING_R = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

type StatItem =
  | {
      kind: "metric";
      value: number;
      suffix: string;
      label: string;
      fraction: number;
    }
  | {
      kind: "callout";
      title: string;
      body: string;
    };

const stats: StatItem[] = [
  {
    kind: "metric",
    value: 2,
    suffix: "min",
    label: "Average classification time",
    fraction: 0.25,
  },
  {
    kind: "metric",
    value: 98,
    suffix: "%",
    label: "Accuracy with custom categories",
    fraction: 0.98,
  },
  {
    kind: "callout",
    title: "Bulk AI, focused review",
    body: "Most line items are sorted automatically. Anything the model is not sure about stays in a review list so you can assign or move expenses before saving your report.",
  },
];

export default function StatsSection() {
  const animateCounters = useCallback((el: HTMLElement) => {
    const tl = createTimeline({ defaults: { ease: "outExpo" } });

    tl.add(el.querySelectorAll("[data-stat]"), {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(150),
      duration: 700,
    }, 0);

    const rings = el.querySelectorAll<SVGCircleElement>(
      "[data-metric] [data-progress-ring]",
    );
    rings.forEach((ring) => {
      const drawable = createDrawable(ring);
      const fraction = Number(ring.dataset.fraction);
      tl.add(drawable, {
        draw: ["0 0", `0 ${fraction}`],
        duration: 1400,
        ease: "outQuart",
      }, 200);
    });

    const counters = el.querySelectorAll<HTMLElement>(
      "[data-metric] [data-counter]",
    );
    counters.forEach((counter) => {
      const target = Number(counter.dataset.target);
      const suffix = counter.dataset.suffix ?? "";
      const obj = { val: 0 };
      animate(obj, {
        val: target,
        duration: 1400,
        ease: "outQuart",
        onUpdate: () => {
          counter.textContent = `${Math.round(obj.val)}${suffix}`;
        },
        onComplete: () => {
          animate(counter, {
            scale: [1, 1.15, 1],
            duration: 300,
            ease: "outBack",
          });
        },
      });
    });

    const calloutInner = el.querySelector("[data-callout-inner]");
    if (calloutInner) {
      tl.add(calloutInner, {
        opacity: [0, 1],
        scale: [0.94, 1],
        translateY: [16, 0],
        duration: 700,
        ease: "outExpo",
      }, 350);
    }

    const calloutIcons = el.querySelectorAll("[data-callout-icon]");
    if (calloutIcons.length) {
      tl.add(calloutIcons, {
        opacity: [0, 1],
        scale: [0.6, 1],
        rotate: ["-8deg", "0deg"],
        delay: stagger(80),
        duration: 500,
        ease: "outBack",
      }, 420);
    }
  }, []);

  const ref = useScrollAnimate(animateCounters);

  return (
    <section className="py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-5xl px-6">
        <div className="grid gap-10 text-center sm:grid-cols-3 sm:gap-8">
          {stats.map((s) =>
            s.kind === "metric" ? (
              <div
                key={s.label}
                data-stat
                data-metric
                className="flex flex-col items-center gap-4 opacity-0"
              >
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg
                    className="absolute inset-0 h-full w-full -rotate-90"
                    viewBox="0 0 128 128"
                  >
                    <circle
                      cx="64"
                      cy="64"
                      r={RING_R}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-border"
                    />
                    <circle
                      data-progress-ring
                      data-fraction={s.fraction}
                      cx="64"
                      cy="64"
                      r={RING_R}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                      className="text-primary"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={RING_CIRCUMFERENCE}
                    />
                  </svg>
                  <p
                    data-counter
                    data-target={s.value}
                    data-suffix={s.suffix}
                    className="relative text-4xl font-extrabold tabular-nums text-primary"
                  >
                    0{s.suffix}
                  </p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ) : (
              <div
                key={s.title}
                data-stat
                className="flex flex-col items-center justify-center opacity-0 sm:min-h-[11rem]"
              >
                <div
                  data-callout-inner
                  className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-border/80 bg-muted/40 px-5 py-6 text-left opacity-0 sm:max-w-none"
                >
                  <div
                    className="flex items-center gap-2 text-primary"
                    aria-hidden="true"
                  >
                    <span
                      data-callout-icon
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 opacity-0"
                    >
                      <Sparkles className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="text-muted-foreground/60">+</span>
                    <span
                      data-callout-icon
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 opacity-0"
                    >
                      <SlidersHorizontal
                        className="h-5 w-5"
                        strokeWidth={1.75}
                      />
                    </span>
                  </div>
                  <p className="text-center text-base font-semibold leading-snug text-foreground">
                    {s.title}
                  </p>
                  <p className="text-center text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
