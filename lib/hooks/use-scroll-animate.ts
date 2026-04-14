"use client";

import { useEffect, useRef } from "react";

function revealAll(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>(".opacity-0").forEach((child) => {
    child.classList.remove("opacity-0");
  });
  container.classList.remove("opacity-0");
}

export function useScrollAnimate(
  callback: (el: HTMLElement) => void,
  options?: { threshold?: number; once?: boolean },
) {
  const ref = useRef<HTMLDivElement>(null);
  const hasFired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      revealAll(el);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (options?.once !== false && hasFired.current) return;
        hasFired.current = true;
        callback(el);
        if (options?.once !== false) observer.disconnect();
      },
      { threshold: options?.threshold ?? 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [callback, options?.threshold, options?.once]);

  return ref;
}
