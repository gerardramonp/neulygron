"use client";

import { useCallback } from "react";
import { animate, stagger } from "animejs";
import { FileUp, Brain, CheckCircle } from "lucide-react";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";

const steps = [
  {
    icon: FileUp,
    title: "Upload PDF",
    description:
      "Drop your bank statement or invoice — any standard PDF works.",
  },
  {
    icon: Brain,
    title: "AI Classifies",
    description:
      "Our AI extracts every expense and maps it to your custom categories.",
  },
  {
    icon: CheckCircle,
    title: "Review & Save",
    description:
      "Drag-and-drop to adjust, then save a clean monthly report instantly.",
  },
];

export default function HowItWorksSection() {
  const animateCards = useCallback((el: HTMLElement) => {
    animate(el.querySelectorAll("[data-step]"), {
      opacity: [0, 1],
      translateY: [40, 0],
      delay: stagger(150),
      duration: 700,
      ease: "outExpo",
    });

    animate(el.querySelectorAll("[data-connector]"), {
      scaleX: [0, 1],
      delay: stagger(150, { start: 300 }),
      duration: 500,
      ease: "outExpo",
    });
  }, []);

  const ref = useScrollAnimate(animateCards);

  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-5xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            How It Works
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Three steps to clarity
          </h2>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3 md:gap-0">
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              {i < steps.length - 1 && (
                <div
                  data-connector
                  className="absolute top-10 left-[60%] hidden h-px w-[80%] origin-left scale-x-0 bg-border md:block"
                />
              )}
              <div
                data-step
                className="flex flex-col items-center gap-4 opacity-0"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="h-9 w-9" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Step {i + 1}
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
