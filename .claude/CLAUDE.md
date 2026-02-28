# CLAUDE.md — CherryFit Project Instructions

> This file provides context and rules for AI coding agents (Claude Code) working on the CherryFit project. Read this entirely before making any changes.

## Project Overview

CherryFit is a personal health management Android app that extends the Fitbit ecosystem. It provides intelligent food logging (nutrition label OCR, barcode scanning, AI food photo recognition, restaurant search, manual entry), workout tracking with progressive overload charts, blood test PDF parsing, and AI-powered health insights.

**Developer:** Sam (solo developer)
**Status:** MVP in development, phased rollout (see Implementation Plan)
**Language:** TypeScript everywhere, English-only UI

## Repository Structure

```
cherryfit/
├── apps/
│   ├── mobile/                # React Native (Expo) app
│   │   ├── app/               # Expo Router file-based routes
│   │   │   ├── (tabs)/        # Tab navigation group
│   │   │   │   ├── index.tsx          # Home (Daily Dashboard)
│   │   │   │   ├── trends.tsx         # Trends & Charts
│   │   │   │   ├── workouts.tsx       # Workout Hub
│   │   │   │   ├── insights.tsx       # AI Insights
│   │   │   │   └── profile.tsx        # Settings & Data
│   │   │   └── _layout.tsx    # Root layout
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Design system primitives (Card, Button, Text, etc.)
│   │   │   ├── food/          # Food logging components
│   │   │   ├── workout/       # Workout components
│   │   │   ├── charts/        # Chart components
│   │   │   └── dashboard/     # Dashboard-specific components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API clients, Health Connect, sync
│   │   ├── stores/            # Zustand stores
│   │   ├── theme/             # Design tokens, ThemeProvider
│   │   ├── utils/             # Helpers, formatters, constants
│   │   └── types/             # Mobile-specific types
│   └── backend/               # Fastify + tRPC server
│       └── src/
│           ├── server.ts      # Fastify entry point
│           ├── router/        # tRPC routers
│           │   ├── index.ts   # Root router
│           │   ├── food.ts
│           │   ├── workout.ts
│           │   ├── health.ts
│           │   ├── blood.ts
│           │   └── insights.ts
│           ├── db/
│           │   ├── index.ts   # Drizzle client
│           │   ├── schema.ts  # All table definitions
│           │   └── migrations/
│           ├── services/
│           │   ├── gemini.ts      # Google Gemini API wrapper
│           │   ├── fitbit.ts      # Fitbit API client
│           │   └── openfoodfacts.ts
│           └── utils/
├── packages/
│   └── shared/                # Shared types, Zod schemas, constants
│       └── src/
│           ├── types/
│           ├── schemas/       # Zod validation schemas
│           └── constants/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .eslintrc.js
├── .prettierrc
├── CLAUDE.md                  # This file
└── README.md
```

## Tech Stack

### Mobile (apps/mobile)
- **Framework:** React Native with Expo (SDK 52+)
- **Routing:** Expo Router (file-based)
- **UI:** React Native Paper or Tamagui — use whichever is installed
- **State:** Zustand (local) + React Query / TanStack Query (server)
- **Camera:** expo-camera + expo-barcode-scanner
- **Health:** react-native-health-connect
- **Charts:** Victory Native or react-native-chart-kit
- **Local DB:** WatermelonDB or expo-sqlite
- **Icons:** lucide-react-native
- **Font:** Inter (via @expo-google-fonts/inter)

### Backend (apps/backend)
- **Runtime:** Node.js + TypeScript
- **Framework:** Fastify
- **API:** tRPC (type-safe, connected to mobile via React Query)
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **AI:** Google Gemini API (gemini-2.5-flash) for vision + text
- **External APIs:** Open Food Facts (barcode), Fitbit Web API (write-back), Nutritionix (restaurants)

### Shared (packages/shared)
- Zod schemas for all API inputs/outputs
- TypeScript types shared between mobile and backend
- Constants (meal types, metric types, macro names)

### Infrastructure
- **Dev:** Local PostgreSQL via Docker Compose
- **Prod:** Hostinger VPS, Docker Compose, Caddy for SSL
- **CI:** GitHub Actions (lint, typecheck, build on every push)
- **Mobile builds:** EAS Build (Expo Application Services)

## Design System

### Colors

```typescript
export const colors = {
  bg: {
    primary: '#0D0D11',       // Main app background
    card: '#1A1A2E',          // Card surfaces
    cardElevated: '#252535',  // Modals, sheets
  },
  accent: {
    mint: '#2ECFA0',          // Primary — CTAs, progress, FAB, success
    lavender: '#B898FF',      // Secondary — workouts, insights, tags
    yellow: '#E8D44D',        // Tertiary — badges, warnings, icons
    cherry: '#D4365C',        // Brand — logo, errors, over-limit
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0B0',
    muted: '#6B6B80',
  },
  semantic: {
    success: '#2ECFA0',       // Same as mint
    warning: '#E8D44D',       // Same as yellow
    danger: '#D4365C',        // Same as cherry
  },
  border: '#2A2A3E',
} as const;
```

