# 🍒 CherryFit — Implementation Plan

**The step-by-step build roadmap from zero to v1.0.0**

Version 1.0 · February 2026 · Companion to the Technical Design Document

---

## How to Read This Plan

Each task follows this format:

- **Branch:** The git branch name (per workflow rules)
- **Depends on:** Tasks that must be completed first
- **Estimated hours:** Development time (assuming AI coding tools like Claude Code)
- **Acceptance criteria:** What "done" looks like
- **🍒 SAM ACTION:** Steps requiring Sam's manual input

Tasks are ordered within each phase by dependency — build them top to bottom.

### Time Estimates

Estimates assume heavy use of AI coding tools (Claude Code, etc.) which significantly accelerates boilerplate, config, and routine code. Total estimated hours per phase:

| Phase | Focus | Estimated Hours | Calendar Weeks |
|-------|-------|----------------|----------------|
| Phase 1 | Core Food Logging MVP | 80–100 hrs | Weeks 1–4 |
| Phase 2 | Wearable Integration + Barcode | 50–65 hrs | Weeks 5–7 |
| Phase 3 | Workouts + AI Food Photos | 55–70 hrs | Weeks 8–10 |
| Phase 4 | Blood Tests + AI Insights | 40–55 hrs | Weeks 11–12+ |
| **Total** | | **225–290 hrs** | **~12 weeks** |

---

## Phase 0: Project Bootstrap

> Before any feature work begins, the project needs its foundation: repo, tooling, CI, and base configuration.

---

### Task 0.1 — Repository and Monorepo Setup

**Branch:** `feat/project-bootstrap`
**Depends on:** Nothing
**Estimated hours:** 3–4

**What to build:**
- Set up pnpm workspace monorepo structure:
  ```
  cherryfit/
  ├── apps/
  │   ├── mobile/          # React Native (Expo)
  │   └── backend/         # Fastify + tRPC
  ├── packages/
  │   └── shared/          # Shared types, constants, validation schemas
  ├── .github/
  │   └── workflows/
  │       └── ci.yml
  ├── pnpm-workspace.yaml
  ├── package.json
  ├── tsconfig.base.json
  ├── .eslintrc.js
  ├── .prettierrc
  ├── .gitignore
  └── README.md
  ```
- Configure TypeScript with strict mode across all packages
- Configure ESLint + Prettier with shared config
- Add `pnpm lint`, `pnpm typecheck`, and `pnpm build` root scripts
- Add `.nvmrc` with Node.js version

**Acceptance criteria:**
- `pnpm install` succeeds
- `pnpm lint` passes with zero warnings/errors
- `pnpm typecheck` passes clean
- Monorepo structure in place with all three packages

---

### Task 0.2 — Expo Mobile App Scaffold

**Branch:** `feat/project-bootstrap` (continue)
**Depends on:** 0.1
**Estimated hours:** 3–4

**What to build:**
- Initialize Expo app in `apps/mobile/` with TypeScript template
- Install and configure Expo Router (file-based routing)
- Set up the tab navigation structure (5 tabs: Home, Trends, Workouts, Insights, Profile)
- Create placeholder screens for each tab
- Configure app.json / app.config.ts with:
  - App name: "CherryFit"
  - Package name: `com.cherryfit.app` (or `dev.cherryfit.app`)
  - Android adaptive icon placeholder
  - Splash screen with dark background
- Install Inter font via `expo-font` or `@expo-google-fonts/inter`
- Set up the dark theme with design tokens from the design doc:
  - Create `theme.ts` with all color tokens, spacing, radius, typography scales
  - Create a `ThemeProvider` wrapper
- Install Lucide React Native for icons

**Acceptance criteria:**
- `npx expo start` launches the app
- Tab navigation works across all 5 screens
- Dark theme applied globally (bg `#0D0D11`, cards `#1A1A2E`)
- Inter font loads and renders
- Lucide icons render in tab bar

---

### Task 0.3 — Fastify Backend Scaffold

**Branch:** `feat/project-bootstrap` (continue)
**Depends on:** 0.1
**Estimated hours:** 3–4

**What to build:**
- Initialize Fastify app in `apps/backend/` with TypeScript
- Set up tRPC with Fastify adapter
- Create router structure matching the API design:
  ```
  apps/backend/src/
  ├── server.ts
  ├── router/
  │   ├── index.ts          # Root router combining all sub-routers
  │   ├── food.ts
  │   ├── workout.ts
  │   ├── health.ts
  │   ├── blood.ts
  │   └── insights.ts
  ├── db/
  │   ├── index.ts          # Drizzle client
  │   ├── schema.ts         # All table definitions
  │   └── migrations/
  ├── services/
  │   ├── claude.ts          # Anthropic API wrapper
  │   ├── fitbit.ts          # Fitbit API client
  │   └── openfoodfacts.ts   # Barcode lookup
  └── utils/
  ```
- Set up Drizzle ORM with PostgreSQL connection
- Create initial schema with all tables from the design doc
- Add health check endpoint: `GET /health`
- Add `.env.example` with all required variables
- Create `Dockerfile` and `docker-compose.yml`
- Add `pnpm db:migrate` and `pnpm db:generate` scripts

**Acceptance criteria:**
- `pnpm dev` starts the server
- `curl localhost:3000/health` returns 200
- tRPC playground or test client connects successfully
- Docker Compose starts both API and PostgreSQL
- Drizzle migration generates and applies cleanly

---

### Task 0.4 — Shared Package and tRPC Client

**Branch:** `feat/project-bootstrap` (continue)
**Depends on:** 0.2, 0.3
**Estimated hours:** 2–3

**What to build:**
- Create shared types in `packages/shared/`:
  - Food log types (macros, meal types, sources)
  - Workout types (templates, sessions, sets)
  - Health metric types
  - API input/output schemas using Zod
- Set up tRPC client in the mobile app
- Configure React Query provider
- Create a base API hook that connects mobile ↔ backend
- Test end-to-end: mobile app calls backend health check via tRPC

**Acceptance criteria:**
- Mobile app successfully calls backend via tRPC
- Shared types are imported in both mobile and backend
- Zod schemas validate on both sides
- `pnpm typecheck` passes across the entire monorepo

---

### Task 0.5 — GitHub Actions CI Pipeline

**Branch:** `feat/project-bootstrap` (continue)
**Depends on:** 0.1
**Estimated hours:** 2

