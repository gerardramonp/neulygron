"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";

/**
 * Steps shown sequentially during classification.
 * Each step has a translation key and the elapsed-time threshold (in seconds)
 * at which it becomes active.
 */
const STEPS = [
  { key: "parsingPdf", startsAt: 0 },
  { key: "extractingExpenses", startsAt: 15 },
  { key: "feedingCategories", startsAt: 35 },
  { key: "assigningExpenses", startsAt: 60 },
  { key: "searchingUncategorized", startsAt: 90 },
  { key: "finishingUp", startsAt: 120 },
] as const;

/** Target duration the progress bar is tuned around (in seconds). */
const TARGET_DURATION = 150;

/**
 * Asymptotic progress: fast at first, logarithmically slows down,
 * never reaches 100% on its own.
 * At TARGET_DURATION seconds it sits around 92%.
 */
function getProgress(elapsedSeconds: number): number {
  // 1 - e^(-t/k) gives an asymptotic curve approaching 1.
  // k controls speed: smaller = faster start. 60 feels natural for ~2.5min.
  const k = 60;
  const raw = 1 - Math.exp(-elapsedSeconds / k);
  // Cap at 95% so it never looks "done" prematurely
  return Math.min(raw * 100, 95);
}

function getCurrentStepIndex(elapsedSeconds: number): number {
  let index = 0;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (elapsedSeconds >= STEPS[i].startsAt) {
      index = i;
      break;
    }
  }
  return index;
}

export function ClassificationProgress() {
  const t = useTranslations("ClassificationProgress");
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const seconds = (Date.now() - startTimeRef.current) / 1000;
      setElapsed(seconds);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const progress = getProgress(elapsed);
  const stepIndex = getCurrentStepIndex(elapsed);
  const stepKey = STEPS[stepIndex].key;

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card/40 p-6">
      <p className="text-sm text-muted-foreground">{t("notice")}</p>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step message */}
      <p className="text-sm font-medium text-foreground animate-in fade-in duration-300">
        {t(`steps.${stepKey}`)}
      </p>
    </div>
  );
}