### Typography

Font: **Inter** (all weights from Google Fonts)

```typescript
export const typography = {
  display:  { fontFamily: 'Inter_700Bold',    fontSize: 40 },  // Big dashboard numbers
  h1:       { fontFamily: 'Inter_600SemiBold', fontSize: 24 },  // Screen titles
  h2:       { fontFamily: 'Inter_600SemiBold', fontSize: 18 },  // Card titles
  body:     { fontFamily: 'Inter_400Regular',  fontSize: 16 },  // General text
  caption:  { fontFamily: 'Inter_500Medium',   fontSize: 13 },  // Labels, timestamps
  overline: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase' },
} as const;
```

### Spacing & Radius

```typescript
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius  = { sm: 8, md: 12, lg: 16, xl: 20 } as const;
```

### Design Principles

- **Dark mode only** — no light theme for v1
- **Color-blocked accent cards** for key data (mint for nutrition, lavender for workouts, yellow for badges)
- **Generous border radius** (16–20px on main cards)
- **Lucide icons** — 1.5px stroke for default, 2px for active states
- **High contrast** — bright accents on deep dark surfaces
- **Large touch targets** — minimum 48dp, especially for gym use
- **Display-weight numbers** — big bold numbers for calories, weights, step counts

## Git Workflow — STRICT RULES

### Branch Naming
- Features: `feat/name-of-the-task`
- Bug fixes: `fix/description`
- Chores: `chore/description`

### Before Every Commit — MANDATORY CHECKLIST
1. `pnpm lint` — MUST pass with **zero warnings, zero errors**
2. `pnpm typecheck` — MUST pass with **zero warnings, zero errors**
3. `pnpm build` — MUST succeed (backend build; expo type check for mobile)
4. Then: `git add .` + `git commit` with conventional commit message

### Conventional Commits
- `feat: add nutrition label OCR camera screen`
- `fix: resolve keyboard overlap on manual entry form`
- `chore: update expo SDK to 52`
- `docs: add API documentation`
- `refactor: extract macro calculation to shared utils`
- `test: add unit tests for calorie estimation`
- `style: format with prettier`

### NEVER Do Without Sam's Approval
- `git push` (any branch, any remote)
- Deploy to production
- Create or modify cloud resources
- Submit to app stores
- Add, change, or expose API keys or secrets
- Make irreversible data changes (DROP TABLE, delete production data)

### After Completing a Task
Always present Sam with:
```
🍒 READY FOR REVIEW — [Task Name]

What changed:
- [Summary of changes]

Files added/modified:
- [list]

Checks:
- ✅ Lint: passed (0 warnings, 0 errors)
- ✅ Typecheck: passed
- ✅ Build: passed

Next step: Please review and `git push -u origin feat/branch-name`
```

## Code Conventions

### TypeScript
- Strict mode everywhere (`"strict": true` in tsconfig)
- No `any` — use `unknown` and narrow, or define proper types
- Prefer `interface` for object shapes, `type` for unions/intersections
- All function parameters and return types explicitly typed
- Use Zod schemas from `packages/shared` for runtime validation

### React Native
- Functional components only, no class components
- Hooks for all state and effects
- Prefer small, focused components (max ~150 lines)
- Co-locate styles with components using StyleSheet.create
- Use the theme tokens from `theme/` — never hardcode colors or sizes
- All text must use the `<Text>` component from the UI library or a themed wrapper — never raw React Native `<Text>` with inline styles

### File Naming
- Components: `PascalCase.tsx` (e.g., `MacroRing.tsx`, `MealCard.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useFoodLogs.ts`)
- Utils: `camelCase.ts` (e.g., `calculateMacros.ts`)
- Types: `camelCase.ts` (e.g., `foodTypes.ts`)
- Stores: `camelCase.ts` prefixed with `use` (e.g., `useFoodStore.ts`)

### Backend
- All routes defined as tRPC procedures
- Business logic in `services/`, not in route handlers
- Database access only through Drizzle ORM — no raw SQL unless absolutely necessary
- All external API calls wrapped in service classes with error handling
- Environment variables accessed through a validated config object (never `process.env` directly in business logic)

### Error Handling
- Backend: tRPC error codes (BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR)
- Mobile: React Query error states, user-friendly error messages
- AI calls: always wrap in try/catch, provide fallback behavior
- Never swallow errors silently — log them at minimum

### Testing
- Tests go in `__tests__/` directories adjacent to the code they test
- Name: `[filename].test.ts(x)`
- Focus on: utility functions, Zod schema validation, data transformations
- E2E testing can wait for later — prioritize shipping

## Database Schema

All tables have `id` (UUID, primary key), `created_at`, `updated_at`.
All tables have `user_id` (UUID FK) for future multi-user support.
Single default user for v1 — create a seed user on first migration.

