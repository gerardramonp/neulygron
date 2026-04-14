"use client";

import { useCallback } from "react";
import { animate, stagger } from "animejs";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";

const stats = [
  { value: 30, suffix: "s", label: "Average classification time" },
  { value: 95, suffix: "%", label: "Accuracy with custom categories" },
  { value: 2, suffix: "", label: "Languages supported" },
];

export default function StatsSection() {
  const animateCounters = useCallback((el: HTMLElement) => {
    const counters = el.querySelectorAll<HTMLElement>("[data-counter]");
    counters.forEach((counter) => {
      const target = Number(counter.dataset.target);
      const suffix = counter.dataset.suffix ?? "";
      const obj = { val: 0 };
      animate(obj, {
        val: target,
        duration: 1200,
        ease: "outExpo",
        onUpdate: () => {
          counter.textContent = `${Math.round(obj.val)}${suffix}`;
        },
      });
    });

    animate(el.querySelectorAll("[data-stat]"), {
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(120),
      duration: 600,
      ease: "outExpo",
    });
  }, []);

  const ref = useScrollAnimate(animateCounters);

  return (
    <section className="py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-4xl px-6">
        <div className="grid gap-12 text-center sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} data-stat className="space-y-2 opacity-0">
              <p
                data-counter
                data-target={s.value}
                data-suffix={s.suffix}
                className="text-5xl font-extrabold tabular-nums text-primary"
              >
                0{s.suffix}
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