**What to build:**
- Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on:
    push:
      branches: ['**']
    pull_request:
      branches: [main]
  jobs:
    lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
        - run: pnpm install --frozen-lockfile
        - run: pnpm lint
    typecheck:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
        - run: pnpm install --frozen-lockfile
        - run: pnpm typecheck
    build-backend:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
        - run: pnpm install --frozen-lockfile
        - run: pnpm build:backend
    expo-doctor:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
        - run: pnpm install --frozen-lockfile
        - run: cd apps/mobile && npx expo-doctor
  ```
- Add `pnpm audit` as a non-blocking job

**Acceptance criteria:**
- Push to any branch triggers CI
- All 4 jobs pass on a clean repo
- Failed lint or typecheck blocks the PR (branch protection — Sam sets up)

**🍒 SAM ACTION:**
> After this task, set up branch protection rules on `main`:
> 1. Go to GitHub repo → Settings → Branches → Add rule
> 2. Branch name pattern: `main`
> 3. Enable: "Require status checks to pass before merging"
> 4. Select: lint, typecheck, build-backend as required checks
> 5. Enable: "Require branches to be up to date before merging"

---

### Task 0.6 — EAS Build Configuration

**Branch:** `feat/project-bootstrap` (continue)
**Depends on:** 0.2
**Estimated hours:** 1–2

**What to build:**
- Install EAS CLI: `npm install -g eas-cli`
- Create `eas.json` with development, preview, and production profiles
- Configure `app.config.ts` for EAS builds
- Test local development build

**Acceptance criteria:**
- `eas build --platform android --profile development` triggers successfully (or `preview` for APK)
- App installs on device/emulator from the build

**🍒 SAM ACTION:**
> 1. Run `eas login` with your Expo account
> 2. Run `eas build:configure` to link the project
> 3. First build will prompt for Android keystore — let EAS generate one

---

## Phase 0 Completion Checkpoint

> **🍒 SAM ACTION REQUIRED — Phase 0 Complete**
>
> Before starting Phase 1 feature work:
> 1. Review all code in `feat/project-bootstrap`
> 2. Push to remote: `git push -u origin feat/project-bootstrap`
> 3. Create PR to `main`, verify CI passes
> 4. Merge to `main`
> 5. Start your Google Play Developer account setup (Section 12.2 of design doc) — verification takes 2–7 days

---

## Phase 1: Core Food Logging MVP

> **Goal:** Replace Fitbit's food section for daily use. After Phase 1, Sam should be using CherryFit every day to log meals.

---

### Task 1.1 — Local Database and State Management

**Branch:** `feat/local-database`
**Depends on:** Phase 0 complete
**Estimated hours:** 6–8

**What to build:**
- Install and configure WatermelonDB (or SQLite via `expo-sqlite`)
- Define local schema mirroring the backend for offline-first:
  - `food_logs` table
  - `food_database` (personal food cache)
  - `daily_goals` table
- Set up Zustand stores:
  - `useFoodStore` — today's food logs, CRUD operations
  - `useGoalStore` — daily macro targets
  - `useAppStore` — app-level state (selected date, active tab, etc.)
- Create sync service scaffold (local ↔ backend) — full sync logic comes later
- Implement React Query hooks for server-state operations

**Acceptance criteria:**
- Can create, read, update, delete food logs locally
- Data persists between app restarts
- Zustand stores provide reactive state to components
- TypeScript types match between local DB and backend schema

---

### Task 1.2 — Daily Dashboard Screen

**Branch:** `feat/daily-dashboard`
**Depends on:** 1.1
**Estimated hours:** 10–12

**What to build:**
- **Header:** Greeting ("Good morning, Sam") + today's date
- **Calorie ring:** Large circular progress indicator (mint accent) showing calories consumed / target. Big display-weight number in center
- **Macro cards row:** Horizontal row of 4 mini-cards:
  - Protein (mint border/accent)
  - Carbs (lavender border/accent)
  - Fat (yellow border/accent)
  - Fiber (muted border/accent)
  - Each shows: current grams / target grams + thin progress bar
- **Secondary macros strip:** Smaller inline display for sugar and sodium
- **Meal timeline:** Vertical list of meal cards grouped by meal type (breakfast, lunch, dinner, snack):
  - Each card: meal type pill (yellow badge), food name, calories, mini macro breakdown
  - Tap to expand/edit
  - Swipe to delete
- **Empty state:** Friendly illustration/message when no meals logged ("Your plate is empty! Tap + to start logging")
- All components use the design system tokens (colors, typography, spacing, radius)

**Acceptance criteria:**
- Dashboard renders with mock data
- Calorie ring animates smoothly
- Macro cards update reactively when food logs change
- Meal cards are tappable and swipeable
- Visually matches the dark-mode aesthetic from the design doc
- Renders correctly on common Android screen sizes

---

### Task 1.3 — Food Logging FAB and Method Selection

**Branch:** `feat/food-logging-fab`
**Depends on:** 1.2
**Estimated hours:** 4–5

**What to build:**
- Floating Action Button (mint colored, bottom-right)
- On tap, FAB expands into a radial or bottom sheet menu with options:
  - 📷 Scan Label (primary, largest)
  - 📊 Scan Barcode (Phase 2 — show as "coming soon" or hide)
  - 🍔 Take Photo (Phase 3 — show as "coming soon" or hide)
  - 🔍 Search (Phase 3 — show as "coming soon" or hide)
  - ✏️ Manual Entry
- Tapping an option navigates to the corresponding logging screen
- FAB collapses when tapping outside
- Smooth animation (scale + fade)

**Acceptance criteria:**
- FAB is visible on dashboard
- Expands smoothly with all options
- Future options are gracefully hidden or marked
- Navigates correctly to Scan Label and Manual Entry screens

---

### Task 1.4 — Manual Food Entry Screen

**Branch:** `feat/manual-food-entry`
**Depends on:** 1.1, 1.3
**Estimated hours:** 6–8

**What to build:**
- Full-screen form on dark background with card-style input groups:
  - **Food name** (text input, required)
  - **Meal type** selector (breakfast/lunch/dinner/snack — pill buttons)
  - **Serving size** (text input, e.g., "1 cup", "100g")
  - **Number of servings** (numeric stepper, default 1, supports 0.5 increments)
  - **Macro fields** (numeric inputs with labels):
    - Calories (large, prominent)
    - Protein (g)
    - Carbs (g)
    - Fat (g)
    - Fiber (g)
    - Sugar (g)
    - Sodium (mg)
- Auto-calculate: if user enters protein/carbs/fat, estimate calories (protein×4 + carbs×4 + fat×9) and show as suggestion
- Save button (mint, full width at bottom)
- On save: create food_log entry, update dashboard, optionally save to personal food database
- Keyboard handling: numeric keyboard for macro fields, auto-advance between fields

**Acceptance criteria:**
- All fields render and accept input
- Calorie auto-estimation works
- Saving creates a food log visible on dashboard
- Serving multiplier correctly scales all macro values
- Form validates (at minimum, food name + calories required)
- Keyboard doesn't obscure inputs (proper scroll/inset handling)

---

### Task 1.5 — Nutrition Label OCR (Camera + AI)

**Branch:** `feat/nutrition-label-ocr`
**Depends on:** 1.4
**Estimated hours:** 12–15

**What to build:**

**Mobile side:**
- Camera screen using `expo-camera`:
  - Viewfinder with overlay guide ("Position the nutrition label within the frame")
  - Capture button (large, mint)
  - Gallery picker button (choose from photos)
  - Flash toggle
- After capture: show preview with "Scan" and "Retake" buttons
- Loading state while AI processes (skeleton of the manual entry form with shimmer)
- Results screen: pre-filled manual entry form with all extracted values
  - Highlight AI-extracted fields with a subtle mint indicator
  - All fields editable for correction
  - "Looks good — Save" button

**Backend side:**
- `food.scanLabel` tRPC mutation:
  - Accepts base64 image
  - Sends to Claude API (Sonnet) with a structured prompt:
    ```
    Extract all nutrition information from this food label image.
    Return JSON with: food_name, serving_size, calories, protein_g,
    carbs_g, fat_g, fiber_g, sugar_g, sodium_mg.
    If a value is not visible, return null.
    ```
  - Parses Claude's response, validates with Zod
  - Returns structured nutrition data
- Error handling: blurry image, non-label image, partial extraction
- Rate limiting: max 30 scans per hour

**Caching:**
- After successful scan + save, store food in personal `food_database` with all macro data
- Next time the same food is logged, it appears in Quick Log (Task 1.6)

**Acceptance criteria:**
- Camera opens, captures photo, sends to backend
- Claude API returns structured nutrition data
- Pre-filled form shows extracted values
- User can adjust values before saving
- Saved entry appears on dashboard with source: "label_scan"
- Round-trip time: under 5 seconds on reasonable connection
- Graceful error states for failed extraction

**🍒 SAM ACTION:**
> 1. Ensure your Anthropic API key has access to Claude Sonnet with vision
> 2. Add `ANTHROPIC_API_KEY` to `.env` (local development) and later to production

---

### Task 1.6 — Quick Log (Recent Meals + Favorites)

**Branch:** `feat/quick-log`
**Depends on:** 1.4, 1.5
**Estimated hours:** 6–8

**What to build:**
- Quick Log screen (accessible from dashboard or as a tab within food logging):
  - **Recent meals section:** Last 20 unique foods logged, sorted by most recent
    - Each item shows: food name, calories, mini macro bar, source badge (label/manual)
    - Tap to re-log (opens pre-filled entry with today's date, confirm and save)
  - **Favorites section:** Foods the user has starred
    - Star/unstar toggle on any food entry (in meal timeline and in quick log)
    - Favorites persist and are always shown at the top
  - **Meal templates section:** (stretch goal for Phase 1)
    - Save a combination of foods as a template ("My breakfast", "Post-workout shake")
    - One tap logs all foods in the template
- Search/filter within recent and favorites
- Swipe actions: swipe right to quick-log, swipe left to remove from recents

**Acceptance criteria:**
- Recent meals populate from food_logs history
- Tapping a recent meal re-logs it with one confirmation tap
- Favorites toggle works and persists
- Search filters results in real-time
- Previously scanned labels appear in recents for instant re-logging

---

### Task 1.7 — Goal Setting Screen

**Branch:** `feat/goal-setting`
**Depends on:** 1.1
**Estimated hours:** 4–5

**What to build:**
- Goals screen (accessible from Profile tab):
  - **Calorie target:** Large numeric input with +/- buttons
  - **Macro targets:** Individual inputs for protein, carbs, fat (in grams)
  - **Secondary targets:** Fiber, sugar, sodium
  - **TDEE calculator** (optional helper):
    - Input: age, weight, height, activity level, sex
    - Calculate using Mifflin-St Jeor formula
    - Suggest calorie target based on goal (lose/maintain/gain)
  - **Macro split presets:** Quick buttons for common splits:
    - Balanced (30P/40C/30F)
    - High Protein (40P/30C/30F)
    - Low Carb (35P/20C/45F)
    - Custom
  - When a preset is selected, auto-calculate gram targets based on calorie target
- Save goals to local DB
- Goals feed into the dashboard progress rings

**Acceptance criteria:**
- All targets are configurable
- TDEE calculator produces reasonable results
- Macro presets auto-fill correctly
- Saved goals immediately update dashboard progress indicators
- Goals persist between sessions

---

### Task 1.8 — Backend Sync Service

**Branch:** `feat/backend-sync`
**Depends on:** 1.1, 0.3
**Estimated hours:** 6–8

**What to build:**
- Sync engine that pushes local food logs to the backend PostgreSQL:
  - On save: attempt immediate sync if online
  - On app open: sync any unsynced entries
  - Background sync: periodic (every 5 minutes when app is active)
- Conflict resolution: last-write-wins (simple for single user)
- Sync status indicator on dashboard (subtle, e.g., small cloud icon)
- Offline handling:
  - All features work fully offline
  - Queue syncs when offline
  - Process queue when connectivity returns
- Backend endpoints for sync:
  - `food.syncBatch` — batch upload food logs
  - `food.getAll` — pull all logs (for restore/new device)

**Acceptance criteria:**
- Food logs created offline sync when online
- Sync indicator shows status (synced/syncing/pending)
- No data loss during offline → online transitions
- Backend PostgreSQL contains all food logs after sync

---

### Task 1.9 — Polish, Testing, and Bug Fixes

**Branch:** `feat/phase1-polish`
**Depends on:** 1.1–1.8
**Estimated hours:** 8–10

**What to build:**
- End-to-end testing of all flows:
  - Manual entry → dashboard update → sync to backend
  - Label scan → AI extraction → confirm → dashboard → sync
  - Quick log → re-log → dashboard
  - Goal setting → dashboard progress rings
- UI polish:
  - Animations and transitions between screens
  - Loading states and skeletons
  - Error states with retry options
  - Empty states with helpful messaging
- Edge cases:
  - Very long food names (text truncation)
  - Zero/null macro values
  - Rapid successive entries
  - App backgrounding during sync
- Performance:
  - Dashboard renders under 100ms
  - Food log list scrolls smoothly with 100+ entries
- Accessibility:
  - Minimum touch targets (48dp)
  - Content descriptions for screen readers
  - Sufficient color contrast ratios

**Acceptance criteria:**
- All flows work end-to-end without crashes
- No lint warnings or typecheck errors
- App feels responsive and polished
- Sam would use this daily to replace Fitbit food logging

---

## Phase 1 Completion Checkpoint

> **🍒 SAM ACTION REQUIRED — Phase 1 Deployment**
>
> 1. Review final PR for Phase 1
> 2. Merge to `main`
> 3. **Deploy backend:**
>    - SSH into Hostinger VPS
>    - Clone repo, set up `.env.production` with `DATABASE_URL`, `ANTHROPIC_API_KEY`, `JWT_SECRET`
>    - `docker compose up -d`
>    - `pnpm db:migrate`
>    - Verify: `curl https://api.cherryfit.dev/health`
> 4. **Build mobile app:**
>    - `eas build --platform android --profile preview`
>    - Install APK on your Pixel phone
> 5. **Daily use test:** Use CherryFit for at least 3 consecutive days, logging all meals
> 6. **Upload to Play Store internal testing** (if Play Developer account is ready):
>    - `eas build --platform android --profile production`
>    - `eas submit --platform android`
>    - Tag: `v0.1.0`
>
> Report any issues before starting Phase 2.

