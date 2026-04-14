"use client";

import { useCallback } from "react";
import { stagger, createTimeline, createDrawable } from "animejs";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";
import SectionHeader from "./SectionHeader";

const steps = [
  {
    title: "Upload PDF",
    description:
      "Drop your bank statement or invoice — any standard PDF works.",
    iconPath: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 2v6h6 M12 18v-6 M9 15l3-3 3 3",
  },
  {
    title: "AI Classifies",
    description:
      "Our AI extracts every expense and maps it to your custom categories.",
    iconPath: "M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22 M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93 M19 10c.58 1.12.92 2.42.92 3.79C19.92 18.26 16.37 22 12 22c-4.37 0-7.92-3.74-7.92-8.21 0-1.37.34-2.67.92-3.79",
  },
  {
    title: "Review & Save",
    description:
      "Drag-and-drop to adjust, then save a clean monthly report instantly.",
    iconPath: "M20 6 9 17l-5-5",
  },
];

export default function HowItWorksSection() {
  const animateCards = useCallback((el: HTMLElement) => {
    const tl = createTimeline({ defaults: { ease: "outExpo" } });

    tl.add(el.querySelectorAll("[data-step]"), {
      opacity: [0, 1],
      translateY: [50, 0],
      scale: [0.9, 1],
      delay: stagger(180),
      duration: 800,
    }, 0);

    const rings = el.querySelectorAll<SVGCircleElement>("[data-ring]");
    rings.forEach((ring) => {
      const drawable = createDrawable(ring);
      tl.add(drawable, {
        draw: ["0 0", "0 1"],
        duration: 700,
        ease: "outQuart",
      }, 200);
    });

    const icons = el.querySelectorAll<SVGPathElement>("[data-icon-path]");
    icons.forEach((path) => {
      const drawable = createDrawable(path);
      tl.add(drawable, {
        draw: ["0 0", "0 1"],
        duration: 600,
        ease: "outQuart",
      }, 500);
    });

    tl.add(el.querySelectorAll("[data-connector]"), {
      scaleX: [0, 1],
      delay: stagger(150),
      duration: 600,
      ease: "outQuart",
    }, 400);

    tl.add(el.querySelectorAll("[data-step-num]"), {
      opacity: [0, 1],
      scale: [0.5, 1],
      delay: stagger(180),
      duration: 400,
    }, 600);
  }, []);

  const ref = useScrollAnimate(animateCards, { threshold: 0.1 });

  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <SectionHeader tag="How It Works" title="Three steps to clarity" />
      <div ref={ref} className="mx-auto max-w-5xl px-6">
        <div className="relative grid gap-10 md:grid-cols-3 md:gap-0">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center"
            >
              {i < steps.length - 1 && (
                <div
                  data-connector
                  className="absolute top-12 left-[60%] hidden h-px w-[80%] origin-left scale-x-0 md:block"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, var(--color-border) 0, var(--color-border) 6px, transparent 6px, transparent 12px)",
                  }}
                />
              )}
              <div
                data-step
                className="flex flex-col items-center gap-4 opacity-0"
              >
                <div className="relative flex h-24 w-24 items-center justify-center">
                  {/* Animated ring */}
                  <svg
                    className="absolute inset-0 h-full w-full -rotate-90"
                    viewBox="0 0 96 96"
                  >
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-border"
                    />
                    <circle
                      data-ring
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="text-primary"
                    />
                  </svg>
                  {/* Stroke-draw icon */}
                  <svg
                    className="relative h-10 w-10 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      data-icon-path
                      d={step.iconPath}
                      stroke="currentColor"
                    />
                  </svg>
                </div>
                <span
                  data-step-num
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground opacity-0"
                >
                  {i + 1}
                </span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
