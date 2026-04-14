"use client";

import { useCallback } from "react";
import { createTimeline } from "animejs";
import { useScrollAnimate } from "@/lib/hooks/use-scroll-animate";

interface SectionHeaderProps {
  tag: string;
  title: string;
}

export default function SectionHeader({ tag, title }: SectionHeaderProps) {
  const animateHeader = useCallback((el: HTMLElement) => {
    const tl = createTimeline({ defaults: { ease: "outExpo" } });

    const tagEl = el.querySelector("[data-tag]");
    if (tagEl) {
      tl.add(tagEl, {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 500,
      }, 0);
    }

    const titleEl = el.querySelector("[data-title]");
    if (titleEl) {
      tl.add(titleEl, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
      }, 100);
    }

    const line = el.querySelector("[data-underline]");
    if (line) {
      tl.add(line, {
        scaleX: [0, 1],
        duration: 700,
        ease: "outQuart",
      }, 250);
    }
  }, []);

  const ref = useScrollAnimate(animateHeader, { threshold: 0.5 });

  return (
    <div ref={ref} className="mb-16 text-center">
      <p
        data-tag
        className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary opacity-0"
      >
        {tag}
      </p>
      <h2
        data-title
        className="text-3xl font-bold opacity-0 sm:text-4xl"
      >
        {title}
      </h2>
      <div
        data-underline
        className="mx-auto mt-4 h-0.5 w-16 origin-center scale-x-0 rounded-full bg-primary/40"
      />
    </div>
  );
}