---

## Phase 2: Wearable Integration + Barcode Scanning

> **Goal:** Connect CherryFit to the Fitbit ecosystem and add barcode scanning. After Phase 2, the dashboard shows a complete health picture and food logging has two fast-scan methods.

---

### Task 2.1 — Google Health Connect Integration

**Branch:** `feat/health-connect`
**Depends on:** Phase 1 complete
**Estimated hours:** 10–12

**What to build:**
- Install `react-native-health-connect`
- Request permissions for:
  - Steps (read)
  - Sleep sessions (read)
  - Heart rate (read)
  - Exercise sessions (read)
  - Active calories burned (read)
- Create `HealthConnectService`:
  - `fetchTodaySteps()` → total steps
  - `fetchLastNightSleep()` → sleep duration, sleep stages if available
  - `fetchRestingHeartRate()` → latest resting HR
  - `fetchTodayExercises()` → exercise sessions with type and duration
  - `fetchActiveCalories()` → calories burned
- Data stored in local `health_metrics` table
- Auto-fetch on app open + manual refresh pull-to-refresh
- Sync fetched data to backend

**Acceptance criteria:**
- Health Connect permissions granted on device
- Steps, sleep, HR, exercises, and calories appear in app
- Data refreshes on app open
- Syncs to backend PostgreSQL
- Graceful fallback if Health Connect not installed ("Please install Health Connect from Play Store")

