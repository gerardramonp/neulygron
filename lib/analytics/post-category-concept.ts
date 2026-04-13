"use client";

import { MIXPANEL_EVENTS, trackEvent } from "./mixpanel";

export function postCategoryConcept(
  categoryId: string,
  concept: string,
  categoryName: string,
) {
  fetch(`/api/categories/${categoryId}/concepts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept }),
  })
    .then((res) => {
      if (res.ok) {
        trackEvent(MIXPANEL_EVENTS.CONCEPT_ADDED, {
          categoryName,
          concept,
        });
      }
    })
    .catch(() => {});
}
