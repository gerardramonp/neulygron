# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test:classify    # Test AI classification consistency
npm run test:extraction  # Test AI extraction consistency
```

To run a single test script manually:
```bash
npx tsx scripts/test-classify-consistency.ts
```

## What This App Does

NeuLygron is an AI-powered expense classification system. Users upload PDF bank statements/invoices, AI extracts individual expenses, AI classifies them into user-defined categories, and users can review/correct classifications before saving monthly reports.

## Architecture

**Stack:** Next.js App Router, TypeScript, MongoDB (Mongoose), NextAuth, Vercel AI SDK + OpenAI, Zod, Tailwind + Radix UI, next-intl (EN/ES)

**Core Pipeline:**
1. PDF upload → `lib/pdf.ts` (unpdf) → text extraction
2. Text → `lib/services/expense-classifier.ts` → OpenAI (gpt-4o-mini) extracts expense lines
3. Expense lines + user categories → OpenAI (gpt-5-nano) classifies each expense into a category
4. User reviews in UI, can reassign categories via drag-and-drop (@dnd-kit)
5. POST `/api/expenses/monthly-report` saves snapshot to MongoDB

**Key Layers:**
- `app/api/` — Next.js route handlers (auth, categories, expenses)
- `lib/models/` — Mongoose schemas (User, Category, MonthlyExpenseReport)
- `lib/validation/` — Zod schemas matching each API route's input
- `lib/services/` — AI logic (expense-classifier.ts)
- `components/expenses/` — Classification review UI
- `app/config/` — Category management UI

**DB Models:**
- **User** — email/password + Google OAuth; password field has `select: false`
- **Category** — belongs to user, has `position` (ordering) and `concepts` (example keywords fed to AI for better classification)
- **MonthlyExpenseReport** — snapshot keyed by `{ userId, yearMonth }` (unique); categories embed expenses as nested arrays with `_id: false`

**Auth:** NextAuth JWT sessions. All API routes check `getServerSession(authOptions)` and return 401 if missing. User ID comes from `session.user.id`.

**AI Gateway:** OpenAI calls go through Vercel AI Gateway (configured via `AI_GATEWAY` env var). See `lib/services/expense-classifier.ts` for model setup.

**i18n:** All user-facing strings use next-intl. Translation files in `messages/en.json` and `messages/es.json`.

## Important Conventions

- Always read `lib/models/` schemas before working with User or Category objects — schema details (required fields, indices, embedded types) affect how queries must be structured.
- Validation schemas in `lib/validation/` must stay in sync with Mongoose models in `lib/models/`.
- Category `position` field drives sort order; it must be preserved when saving reports.
- `uncategorized` array in monthly report payload must be empty (enforced by Zod `.refine()`) — all expenses must be classified before saving.
- Path alias `@/*` maps to project root.
- Use shadcn components