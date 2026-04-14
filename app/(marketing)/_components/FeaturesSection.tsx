"use client";

import { useCallback } from "react";
import { animate, stagger } from "animejs";
import {
  FileText,
  Sparkles,
  Lightbulb,
  BarChart3,
  TrendingUp,
  GripVertical,
} from "lucide-react";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";

const features = [
  {
    icon: FileText,
    title: "Smart PDF Reading",
    description:
      "Extracts individual expense line items from any bank statement or invoice PDF.",
  },
  {
    icon: Sparkles,
    title: "AI Categorization",
    description:
      "Maps every expense to your custom categories using advanced language models.",
  },
  {
    icon: Lightbulb,
    title: "Learns From You",
    description:
      "Category concepts improve over time — the more you use it, the smarter it gets.",
  },
  {
    icon: BarChart3,
    title: "Monthly Reports",
    description:
      "Visual breakdowns of where your money goes each month, saved as snapshots.",
  },
  {
    icon: TrendingUp,
    title: "Yearly Trends",
    description:
      "Track spending patterns across months and spot opportunities to save.",
  },
  {
    icon: GripVertical,
    title: "Drag & Drop",
    description:
      "Easily reassign any expense between categories before saving your report.",
  },
];

export default function FeaturesSection() {
  const animateCards = useCallback((el: HTMLElement) => {
    animate(el.querySelectorAll("[data-feature]"), {
      opacity: [0, 1],
      translateY: [32, 0],
      delay: stagger(100),
      duration: 600,
      ease: "outExpo",
    });
  }, []);

  const ref = useScrollAnimate(animateCards, { threshold: 0.08 });

  return (
    <section className="bg-muted/30 py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything you need to manage expenses
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              data-feature
              className="group rounded-2xl border border-border/50 bg-card/70 p-6 opacity-0 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
