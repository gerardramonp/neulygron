"use client";

import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let initialized = false;

export const MIXPANEL_EVENTS = {
  USER_SIGNED_UP: "User Signed Up",
  USER_SIGNED_IN: "User Signed In",
  USER_SIGNED_OUT: "User Signed Out",
  PDF_SELECTED: "PDF Selected",
  CLASSIFICATION_STARTED: "Classification Started",
  CLASSIFICATION_COMPLETED: "Classification Completed",
  CLASSIFICATION_FAILED: "Classification Failed",
  EXPENSE_ASSIGNED: "Expense Assigned",
  EXPENSE_REASSIGNED: "Expense Reassigned",
  REPORT_EXPENSE_REASSIGNED: "Report Expense Reassigned",
  MONTHLY_REPORT_SAVED: "Monthly Report Saved",
  MONTHLY_REPORT_VIEWED: "Monthly Report Viewed",
  YEARLY_REPORT_VIEWED: "Yearly Report Viewed",
  CATEGORY_CREATED: "Category Created",
  CATEGORY_UPDATED: "Category Updated",
  CATEGORY_DELETED: "Category Deleted",
  CATEGORIES_REORDERED: "Categories Reordered",
  CONCEPT_ADDED: "Concept Added",
  CHART_TYPE_TOGGLED: "Chart Type Toggled",
  PAGE_VIEWED: "Page Viewed",
} as const;

export type MixpanelEventName =
  (typeof MIXPANEL_EVENTS)[keyof typeof MIXPANEL_EVENTS];

export function initMixpanel(): void {
  if (typeof window === "undefined" || !MIXPANEL_TOKEN) return;
  if (initialized) return;
  initialized = true;
  mixpanel.init(MIXPANEL_TOKEN, {
    track_pageview: false,
    persistence: "localStorage",
    api_host: "https://api-eu.mixpanel.com",
  });
}

export function identifyUser(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !MIXPANEL_TOKEN) return;
  initMixpanel();
  mixpanel.identify(userId);
  if (traits && Object.keys(traits).length > 0) {
    mixpanel.people.set(traits);
  }
}

export function trackEvent(
  event: MixpanelEventName,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !MIXPANEL_TOKEN) return;
  initMixpanel();
  mixpanel.track(event, properties);
}

export function resetUser(): void {
  if (typeof window === "undefined" || !MIXPANEL_TOKEN) return;
  mixpanel.reset();
  initialized = false;
}

export function incrementPeople(property: string, by = 1): void {
  if (typeof window === "undefined" || !MIXPANEL_TOKEN) return;
  initMixpanel();
  mixpanel.people.increment(property, by);
}
