# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 App Router application in TypeScript. Web pages live in `app/`, reusable UI in `components/`, and hooks in `hooks/`. HTTP handlers stay thin in `app/api/`; server-only authentication and AI providers belong in `server/`. Shared request schemas and response types live in `contracts/`. Browser-safe utilities stay in `lib/`, database types in `types/`, and Supabase changes in `supabase/migrations/`. See `ARCHITECTURE.md` before changing these boundaries.

## Build, Test, and Development Commands

- `npm ci` installs the exact dependency versions from `package-lock.json`.
- `npm run dev` starts the local Next.js server on port `4001`.
- `npm run build` creates a production build and catches integration errors.
- `npm run start` serves the production build.
- `npm run lint` runs the configured lint command; resolve warnings before submitting changes.
- `npm run typecheck` performs a standalone strict type check.
- `npm run check` runs lint, type checking, and the production build in sequence.

Live AI-provider checks require private credentials, may incur charges, and are never part of the default offline verification.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes in TypeScript, and functional components. Name components in PascalCase (`QuestionCard.tsx`), hooks with a `use` prefix (`useQuestions.ts`), and helpers in kebab-case or descriptive lowercase modules. Follow App Router filenames such as `page.tsx`, `layout.tsx`, and `route.ts`. Prefer the `@/` alias over long relative imports. Mark client-only code with `'use client'`, validate input with schemas from `contracts/`, and never import `@/server/*` from UI code.

## Testing Guidelines

No automated test runner or coverage threshold is currently configured. For every change, run `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Manually exercise affected pages and API routes; for UI changes, include desktop and mobile screenshots. Never make live-provider smoke tests part of an offline verification claim.

## Commit & Pull Request Guidelines

Use short, imperative commit summaries such as `Fix draft save status` or `Document Supabase setup`. Keep commits focused. Pull requests should explain the problem and solution, list verification performed, link relevant issues, note migrations or environment changes, and include screenshots for visible UI work.

## Security & Configuration

Copy `.env.example` to `.env.local` and keep Supabase and AI-provider secrets out of Git. Never expose service-role keys through `NEXT_PUBLIC_*` variables or log credentials, tokens, or uploaded student content.