**🍒 SAM ACTION:**
> 1. Install Google Health Connect on your Pixel watch / phone if not already present
> 2. Ensure Fitbit is connected to Health Connect (Settings → Connected apps)
> 3. Grant CherryFit all requested permissions when prompted

---

### Task 2.2 — Dashboard: Fitbit Data Cards

**Branch:** `feat/dashboard-fitbit-cards`
**Depends on:** 2.1
**Estimated hours:** 5–6

**What to build:**
- Add horizontal scrolling card strip to the dashboard between macro cards and meal timeline:
  - **Steps card:** Dark card with mint-colored step count (display weight), goal progress bar, walking icon
  - **Sleep card:** Dark card with lavender sleep duration, sleep quality indicator, moon icon
  - **Heart rate card:** Dark card with cherry-colored resting HR, trend arrow (up/down vs. yesterday), heart icon
  - **Active minutes card:** Dark card with yellow active minutes, flame icon
  - **Calories burned card:** Optional, from Health Connect
- Each card is tappable → navigates to Trends tab with that metric selected
- Shimmer loading state while Health Connect data loads
- "Connect wearable" card shown if Health Connect not connected

**Acceptance criteria:**
- All Fitbit data cards render with real data from Health Connect
- Cards scroll horizontally with snap behavior
- Tapping navigates to appropriate trend view
- Loading and empty states handled gracefully

---

### Task 2.3 — Fitbit API Write-Back (Food Logs)

**Branch:** `feat/fitbit-writeback`
**Depends on:** Phase 1 complete
**Estimated hours:** 8–10

**What to build:**

**Backend:**
- Fitbit OAuth 2.0 flow:
  - `GET /auth/fitbit` → redirects to Fitbit authorization
  - `GET /auth/fitbit/callback` → exchanges code for tokens
  - Store encrypted refresh token in DB
  - Auto-refresh access token when expired
- Fitbit food logging endpoint wrapper:
  - `POST https://api.fitbit.com/1/user/-/foods/log.json`
  - Maps CherryFit food log → Fitbit food log format
  - Handles Fitbit's food ID system (create custom food if needed)
- Sync service:
  - When a food log is saved in CherryFit, queue Fitbit write-back
  - Process queue: create/update food log on Fitbit
  - Mark `fitbit_synced = true` on success
  - Retry logic for failures (max 3 attempts)

**Mobile:**
- Profile screen: "Connect Fitbit" button → opens OAuth flow in browser
- Connection status indicator
- Per-entry sync badge on meal timeline

**Acceptance criteria:**
- OAuth flow completes and tokens are stored
- Food logs saved in CherryFit appear in Fitbit within 5 minutes
- Sync status visible per entry
- Token refresh works automatically
- Failed syncs retry gracefully

