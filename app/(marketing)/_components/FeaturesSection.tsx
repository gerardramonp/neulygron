"use client";

import { useCallback } from "react";
import { stagger, createTimeline } from "animejs";
import {
  FileText,
  Sparkles,
  Lightbulb,
  BarChart3,
  TrendingUp,
  GripVertical,
} from "lucide-react";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";
import SectionHeader from "./SectionHeader";

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
    const cards = el.querySelectorAll("[data-feature]");
    const tl = createTimeline({ defaults: { ease: "outExpo" } });

    tl.add(cards, {
      opacity: [0, 1],
      translateY: [40, 0],
      scale: [0.88, 1],
      rotate: ["-2deg", "0deg"],
      delay: stagger(90, { grid: [3, 2], from: "center" }),
      duration: 700,
    }, 0);

    tl.add(el.querySelectorAll("[data-icon-bg]"), {
      scale: [0, 1],
      rotate: ["-90deg", "0deg"],
      delay: stagger(90, { grid: [3, 2], from: "center" }),
      duration: 500,
    }, 200);
  }, []);

  const ref = useScrollAnimate(animateCards, { threshold: 0.06 });

  return (
    <section className="bg-muted/30 py-24 md:py-32">
      <SectionHeader
        tag="Features"
        title="Everything you need to manage expenses"
      />
      <div ref={ref} className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              data-feature
              className="group rounded-2xl border border-border/50 bg-card/70 p-6 opacity-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                data-icon-bg
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              >
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
