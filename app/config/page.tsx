"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CategoryCard from "./CategoryCard";
import type { Category } from "./types";

const CATEGORY_MOCK: Category[] = [
  {
    id: "hero",
    name: "Hero spotlight",
    description:
      "Open with a confident hero statement that explains the mission and what users should feel at first glance.",
  },
  {
    id: "pillars",
    name: "Product pillars",
    description:
      "Summarize three concise feature pillars. Focus on outcomes and why they matter for day-to-day workflows.",
  },
  {
    id: "assist",
    name: "AI assist",
    description:
      "Describe how the AI partner collaborates with teams. Highlight tone, guardrails, and onboarding steps.",
  },
  {
    id: "proof",
    name: "Proof & trust",
    description:
      "List credibility builders like testimonials, metrics, or certifications that calm any adoption doubts.",
  },
  {
    id: "onboarding",
    name: "Onboarding flow",
    description:
      "Spell out the first three steps new users take so AI can highlight a confident start-to-finish journey.",
  },
  {
    id: "personalization",
    name: "Personalization cues",
    description:
      "Describe how the product adapts to roles, preferences, or data inputs so messaging feels bespoke.",
  },
  {
    id: "pricing",
    name: "Pricing clarity",
    description:
      "Explain the pricing narrative, including tiers, value props, and any guarantees that reduce friction.",
  },
  {
    id: "compliance",
    name: "Compliance & safety",
    description:
      "Outline regulatory or security promises the AI must surface to reassure sensitive industries.",
  },
  {
    id: "integrations",
    name: "Integrations",
    description:
      "List the top ecosystem connections and why they unlock compounding value inside existing workflows.",
  },
  {
    id: "support",
    name: "Support paths",
    description:
      "Clarify how humans and AI collaborate post-launch: channels, SLAs, and escalation best practices.",
  },
  {
    id: "community",
    name: "Community signals",
    description:
      "Share meetups, forums, or ambassador programs that prove there is momentum behind the product.",
  },
  {
    id: "roadmap",
    name: "Roadmap teaser",
    description:
      "Provide a glimpse into upcoming releases so AI can frame urgency and forward-looking trust.",
  },
  {
    id: "faq",
    name: "FAQ quick hits",
    description:
      "List the top objections or questions prospects ask and the concise answers we want rendered.",
  },
  {
    id: "cta",
    name: "Closing CTA",
    description:
      "Detail the final action we want users to take and the tone (confident, warm, urgent) to apply.",
  },
];

export default function ConfigPage() {
  const [categories, setCategories] = useState<Category[]>(CATEGORY_MOCK);

  const handleCreateCategory = () => {
    console.log("Create category clicked");
  };

  const handleFieldChange = (
    id: string,
    field: "name" | "description",
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, [field]: value } : category,
      ),
    );
  };

  const handleDelete = (id: string) => {
    console.info("Deleted category", id);
  };

  const handleSave = (category: Category) => {
    console.info("Saved category", category);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-sans text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <section className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Content config
            </p>
            <h1 className="text-3xl font-bold">Category guidance</h1>
            <p className="text-muted-foreground">
              Use these descriptions to tell the AI what belongs in each section
              before generating the final layout.
            </p>
          </section>

          <Button className="w-full md:w-auto" onClick={handleCreateCategory}>
            Create category
          </Button>
        </div>

        <Separator className="opacity-60" />

        <div className="grid gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onFieldChange={(field, value) =>
                handleFieldChange(category.id, field, value)
              }
              onDelete={() => handleDelete(category.id)}
              onSave={() => handleSave(category)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