### Key Tables
- `food_logs` — every food entry (source: label_scan | barcode | photo_ai | restaurant | manual | quick_log)
- `food_database` — personal food cache (barcode lookups, label scans, favorites)
- `workout_templates` — saved workout plans (exercises as JSONB)
- `workout_sessions` — completed workout instances
- `workout_sets` — individual sets within sessions
- `blood_tests` — uploaded blood test PDFs with parsed results (JSONB)
- `health_metrics` — data from Health Connect (steps, sleep, HR, etc.)
- `ai_insights` — generated AI observations
- `daily_goals` — user's macro and calorie targets

See the Technical Design Document (Section 6) for full column specifications.

## Gemini API Usage Patterns

### Nutrition Label OCR
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
    { text: `Extract all nutrition information from this food label.
Return ONLY valid JSON (no markdown, no backticks):
{
  "food_name": "string",
  "serving_size": "string",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number | null,
  "sugar_g": number | null,
  "sodium_mg": number | null
}
If a value is not visible on the label, use null.` }
  ],
});
```

### AI Food Photo
```typescript
// Similar pattern but with different prompt asking to identify foods and estimate portions
// Always include confidence levels in the response schema
// Always return an array (multiple food items possible)
```

### Blood Test Parsing
```typescript
// Send PDF as document type
// Prompt asks for structured extraction of lab values with reference ranges
// Return array of { marker_name, value, unit, reference_range_low, reference_range_high, is_within_range }
```

### AI Insights
```typescript
// Send aggregated health data as JSON in the prompt
// Ask for 3-5 specific, actionable insights referencing actual numbers
// Include disclaimer requirement in prompt
// Categories: nutrition, recovery, trend_alert, goal_progress, blood_test
```

**Important:** Always strip PII before sending to Gemini API. No names, emails, or account IDs.

## SAM Action Required — Reminder Format

When a task requires Sam's manual action, always use this format:

```
🍒 SAM ACTION REQUIRED — [Title]

What: [Brief description]
Why: [Why it's needed now]

Steps:
1. [Exact step with commands or URLs]
2. [Next step]
3. ...

After you're done: [What to tell the agent to continue]
```

Common triggers for SAM ACTION:
- Feature branch ready for review → ask Sam to review and push
- Environment variables needed → list exact var names and where to get them
- External API registration → step-by-step guide
- Deployment checkpoint → full deployment commands
- OAuth flow → URL to visit, permissions to grant
- Play Store submission → build command, console steps

## Implementation Phases

The project is built in 5 phases (0–4). Always work within the current phase — do not jump ahead.

### Phase 0: Project Bootstrap
Tasks 0.1–0.6: Repo setup, Expo scaffold, Fastify scaffold, shared package, CI, EAS config

### Phase 1: Core Food Logging MVP
Tasks 1.1–1.9: Local DB, dashboard, FAB, manual entry, label OCR, quick log, goals, sync, polish

### Phase 2: Wearable Integration + Barcode
Tasks 2.1–2.6: Health Connect, Fitbit cards, Fitbit write-back, barcode scanning, trend charts, polish

### Phase 3: Workouts + AI Food Photos
Tasks 3.1–3.7: Exercise DB, templates, active session, overload charts, AI photos, restaurant search, polish

### Phase 4: Blood Tests + AI Insights
Tasks 4.1–4.5: Blood test upload, blood test charts, AI insights engine, data export, v1.0.0 prep

See the Implementation Plan document for full task details, dependencies, and hour estimates.

## Quick Reference

| Need | Command |
|------|---------|
| Install deps | `pnpm install` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Build backend | `pnpm build:backend` |
| Dev backend | `cd apps/backend && pnpm dev` |
| Dev mobile | `cd apps/mobile && npx expo start` |
| DB migrate | `cd apps/backend && pnpm db:migrate` |
| DB generate | `cd apps/backend && pnpm db:generate` |
| Build APK | `eas build --platform android --profile preview` |
| Production build | `eas build --platform android --profile production` |
| Docker up | `docker compose up -d` |
| Docker rebuild | `docker compose up -d --build` |

## Important Reminders

1. **Always run lint + typecheck before committing.** Zero warnings, zero errors. No exceptions.
2. **Never push to remote.** Only Sam pushes after review.
3. **Use the design system tokens.** Never hardcode colors, font sizes, or spacing values.
4. **Offline-first.** All features should work without network. Sync when available.
5. **Type safety end-to-end.** tRPC + Zod + TypeScript strict = no runtime type surprises.
6. **Keep components small.** If a file exceeds ~150 lines, extract sub-components.
7. **Cache AI results.** Label OCR and barcode lookups should only hit the API once per unique food.
8. **Health disclaimer.** Any screen showing AI analysis or blood test data must include "Not medical advice" disclaimer.
9. **Inter font everywhere.** No system fonts in the UI.
10. **Dark mode only.** Background is `#0D0D11`. Cards are `#1A1A2E`. Always.