**🍒 SAM ACTION:**
> 1. Go to [dev.fitbit.com](https://dev.fitbit.com) → Register a new app
> 2. Application type: "Personal"
> 3. Callback URL: `https://api.cherryfit.dev/auth/fitbit/callback`
> 4. Copy Client ID and Client Secret
> 5. Add to `.env.production`: `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET`
> 6. Complete the OAuth flow from the app to authorize your account

---

### Task 2.4 — Barcode Scanning

**Branch:** `feat/barcode-scanning`
**Depends on:** 1.4
**Estimated hours:** 8–10

**What to build:**

**Mobile:**
- Barcode scanner screen using `expo-barcode-scanner` (or `expo-camera` with barcode detection):
  - Viewfinder with scanning overlay animation
  - Auto-detect barcode (EAN-13, UPC-A, etc.)
  - Haptic feedback on successful scan
  - Manual barcode entry fallback (type the number)

**Backend:**
- `food.scanBarcode` tRPC query:
  - Look up barcode in local cache first (PostgreSQL `food_database` where barcode matches)
  - If not cached: query Open Food Facts API:
    ```
    GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
    ```
  - Parse response: extract product name, serving size, and all macro values
  - Cache result in `food_database` for future lookups
  - Return structured nutrition data

**Flow:**
- Scan barcode → lookup → show pre-filled entry form → user confirms → save
- If not found in database: show "Product not found" with option to scan nutrition label instead or enter manually

**Acceptance criteria:**
- Barcode scanner detects and reads barcodes quickly
- Known products return accurate nutrition data
- Data cached locally after first scan
- Not-found products gracefully fall back to label scan or manual entry
- Scanning the same barcode twice: second time loads from cache (instant)

---

### Task 2.5 — Basic Trend Charts

**Branch:** `feat/trend-charts`
**Depends on:** 1.1, 2.1
**Estimated hours:** 8–10

**What to build:**
- Trends screen (second tab):
  - **Period selector:** Week / Month / Custom range (pill buttons at top)
  - **Calorie trend:** Line chart showing daily calories vs. target over selected period. Target shown as dashed line.
  - **Macro breakdown:** Stacked bar or grouped bar chart showing P/C/F per day
  - **Health metrics charts** (if Health Connect data exists):
    - Steps per day (bar chart, mint)
    - Sleep duration per night (bar chart, lavender)
    - Resting heart rate trend (line chart, cherry)
  - Each chart:
    - Dark background card
    - Accent-colored data lines/bars
    - Muted grid lines
    - Touch to see exact value for a day
- Use Victory Native (or react-native-chart-kit) with custom dark theme

**Acceptance criteria:**
- All charts render with real data
- Period selector changes the data range
- Touch interaction shows data points
- Charts use the design system colors
- Smooth scrolling with multiple charts
- Empty state when insufficient data ("Log a few more days to see trends")

---

### Task 2.6 — Phase 2 Polish and Integration Testing

**Branch:** `feat/phase2-polish`
**Depends on:** 2.1–2.5
**Estimated hours:** 6–8

**What to build:**
- End-to-end integration testing:
  - Log food via label scan → verify appears on Fitbit
  - Scan barcode → verify data accuracy against Open Food Facts
  - Health Connect data → verify dashboard cards update
  - Trend charts → verify data matches logged entries
- FAB menu update: enable barcode scanning option (remove "coming soon")
- Performance optimization for chart rendering
- Bug fixes from Phase 1 daily use feedback

**Acceptance criteria:**
- All integrations work end-to-end
- No regressions in Phase 1 functionality
- App remains responsive with Health Connect polling

---

## Phase 2 Completion Checkpoint

> **🍒 SAM ACTION REQUIRED — Phase 2 Deployment**
>
> 1. Review and merge Phase 2 PR to `main`
> 2. Update backend: `ssh vps`, `git pull && docker compose up -d --build && pnpm db:migrate`
> 3. Add Fitbit env vars to `.env.production` if not already done
> 4. Build: `eas build --platform android --profile preview`
> 5. Install on device, complete Fitbit OAuth
> 6. Test: log a meal → check it appears on Fitbit → check Health Connect data on dashboard
> 7. Upload to Play Store: `eas build --platform android --profile production && eas submit`
> 8. Tag: `v0.2.0`

---

## Phase 3: Workout Tracking + AI Food Photos

> **Goal:** Complete the exercise tracking system and expand food logging with AI photo recognition and restaurant search. After Phase 3, CherryFit covers all daily health tracking needs.

---

### Task 3.1 — Exercise Database

**Branch:** `feat/exercise-database`
**Depends on:** Phase 2 complete
**Estimated hours:** 4–5

**What to build:**
- Seed database with common exercises (150–200 exercises):
  - Organized by muscle group: chest, back, shoulders, biceps, triceps, legs (quads, hamstrings, glutes, calves), core, cardio
  - Each exercise: name, primary muscle group, secondary muscle groups, equipment type (barbell, dumbbell, cable, machine, bodyweight)
- Exercise search with auto-complete
- Custom exercise creation (for exercises not in the database)
- Store in backend + sync to local DB for offline access

**Acceptance criteria:**
- Exercise search returns relevant results quickly
- All major compound and isolation movements included
- Custom exercises can be created and used in templates
- Data available offline

---

### Task 3.2 — Workout Templates (CRUD)

**Branch:** `feat/workout-templates`
**Depends on:** 3.1
**Estimated hours:** 8–10

**What to build:**
- Workouts tab screen:
  - **My Templates** section: grid or list of saved templates
  - Each template card: name, muscle groups (color-coded pills), exercise count, estimated duration
- Template creation/edit screen:
  - Template name input
  - Add exercises (from exercise database search)
  - For each exercise: target sets and target reps (e.g., "4 sets × 10 reps")
  - Drag to reorder exercises
  - Remove exercises (swipe or X button)
  - Save template
- Template card actions: Edit, Duplicate, Delete, Start Workout

**Acceptance criteria:**
- Can create, edit, delete, and duplicate templates
- Exercise search and add flow is smooth
- Templates persist locally and sync to backend
- Template list shows all saved templates with summary info

---

### Task 3.3 — Active Workout Session

**Branch:** `feat/workout-session`
**Depends on:** 3.2
**Estimated hours:** 12–15

**What to build:**
- "Start Workout" from a template (or start blank):
  - Header card (mint accent): workout name, elapsed timer, exercise progress (3/6 exercises done)
  - Current exercise card:
    - Exercise name in heading weight
    - Previous session reference ("Last time: 80kg × 10, 10, 8")
    - Set logging rows:
      - Set number
      - Weight input (numeric, remembers last value)
      - Reps input (numeric)
      - Checkmark button to complete set
    - "Add Set" button if doing more sets than planned
  - Rest timer: auto-starts after completing a set (configurable default, e.g., 90 seconds)
  - "Next Exercise" button
  - Exercise list collapsible (see all exercises, completed ones checked off)
- Session completion:
  - Summary screen: total volume, duration, exercises completed, any PRs hit
  - "Save Workout" button
  - Save to `workout_sessions` + `workout_sets`
- Ad-hoc mode: start blank workout, add exercises on the fly

**Acceptance criteria:**
- Can log a complete workout with sets/reps/weight for each exercise
- Previous session data shown for reference
- Rest timer works (auto-start, customizable duration)
- Session saves correctly with all set data
- Works offline (syncs later)
- UI is comfortable to use at the gym (large touch targets, clear numbers)

---

### Task 3.4 — Progressive Overload Charts

**Branch:** `feat/progressive-overload`
**Depends on:** 3.3
**Estimated hours:** 6–8

**What to build:**
- Exercise detail screen (tap any exercise in history or templates):
  - **Estimated 1RM trend:** Line chart using Epley formula (weight × (1 + reps/30))
    - X-axis: dates of sessions
    - Y-axis: estimated 1RM in kg/lbs
    - Mint colored line with dot markers
  - **Total volume per session:** Bar chart (sets × reps × weight)
    - Lavender colored bars
  - **Personal records:** Highlighted on charts, listed below:
    - Heaviest weight
    - Most reps at a given weight
    - Highest estimated 1RM
    - Most total volume in a session
  - **History table:** Scrollable list of all sessions for this exercise:
    - Date, sets × reps breakdown, max weight, estimated 1RM
- Charts available per-exercise from:
  - Workout history
  - Template exercise list
  - Exercise database (if has history)

**Acceptance criteria:**
- 1RM and volume charts render with real workout data
- Personal records detected and highlighted
- Charts update after each new workout session
- Minimum 3 data points needed before showing chart (show message otherwise)

---

### Task 3.5 — AI Food Photo Recognition

**Branch:** `feat/ai-food-photo`
**Depends on:** 1.5 (camera infrastructure)
**Estimated hours:** 8–10

**What to build:**

**Mobile:**
- Reuse camera screen from label OCR (Task 1.5) with different mode:
  - Mode toggle: "Label" vs "Food" (or separate entry points from FAB)
  - Food mode: guide text says "Take a photo of your meal"
  - After capture: show "Analyzing..." with food-themed loading animation

**Backend:**
- `food.analyzePhoto` tRPC mutation:
  - Sends image to Claude Vision API with prompt:
    ```
    Identify all food items in this photo and estimate nutritional values.
    For each item, provide: name, estimated portion size,
    calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg.
    Also provide a confidence level (low/medium/high) for each estimate.
    Return as JSON array of food items.
    ```
  - Parse and validate response

**Results screen:**
- List of identified food items, each as an editable card:
  - Food name (editable)
  - Confidence badge (low = yellow, medium = lavender, high = mint)
  - All macro fields (pre-filled, editable)
  - Remove button (if AI identified something wrong)
- "Add another item" button (for foods the AI missed)
- "Save All" button — creates individual food_log entries for each item
- Clear disclaimer: "These are AI estimates. Tap any value to adjust."

**Acceptance criteria:**
- Photo of a meal returns identified food items with macro estimates
- User can edit, remove, or add items before saving
- Confidence levels displayed clearly
- Disclaimer visible
- Multiple food items from one photo supported
- Saved entries show source: "photo_ai" with confidence score

---

### Task 3.6 — Restaurant Food Search

**Branch:** `feat/restaurant-search`
**Depends on:** 1.4
**Estimated hours:** 6–8

**What to build:**
- Search screen:
  - Search bar at top with restaurant/food query input
  - Results list: food items with restaurant name, item name, calories, macro summary
  - Tap result → opens pre-filled food entry form
- Backend:
  - `food.searchRestaurant` tRPC query
  - Integrate with Nutritionix API (or alternative):
    - Search endpoint for restaurant items
    - Parse response into standard food format
  - Fallback for unknown restaurants: offer AI photo analysis or manual entry
- Cache popular searches locally

**Acceptance criteria:**
- Search returns restaurant menu items with nutrition data
- Results are accurate for major chains
- Tapping a result pre-fills the entry form
- Unknown restaurants show helpful fallback options

**🍒 SAM ACTION:**
> 1. Sign up for Nutritionix API at [developer.nutritionix.com](https://developer.nutritionix.com)
> 2. Get API key (free tier: 500 requests/day — sufficient for personal use)
> 3. Add `NUTRITIONIX_APP_ID` and `NUTRITIONIX_API_KEY` to `.env.production`

---

### Task 3.7 — Phase 3 Polish

**Branch:** `feat/phase3-polish`
**Depends on:** 3.1–3.6
**Estimated hours:** 6–8

**What to build:**
- Enable all FAB options (barcode, photo, search no longer "coming soon")
- Workout history screen (list of all past sessions)
- Integration testing across all food logging methods
- Performance profiling and optimization
- Bug fixes from Phase 2 daily use

**Acceptance criteria:**
- All 5 food logging methods work end-to-end
- Workout tracking is complete and usable
- No regressions in Phase 1 or 2 features

---

## Phase 3 Completion Checkpoint

> **🍒 SAM ACTION REQUIRED — Phase 3 Deployment**
>
> 1. Review and merge Phase 3 PR
> 2. Update backend: `ssh vps`, `git pull && docker compose up -d --build && pnpm db:migrate`
> 3. Add Nutritionix env vars to `.env.production`
> 4. Build: `eas build --platform android --profile production`
> 5. Test: complete a full workout, verify progressive overload charts, test food photo AI
> 6. Submit to Play Store: `eas submit --platform android`
> 7. Tag: `v0.3.0`
>
> **This is a good checkpoint to evaluate:** Is CherryFit ready for broader use? Consider inviting 2–3 friends to closed testing.

---

## Phase 4: Blood Tests + AI Insights

> **Goal:** Add the intelligence layer. After Phase 4, CherryFit is feature-complete and ready for v1.0.0 public release.

---

### Task 4.1 — Blood Test PDF Upload and Parsing

**Branch:** `feat/blood-test-upload`
**Depends on:** Phase 3 complete
**Estimated hours:** 10–12

**What to build:**

**Mobile:**
- Blood test upload screen (in Profile → Health Records):
  - "Upload Blood Test" button
  - File picker (PDF from device storage)
  - Upload progress indicator
  - After processing: parsed results review screen
- Results review:
  - List of extracted lab values, each showing:
    - Marker name (e.g., "LDL Cholesterol")
    - Value + unit (e.g., "120 mg/dL")
    - Reference range (e.g., "< 100 mg/dL")
    - Status indicator: in-range (mint), borderline (yellow), out-of-range (cherry)
  - All values editable (in case AI misread something)
  - Test date selector
  - "Save Results" button

**Backend:**
- `blood.uploadTest` tRPC mutation:
  - Accept PDF upload (multipart or base64)
  - Send to Claude API with document processing:
    ```
    Extract all lab test values from this blood test PDF.
    For each value, return: marker_name, value, unit, reference_range_low,
    reference_range_high, is_within_range.
    Common markers to look for: cholesterol (total, LDL, HDL),
    triglycerides, glucose, HbA1c, vitamin D, B12, iron, ferritin,
    ALT, AST, creatinine, BUN, TSH, testosterone.
    Return as JSON array.
    ```
  - Store parsed results in `blood_tests` table
  - Store PDF file (encrypted) for reference

**Acceptance criteria:**
- PDF uploads and processes successfully
- Lab values extracted accurately from common blood test formats
- Out-of-range values clearly flagged
- User can correct extraction errors before saving
- Historical tests viewable in chronological list

---

### Task 4.2 — Blood Test Trend Charts

**Branch:** `feat/blood-test-trends`
**Depends on:** 4.1
**Estimated hours:** 5–6

**What to build:**
- Blood test history screen:
  - Timeline of all uploaded tests
  - Tap a marker to see its trend over time
- Per-marker trend chart:
  - Line chart with value over time
  - Reference range shown as shaded green band
  - Data points: mint if in range, cherry if out of range
  - At least 2 data points needed for trend line
- Summary dashboard card:
  - "Last blood test: [date]"
  - Count of in-range vs. out-of-range markers
  - Quick-access to blood test section

**Acceptance criteria:**
- Trend charts render with multiple blood test uploads
- Reference ranges clearly visible
- Out-of-range values highlighted
- Works with 1 test (just shows values) and multiple tests (shows trends)

---

### Task 4.3 — AI Insights Engine

**Branch:** `feat/ai-insights`
**Depends on:** 2.5, 3.4, 4.1
**Estimated hours:** 12–15

**What to build:**

**Backend — Insight generation service:**
- `insights.generate` tRPC mutation:
  - Aggregates data from the past week (or specified period):
    - Food logs: average daily macros, adherence to targets
    - Workouts: frequency, volume trends, PRs
    - Health metrics: step trends, sleep patterns, HR changes
    - Blood tests: latest values (if available)
  - Sends aggregated data to Claude API with prompt:
    ```
    You are a health insights assistant. Based on the following health data
    for the past week, provide 3-5 actionable insights. Categories:
    nutrition, recovery, trend_alert, goal_progress, blood_test.

    Each insight should have: title (short), body (2-3 sentences),
    category, and priority (high/medium/low).

    Be specific and reference actual numbers from the data.
    Include a disclaimer that this is not medical advice.

    Data:
    [aggregated JSON]
    ```
  - Parse insights, store in `ai_insights` table
  - Scheduled generation: weekly (Sunday evening) via cron job or manual trigger

**Mobile — Insights tab:**
- Insights screen (4th tab):
  - **This week's insights:** Cards with AI-generated observations
    - Each card: category icon + color, title, body text, priority badge
    - Tap to expand for full detail
  - **Blood test insights** (if blood test data exists):
    - Separate section with correlations between lab values and lifestyle
  - **Historical insights:** Scrollable list of past weeks' insights
  - **Generate now** button: trigger on-demand insight generation
  - Read/unread state for each insight (dot indicator)
- Disclaimer banner at top: "AI-generated insights. Not medical advice."

**Acceptance criteria:**
- Insights generated from real aggregated data
- Insights feel specific and actionable (not generic)
- Weekly auto-generation works
- On-demand generation works
- Blood test correlations appear when lab data is available
- Clear medical disclaimer

---

### Task 4.4 — Data Export

**Branch:** `feat/data-export`
**Depends on:** All previous tasks
**Estimated hours:** 4–5

**What to build:**
- Export screen (Profile → Export Data):
  - Export options:
    - Food logs (CSV or JSON)
    - Workout history (CSV or JSON)
    - Health metrics (CSV)
    - Blood test results (JSON)
    - Everything (ZIP of all above)
  - Date range selector
  - Export button → generates file → share sheet (save to device, send via email, etc.)
- Backend:
  - `export.generateExport` tRPC mutation
  - Queries data, formats as CSV/JSON
  - Returns downloadable file

**Acceptance criteria:**
- All data types exportable
- CSV files open correctly in Excel/Google Sheets
- JSON files are valid and well-structured
- Date range filtering works
- Share sheet allows saving to device

---

### Task 4.5 — Final Polish and v1.0.0 Preparation

**Branch:** `feat/v1-release`
**Depends on:** 4.1–4.4
**Estimated hours:** 8–10

**What to build:**
- Comprehensive end-to-end testing of all features
- Onboarding flow for new users:
  - Welcome screen with CherryFit branding
  - Goal setup wizard (quick TDEE + macro targets)
  - Health Connect connection prompt
  - Fitbit connection prompt
  - "You're all set!" with dashboard preview
- App icon: cherry-themed, mint accent on dark background (512x512)
- Splash screen: dark background with cherry logo
- Play Store assets:
  - Feature graphic (1024x500)
  - Screenshots (at least 4: dashboard, food logging, workouts, insights)
  - Full description for Play Store listing
  - Privacy policy page
- Performance audit and optimization
- Final bug fixes

**Acceptance criteria:**
- Onboarding flow works for a fresh install
- All Play Store assets ready
- Privacy policy published and linked
- App icon and splash screen polished
- No crashes, no lint warnings, no typecheck errors
- Ready for public release

---

## Phase 4 Completion Checkpoint

> **🍒 SAM ACTION REQUIRED — v1.0.0 Public Release**
>
> 1. Review and merge final PR
> 2. Update backend: `ssh vps`, `git pull && docker compose up -d --build && pnpm db:migrate`
> 3. Build production: `eas build --platform android --profile production`
> 4. Submit to Play Store: `eas submit --platform android`
> 5. In Play Console:
>    - Update store listing with final screenshots and description
>    - Ensure privacy policy URL is set
>    - Complete content rating questionnaire
>    - Change release track from "Internal Testing" → "Production"
>    - Submit for review (typically 1–3 days)
> 6. Tag: `v1.0.0`
> 7. Celebrate! 🍒🎉
>
> **Post-launch:**
> - Monitor crash reports in Play Console
> - Watch for user feedback
> - Plan v1.1.0 based on what you've learned from daily use

---

## Task Summary Table

| ID | Task | Phase | Hours | Depends On |
|----|------|-------|-------|------------|
| 0.1 | Repository and monorepo setup | 0 | 3–4 | — |
| 0.2 | Expo mobile app scaffold | 0 | 3–4 | 0.1 |
| 0.3 | Fastify backend scaffold | 0 | 3–4 | 0.1 |
| 0.4 | Shared package and tRPC client | 0 | 2–3 | 0.2, 0.3 |
| 0.5 | GitHub Actions CI pipeline | 0 | 2 | 0.1 |
| 0.6 | EAS build configuration | 0 | 1–2 | 0.2 |
| 1.1 | Local database and state management | 1 | 6–8 | Phase 0 |
| 1.2 | Daily dashboard screen | 1 | 10–12 | 1.1 |
| 1.3 | Food logging FAB and method selection | 1 | 4–5 | 1.2 |
| 1.4 | Manual food entry screen | 1 | 6–8 | 1.1, 1.3 |
| 1.5 | Nutrition label OCR (camera + AI) | 1 | 12–15 | 1.4 |
| 1.6 | Quick log (recent meals + favorites) | 1 | 6–8 | 1.4, 1.5 |
| 1.7 | Goal setting screen | 1 | 4–5 | 1.1 |
| 1.8 | Backend sync service | 1 | 6–8 | 1.1, 0.3 |
| 1.9 | Phase 1 polish and testing | 1 | 8–10 | 1.1–1.8 |
| 2.1 | Google Health Connect integration | 2 | 10–12 | Phase 1 |
| 2.2 | Dashboard Fitbit data cards | 2 | 5–6 | 2.1 |
| 2.3 | Fitbit API write-back | 2 | 8–10 | Phase 1 |
| 2.4 | Barcode scanning | 2 | 8–10 | 1.4 |
| 2.5 | Basic trend charts | 2 | 8–10 | 1.1, 2.1 |
| 2.6 | Phase 2 polish | 2 | 6–8 | 2.1–2.5 |
| 3.1 | Exercise database | 3 | 4–5 | Phase 2 |
| 3.2 | Workout templates (CRUD) | 3 | 8–10 | 3.1 |
| 3.3 | Active workout session | 3 | 12–15 | 3.2 |
| 3.4 | Progressive overload charts | 3 | 6–8 | 3.3 |
| 3.5 | AI food photo recognition | 3 | 8–10 | 1.5 |
| 3.6 | Restaurant food search | 3 | 6–8 | 1.4 |
| 3.7 | Phase 3 polish | 3 | 6–8 | 3.1–3.6 |
| 4.1 | Blood test PDF upload and parsing | 4 | 10–12 | Phase 3 |
| 4.2 | Blood test trend charts | 4 | 5–6 | 4.1 |
| 4.3 | AI insights engine | 4 | 12–15 | 2.5, 3.4, 4.1 |
| 4.4 | Data export | 4 | 4–5 | All |
| 4.5 | Final polish and v1.0.0 prep | 4 | 8–10 | 4.1–4.4 |

---

## Dependency Graph (Simplified)

```
Phase 0: Bootstrap
  0.1 Repo Setup
   ├── 0.2 Expo Scaffold ──── 0.6 EAS Config
   ├── 0.3 Backend Scaffold
   ├── 0.5 CI Pipeline
   └── 0.4 Shared + tRPC (needs 0.2 + 0.3)

Phase 1: Core Food Logging
  1.1 Local DB + State
   ├── 1.2 Dashboard ──── 1.3 FAB ──── 1.4 Manual Entry
   │                                      ├── 1.5 Label OCR
   │                                      └── 1.6 Quick Log (needs 1.5 too)
   ├── 1.7 Goal Setting
   └── 1.8 Backend Sync (needs 0.3 too)
  1.9 Polish (needs all above)

Phase 2: Wearable + Barcode
  2.1 Health Connect ──── 2.2 Dashboard Cards
  2.3 Fitbit Write-back (parallel to 2.1)
  2.4 Barcode Scanning (parallel to 2.1)
  2.5 Trend Charts (needs 1.1 + 2.1)
  2.6 Polish (needs all above)

Phase 3: Workouts + AI Photos
  3.1 Exercise DB ──── 3.2 Templates ──── 3.3 Active Session ──── 3.4 Overload Charts
  3.5 AI Food Photos (parallel, needs 1.5)
  3.6 Restaurant Search (parallel, needs 1.4)
  3.7 Polish (needs all above)

Phase 4: Blood Tests + Insights
  4.1 Blood Test Upload ──── 4.2 Blood Test Charts
  4.3 AI Insights (needs 2.5 + 3.4 + 4.1)
  4.4 Data Export (needs all)
  4.5 v1.0.0 Prep (needs all)
```

---

## 🍒 SAM Action Items Summary

All manual steps Sam needs to take, in chronological order:

| When | Action | Details |
|------|--------|---------|
| Phase 0 start | Create GitHub repo | Public or private, share URL with agent |
| Phase 0 start | Start Google Play Developer registration | $25 fee, 2–7 day verification |
| Task 0.5 | Set up branch protection on `main` | Require CI checks to pass |
| Task 0.6 | EAS login and build setup | `eas login`, `eas build:configure` |
| Phase 1 end | Deploy backend to VPS | SSH, docker compose, migrations |
| Phase 1 end | First APK build and device install | `eas build --profile preview` |
| Task 1.5 | Verify Anthropic API key has vision access | Check API dashboard |
| Task 2.3 | Register Fitbit app at dev.fitbit.com | Get Client ID + Secret |
| Task 2.3 | Complete Fitbit OAuth from the app | Authorize CherryFit |
| Phase 2 end | Update backend, build new APK | Deploy + test Fitbit sync |
| Phase 2 end | Upload v0.2.0 to Play Store | Internal testing track |
| Task 3.6 | Register for Nutritionix API | Get API key (free tier) |
| Phase 3 end | Update backend, build new APK | Deploy + test workouts + AI photos |
| Phase 3 end | Upload v0.3.0 to Play Store | Consider closed testing |
| Task 4.5 | Prepare Play Store assets | Icon, screenshots, description, privacy policy |
| Phase 4 end | Final deployment and Play Store submission | v1.0.0 to production track |

---

*— End of Implementation Plan —*
