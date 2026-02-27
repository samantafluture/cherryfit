# 🍒 CherryFit — Technical Design Document

**Your health command center — extending Fitbit with intelligent nutrition, workout tracking, blood test insights, and AI-powered health intelligence.**

Version 1.1 · February 2026 · Author: Sam · Personal Project

---

## 1. Executive Summary

CherryFit is a personal health management Android application that extends the Fitbit ecosystem with features that Fitbit's native food logging critically lacks: intelligent multi-method calorie and macro tracking, detailed weight training logging with progressive overload analysis, blood test PDF parsing with AI-driven correlations, and unified health data visualization with AI insights.

The app is designed as a personal tool first, architected for potential multi-user expansion. It addresses specific frustrations with Fitbit's built-in food section: too many taps to log meals, incomplete food database, poor handling of restaurant and prepared meal service foods, and the inability to quickly capture nutrition labels from services like CookUnit.

### 1.1 Core Value Proposition

- **Extend Fitbit, don't replace it:** Health Connect reads wearable data; Fitbit API writes food logs back. Your Google Watch routine stays intact.
- **Five food logging methods:** Nutrition label OCR, barcode scanning, AI food photo recognition, restaurant search, and manual entry — each optimized for minimum taps.
- **Macros front and center:** Calories, protein, carbs, fat, fiber, sugar, and sodium visible at a glance — never buried behind menus.
- **Complete fitness picture:** Weight training templates with progressive overload charts, plus Fitbit's steps, sleep, heart rate, and exercises unified in one dashboard.
- **Health intelligence:** Blood test PDF parsing, trend analysis, and AI-powered insights correlating nutrition, exercise, and lab results.

### 1.2 Project Metadata

| Attribute | Detail |
|-----------|--------|
| Working Name | CherryFit |
| Project Type | Personal MVP, architected for multi-user scaling |
| Target Platform | Android (primary), iOS potential via React Native |
| Language | English only (v1) |
| Developer | Sam (solo developer) |
| Tech Stack | React Native (Expo) + Fastify backend on VPS |
| Timeline Target | MVP in 8–12 weeks |

---

## 2. Problem Statement

### 2.1 Current Pain Points with Fitbit Food Logging

The following frustrations were identified through direct daily usage of Fitbit's built-in food section and form the design principles for CherryFit:

| Pain Point | Impact | CherryFit Solution |
|------------|--------|---------------------|
| Too many taps to log a meal | Discourages consistent logging, leading to incomplete data | One-tap label scan, barcode scan, and quick-log for frequent meals |
| Incomplete food database | Common foods missing or inaccurate, especially international foods | Multiple fallback methods: label OCR, AI photo estimation, manual entry |
| Restaurant/takeout foods hard to log | Guessing calories for takeout leads to inaccurate tracking | AI photo recognition + restaurant database search with portion estimation |
| Prepared meal services (CookUnit) require manual typing | Nutrition labels exist but must be manually entered every time | OCR label scanning: photograph the label, auto-extract all macro data |
| Macros buried behind navigation | Calories visible but protein/carbs/fat require extra taps | Macros displayed on home dashboard, always visible |
| No workout detail beyond basic activity | Weight training sets/reps/progressive overload not tracked | Full workout logging with templates and overload charts |
| No blood test integration | Lab results disconnected from daily health data | PDF upload with OCR extraction and AI trend analysis |

### 2.2 Target User Profile

CherryFit is designed for a health-conscious individual who: actively tracks macros (not just calories) for fitness goals such as muscle building or body recomposition; does regular weight training and wants to track progressive overload; uses a Fitbit/Google wearable device daily; frequently eats prepared meals from services with nutrition labels; eats restaurant or takeout food regularly; wants to correlate blood test results with lifestyle data over time; and is frustrated by the friction in existing calorie tracking tools.

---

## 3. System Architecture

### 3.1 High-Level Architecture

CherryFit follows a client-server architecture with the mobile app communicating with a self-hosted backend via tRPC. The backend orchestrates all AI processing, external API integrations, and data persistence.

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Mobile Client | React Native (Expo), TypeScript | UI, camera capture, Health Connect integration, offline caching |
| API Layer | Fastify + tRPC | Type-safe API, authentication, request validation, rate limiting |
| AI Services | Claude API (Anthropic) | Food photo analysis, nutrition label OCR, blood test parsing, health insights |
| Wearable Integration | Google Health Connect SDK | Read: steps, sleep, heart rate, exercises from Fitbit/Google Watch |
| Wearable Sync | Fitbit Web API | Write: food logs back to Fitbit so data appears on watch |
| Database | PostgreSQL + Drizzle ORM | All user data, food logs, workouts, blood tests, AI analysis cache |
| Infrastructure | Hostinger VPS, Docker Compose | Self-hosted, containerized deployment |

### 3.2 Data Flow Overview

#### Food Logging Flow

When a user logs food, the flow varies by method but converges on the same data model:

1. User selects logging method (label scan, barcode, photo, search, or manual).
2. **Label scan:** Camera captures nutrition label → image sent to backend → Claude Vision API extracts structured macro data → user confirms/adjusts → saved.
3. **Barcode scan:** Barcode decoded on-device → lookup against Open Food Facts API (or local cache) → user confirms → saved.
4. **AI food photo:** Camera captures meal → image sent to backend → Claude Vision estimates food items and portions → user confirms/adjusts → saved.
5. **Restaurant search:** User searches by restaurant name → database lookup (Nutritionix or similar) → user selects item → saved.
6. **On save:** Data written to local DB → synced to backend PostgreSQL → Fitbit API write-back for food log.

#### Wearable Sync Flow

Health Connect acts as the primary bridge between wearable data and CherryFit. The app registers as a Health Connect reader for sleep, steps, heart rate, and exercise data. This data is pulled periodically (and on app open) to populate the dashboard. Separately, the Fitbit Web API is used to write food logs back, ensuring nutrition data appears in the Fitbit ecosystem for quick glance on the Google Watch.

#### Blood Test Flow

The user uploads a PDF of their blood test results. The backend sends the PDF to Claude's document understanding API, which extracts structured lab values (e.g., cholesterol, iron, vitamin D, glucose). These are stored with timestamps for trend tracking. The AI insights engine periodically correlates lab values with nutrition and exercise data to surface actionable observations.

---

## 4. Feature Specification

### 4.1 Food Logging (Priority: Critical)

Food logging is the primary feature and the reason CherryFit exists. Every design decision prioritizes reducing the number of taps between deciding to log and having complete macro data saved.

#### 4.1.1 Nutrition Label OCR (Highest Priority)

This is the single most impactful feature for daily use. The user photographs a nutrition label (from CookUnit meals, packaged foods, etc.) and the app extracts all macro data automatically.

- **Input:** Camera photo of a nutrition label (or photo from gallery).
- **Processing:** Image sent to backend → Claude Vision API with a structured extraction prompt → returns JSON with: calories, protein, carbs, fat, fiber, sugar, sodium, serving size.
- **Output:** Pre-filled food entry for user confirmation. User can adjust serving count (e.g., "I ate 1.5 servings") and all values recalculate.
- **Target speed:** Under 3 seconds from photo to pre-filled entry.
- **Caching:** Once a label is scanned, the food is saved to the user's personal food database for instant re-logging.

#### 4.1.2 Barcode Scanning

For packaged grocery items, barcode scanning provides the fastest path to accurate data.

- **Primary database:** Open Food Facts (free, open-source, extensive international coverage).
- **Fallback:** If not found in Open Food Facts, offer to scan the nutrition label instead.
- **Caching:** Barcode → nutrition mapping cached locally for offline use.

#### 4.1.3 AI Food Photo Recognition

For home-cooked meals, restaurant food without packaging, or any situation where there's no label or barcode.

- **Processing:** Photo sent to Claude Vision API with a prompt to identify food items, estimate portions, and calculate approximate macros.
- **Accuracy expectation:** This is inherently estimative. The UI should clearly indicate these are estimates and allow easy adjustment.
- **Learning:** When users correct estimates, store corrections to improve suggestions for similar foods over time.

#### 4.1.4 Restaurant and Takeout Search

For restaurant meals, the app provides a searchable database of restaurant menu items with nutritional data.

- **Database approach:** Integrate with a nutrition API (Nutritionix, FatSecret, or USDA FoodData Central) for restaurant and chain food data.
- **AI fallback:** For local restaurants not in databases, user can describe the meal or take a photo for AI estimation.

#### 4.1.5 Quick Log and Favorites

For repeated meals, this reduces logging to a single tap.

- **Recent meals:** Last 20 meals displayed for one-tap re-logging.
- **Favorites:** User can star any food entry for permanent quick access.
- **Meal templates:** Save combinations (e.g., "Breakfast combo: oatmeal + banana + protein shake") as single-tap logs.

#### 4.1.6 Manual Entry

Always available as a fallback. Designed as a fast form with smart defaults. Fields: food name, calories, protein, carbs, fat, fiber, sugar, sodium, serving size, and number of servings.

---

### 4.2 Macro Tracking and Dashboard (Priority: Critical)

#### 4.2.1 Daily Dashboard (Home Screen)

The home screen is the daily command center. It shows at a glance everything the user needs to know about their day:

- **Macro rings/bars:** Calories, protein, carbs, fat shown as circular progress indicators with targets. Fiber, sugar, sodium shown as secondary bars below.
- **Meal timeline:** Chronological list of today's logged meals with quick macro summary per meal.
- **Fitbit data cards:** Steps, sleep score, resting heart rate, and active minutes pulled from Health Connect.
- **Quick actions:** Floating action button with options: Scan Label, Scan Barcode, Take Photo, Search, Manual Entry.

#### 4.2.2 Goal Setting

Users set daily targets for all tracked macros. The app provides suggested targets based on standard formulas (Mifflin-St Jeor for TDEE, adjustable macro splits for goals like muscle gain, fat loss, or maintenance). All targets are fully customizable.

#### 4.2.3 Trend Views

Accessible from the dashboard via tab navigation. These views show weekly, monthly, and custom-range charts for: macro intake trends (line charts), calorie surplus/deficit vs. target, weight training volume trends, Fitbit metrics (sleep quality, step counts, resting heart rate), and correlations (e.g., sleep quality vs. calorie intake).

---

### 4.3 Workout Tracking (Priority: High)

#### 4.3.1 Workout Templates

Users can create reusable workout templates (e.g., "Push Day A", "Leg Day") with pre-loaded exercises. When starting a workout from a template, the app pre-fills exercises and shows last session's weights and reps as reference.

| Data Point | Type | Notes |
|-----------|------|-------|
| Exercise name | Text (from database + custom) | Searchable exercise database with muscle group tags |
| Sets | Integer | Number of sets performed |
| Reps per set | Integer array | Individual rep count per set (e.g., 12, 10, 8) |
| Weight per set | Decimal array | Weight used per set in kg or lbs (user preference) |
| Rest time | Duration (optional) | Rest between sets, can auto-time |
| Notes | Free text (optional) | Form notes, how it felt, etc. |

#### 4.3.2 Progressive Overload Charts

For each exercise, the app generates charts showing progression over time: estimated one-rep max (1RM) trend using the Epley formula, total volume per session (sets × reps × weight), and personal records highlighted. These charts are the primary motivational and analytical tool for weight training progress.

#### 4.3.3 Ad-Hoc Exercises

Beyond templates, users can log exercises freestyle — useful for days when the routine changes or for trying new exercises. These can optionally be saved to a template afterward.

---

### 4.4 Blood Test Analysis (Priority: Medium)

#### 4.4.1 PDF Upload and Parsing

Users upload their blood test result PDFs (typically from annual checkups). The backend processes them through Claude's document understanding capabilities to extract structured lab data.

Extracted data includes but is not limited to:

- **Lipid panel:** Total cholesterol, LDL, HDL, triglycerides
- **Blood sugar:** Fasting glucose, HbA1c
- **Vitamins:** Vitamin D, B12, iron/ferritin
- **Metabolic:** Liver enzymes (ALT, AST), kidney markers (creatinine, BUN)
- **Hormones:** Testosterone, thyroid (TSH, T3, T4) if present

#### 4.4.2 Trend Tracking

Each upload is timestamped, and values are stored for longitudinal tracking. The app displays charts showing how each marker changes over time, with reference ranges clearly indicated. Out-of-range values are flagged visually.

#### 4.4.3 AI Correlations

The AI insights engine correlates blood test trends with nutrition and exercise data. Examples of possible insights: "Your LDL cholesterol decreased 15% since your last test. During this period, your average daily fiber intake increased by 8g and you averaged 3 cardio sessions per week." or "Your vitamin D levels are below optimal range. Consider supplementation or increased sun exposure."

> *Important: All health insights include a disclaimer that they are informational only and not medical advice. Users are encouraged to discuss findings with their healthcare provider.*

---

### 4.5 AI Health Insights (Priority: Medium)

A dedicated section in the app that provides AI-generated observations and suggestions based on the user's aggregated health data. Insights are generated periodically (weekly) and on-demand.

#### Categories of Insights

- **Nutrition patterns:** Identifying consistent macro deficits/surpluses, suggesting adjustments based on goals.
- **Recovery correlations:** Correlating sleep quality with training volume and suggesting deload periods.
- **Trend alerts:** Flagging significant changes in resting heart rate, step count patterns, or macro adherence.
- **Goal progress:** Weekly summaries of adherence to calorie/macro targets with encouragement and practical tips.
- **Blood test integration:** When lab data is available, correlating lifestyle data with biomarker trends.

#### Privacy and AI Processing

All AI processing happens through the user's own backend. Data sent to the Claude API includes only the health metrics needed for analysis — no personally identifiable information beyond what's necessary. The backend strips names and identifying details before making API calls. Users can review exactly what data is sent in an "AI transparency" settings page.

---

## 5. Technical Stack

### 5.1 Mobile Application

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | React Native with Expo | Leverage existing React/TypeScript skills; 2–3x faster to MVP than Kotlin; iOS expansion possible |
| UI Library | React Native Paper or Tamagui | Material Design components for Android-native feel; consistent with dark-mode aesthetic |
| Navigation | Expo Router | File-based routing, familiar from web development |
| State Management | Zustand + React Query | Zustand for local state; React Query for server state with offline caching |
| Camera/Barcode | expo-camera + expo-barcode-scanner | Native camera access for food photos and barcode scanning |
| Health Connect | react-native-health-connect | Android Health Connect SDK bridge for reading Fitbit/wearable data |
| Charts | Victory Native or react-native-chart-kit | Rich charting for macro trends and progressive overload visualization |
| Offline Storage | WatermelonDB or SQLite | Local-first data model with sync capabilities |

### 5.2 Backend

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Runtime | Node.js with TypeScript | Same language as frontend; shared type definitions via tRPC |
| Framework | Fastify | High performance, excellent TypeScript support, familiar from FinCherry |
| API Layer | tRPC | End-to-end type safety between mobile app and backend |
| Database | PostgreSQL | Robust, handles complex queries for trend analysis and correlations |
| ORM | Drizzle ORM | Type-safe, lightweight, familiar from FinCherry project |
| AI Integration | Anthropic Claude API (Sonnet) | Vision capabilities for food/label recognition; document parsing for blood tests; text analysis for insights |
| Food Database | Open Food Facts API + local cache | Free, open-source, extensive international food data for barcode lookups |
| Authentication | Simple token-based (v1) | Single-user MVP; upgrade to OAuth/JWT for multi-user |
| Deployment | Docker Compose on Hostinger VPS | Consistent with planned infrastructure; migrate to cloud if scaling |

### 5.3 External Integrations

| Integration | Direction | Data | API |
|-------------|-----------|------|-----|
| Google Health Connect | Read | Steps, sleep, heart rate, exercises | Health Connect SDK (Android) |
| Fitbit Web API | Write | Food logs (calories, macros) | OAuth 2.0 + REST API |
| Anthropic Claude | Request/Response | Food photos, nutrition labels, blood test PDFs, insight prompts | Claude API (claude-sonnet-4-5) |
| Open Food Facts | Read | Barcode → nutrition data | REST API (free, no auth) |
| Nutritionix (or alt) | Read | Restaurant food nutrition data | REST API (freemium) |

---

## 6. Data Model

The following outlines the core database entities. All tables include standard `id`, `created_at`, and `updated_at` fields. The schema is designed for single-user MVP with a `user_id` foreign key on all tables to enable multi-user expansion without schema changes.

### 6.1 Core Entities

#### food_logs

The central table for all food entries regardless of logging method.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID (FK) | References users table (future multi-user) |
| meal_type | ENUM | breakfast, lunch, dinner, snack |
| logged_at | TIMESTAMP | When the food was consumed |
| source | ENUM | label_scan, barcode, photo_ai, restaurant, manual, quick_log |
| food_name | VARCHAR | Name of the food item |
| calories | DECIMAL | Total calories |
| protein_g | DECIMAL | Protein in grams |
| carbs_g | DECIMAL | Carbohydrates in grams |
| fat_g | DECIMAL | Fat in grams |
| fiber_g | DECIMAL | Fiber in grams |
| sugar_g | DECIMAL | Sugar in grams |
| sodium_mg | DECIMAL | Sodium in milligrams |
| serving_size | VARCHAR | Description of serving size |
| servings | DECIMAL | Number of servings consumed |
| photo_url | VARCHAR (nullable) | Reference to food/label photo if applicable |
| fitbit_synced | BOOLEAN | Whether this entry has been synced to Fitbit |
| ai_confidence | DECIMAL (nullable) | AI confidence score for photo-based entries |

#### food_database (personal)

Cached foods from previous logs, barcode scans, and label scans for quick re-logging.

| Column | Type | Description |
|--------|------|-------------|
| barcode | VARCHAR (nullable) | Product barcode if applicable |
| name | VARCHAR | Food name |
| brand | VARCHAR (nullable) | Brand or restaurant name |
| default_macros | JSONB | Full macro breakdown per serving |
| is_favorite | BOOLEAN | Starred for quick access |
| use_count | INTEGER | Times logged, for sorting recents |

#### workout_templates

| Column | Type | Description |
|--------|------|-------------|
| name | VARCHAR | Template name (e.g., Push Day A) |
| exercises | JSONB | Ordered list of exercises with target sets/reps |
| muscle_groups | TEXT[] | Primary muscle groups targeted |
| estimated_duration | INTEGER | Estimated duration in minutes |

#### workout_sessions

| Column | Type | Description |
|--------|------|-------------|
| template_id | UUID (FK, nullable) | References workout_template if from template |
| started_at | TIMESTAMP | Session start time |
| ended_at | TIMESTAMP (nullable) | Session end time |
| notes | TEXT (nullable) | Session-level notes |

#### workout_sets

| Column | Type | Description |
|--------|------|-------------|
| session_id | UUID (FK) | References workout_session |
| exercise_name | VARCHAR | Exercise performed |
| set_number | INTEGER | Set order within exercise |
| reps | INTEGER | Reps completed |
| weight_kg | DECIMAL | Weight used |
| rest_seconds | INTEGER (nullable) | Rest after this set |
| notes | TEXT (nullable) | Set-level notes |

#### blood_tests

| Column | Type | Description |
|--------|------|-------------|
| test_date | DATE | Date blood was drawn |
| lab_name | VARCHAR (nullable) | Laboratory name |
| pdf_url | VARCHAR | Reference to uploaded PDF |
| parsed_results | JSONB | Structured extraction of all lab values with reference ranges |
| ai_analysis | TEXT (nullable) | AI-generated analysis/correlations |

#### health_metrics (from Health Connect)

| Column | Type | Description |
|--------|------|-------------|
| date | DATE | Metric date |
| metric_type | ENUM | steps, sleep_minutes, sleep_score, resting_hr, active_minutes, calories_burned |
| value | DECIMAL | Metric value |
| source | VARCHAR | Data source (fitbit, google_fit, manual) |

#### ai_insights

| Column | Type | Description |
|--------|------|-------------|
| generated_at | TIMESTAMP | When insight was generated |
| category | ENUM | nutrition, recovery, trend_alert, goal_progress, blood_test |
| title | VARCHAR | Short insight title |
| body | TEXT | Full insight text |
| data_range | DATERANGE | Period of data this insight covers |
| is_read | BOOLEAN | Whether user has seen this insight |

---

## 7. API Design

The API uses tRPC for end-to-end type safety. Below are the primary router namespaces and their key procedures.

| Router | Procedure | Type | Description |
|--------|-----------|------|-------------|
| food | food.log | Mutation | Create a food log entry from any source |
| food | food.scanLabel | Mutation | Send label photo for OCR extraction |
| food | food.scanBarcode | Query | Look up barcode in food databases |
| food | food.analyzePhoto | Mutation | Send food photo for AI recognition |
| food | food.searchRestaurant | Query | Search restaurant foods |
| food | food.getDaily | Query | Get all food logs for a date |
| food | food.getTrends | Query | Get macro trends for date range |
| food | food.favorites | Query | Get favorited/recent foods |
| workout | workout.createTemplate | Mutation | Create or update workout template |
| workout | workout.logSession | Mutation | Log a complete workout session |
| workout | workout.getHistory | Query | Get workout history with progressive overload data |
| workout | workout.getExerciseProgress | Query | Get trend data for a specific exercise |
| health | health.syncHealthConnect | Mutation | Pull latest data from Health Connect |
| health | health.syncToFitbit | Mutation | Write food logs to Fitbit API |
| health | health.getDashboard | Query | Get complete daily dashboard data |
| health | health.getTrends | Query | Get health metrics trends |
| blood | blood.uploadTest | Mutation | Upload and parse blood test PDF |
| blood | blood.getHistory | Query | Get all blood test results over time |
| blood | blood.getCorrelations | Query | Get AI correlations with lifestyle data |
| insights | insights.generate | Mutation | Trigger AI insight generation |
| insights | insights.getRecent | Query | Get recent insights |

---

## 8. UI/UX Design Principles

### 8.1 Design Philosophy

CherryFit's interface follows three core principles: **speed** (minimum taps to accomplish any task), **clarity** (macros always visible, never buried), and **delight** (a premium dark-mode experience with vibrant accent colors that make health tracking feel modern and exciting).

### 8.2 Visual Design System

The visual language is inspired by a modern dark-mode aesthetic with color-blocked accent cards, vibrant mint/emerald highlights, and clean geometric typography. The overall feel is premium, minimal, and high-contrast — bright accents pop against deep dark surfaces.

#### 8.2.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0D0D11` | Main app background, deepest layer |
| `--bg-card` | `#1A1A2E` | Card surfaces, elevated containers |
| `--bg-card-elevated` | `#252535` | Modals, sheets, elevated cards |
| `--accent-mint` | `#2ECFA0` | Primary accent — CTAs, active states, progress rings, FAB, success indicators |
| `--accent-lavender` | `#B898FF` | Secondary accent — workout cards, insight highlights, tags |
| `--accent-yellow` | `#E8D44D` | Tertiary accent — badges, small highlights, warning indicators, icons |
| `--accent-cherry` | `#D4365C` | Brand accent — logo, onboarding, calorie deficit warnings. Ties to the Cherry brand family |
| `--text-primary` | `#FFFFFF` | Primary text on dark backgrounds |
| `--text-secondary` | `#A0A0B0` | Labels, descriptions, secondary info |
| `--text-muted` | `#6B6B80` | Disabled states, timestamps, tertiary text |
| `--success` | `#2ECFA0` | On-target, goals met (aliases `--accent-mint`) |
| `--warning` | `#E8D44D` | Approaching limits, soft alerts (aliases `--accent-yellow`) |
| `--danger` | `#D4365C` | Over-limit, errors (aliases `--accent-cherry`) |
| `--border` | `#2A2A3E` | Subtle card borders, dividers |

#### 8.2.2 Color-Blocked Cards

Following the reference design, CherryFit uses color-filled accent cards for key information at a glance:

- **Mint green cards:** Today's macro totals, active workout session, Fitbit sync status, success/completion states.
- **Lavender cards:** Workout templates, AI insight previews, blood test summary.
- **Yellow badges/pills:** Meal type labels, streak counts, notification dots, icon accents.
- **Cherry accents:** Logo mark, calorie over-budget warnings, onboarding highlights.
- **Dark cards (default):** Most content lives on dark card surfaces with white text and accent-colored data points.

#### 8.2.3 Typography

| Level | Font | Weight | Size | Usage |
|-------|------|--------|------|-------|
| Display | Inter | Bold (700) | 32–48px | Large numbers on dashboard (calorie count, step count, 1RM) |
| Heading 1 | Inter | SemiBold (600) | 24px | Screen titles, section headers |
| Heading 2 | Inter | SemiBold (600) | 18px | Card titles, subsection headers |
| Body | Inter | Regular (400) | 16px | Descriptions, meal names, form labels |
| Caption | Inter | Medium (500) | 13px | Timestamps, secondary labels, units |
| Overline | Inter | SemiBold (600) | 11px, uppercase | Category labels, tab titles, tags |

**Font choice:** [Inter](https://rsms.me/inter/) — free, open-source, designed for screens, excellent at small sizes, geometric clarity that matches the reference aesthetic. Available on Google Fonts for easy integration with React Native.

#### 8.2.4 Spacing and Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Buttons, input fields, small chips |
| `--radius-md` | 12px | Inner cards, list items |
| `--radius-lg` | 16px | Main cards, modals |
| `--radius-xl` | 20px | Feature cards, onboarding panels |
| `--space-xs` | 4px | Tight padding |
| `--space-sm` | 8px | Between related elements |
| `--space-md` | 16px | Standard card padding, section gaps |
| `--space-lg` | 24px | Between sections |
| `--space-xl` | 32px | Screen-level padding, major sections |

#### 8.2.5 Iconography

Minimal line icons in white or accent colors. Use [Lucide Icons](https://lucide.dev/) (free, consistent stroke weight, React Native compatible). Icon stroke weight: 1.5px for standard, 2px for active/selected states.

### 8.3 Navigation Structure

| Tab | Screen | Primary Content |
|-----|--------|----------------|
| Home | Daily Dashboard | Macro rings, meal timeline, Fitbit cards, quick-log FAB |
| Trends | Charts & Analysis | Weekly/monthly macro trends, weight training progress, health correlations |
| Workouts | Training Hub | Active workout logging, templates, exercise library, progressive overload charts |
| Insights | AI Intelligence | Weekly AI summaries, blood test analysis, actionable suggestions |
| Profile | Settings & Data | Goals, preferences, blood test uploads, Fitbit connection, data export |

### 8.4 Key Screen Compositions

#### Daily Dashboard

The home screen uses the card-based dark layout with color accents:

- **Top section:** Greeting + date. Large display-weight calorie count with circular mint progress ring.
- **Macro bar row:** Four horizontal mini-cards for protein (mint), carbs (lavender), fat (yellow badge), fiber (muted). Each shows current/target with thin progress bar.
- **Fitbit strip:** Horizontal scroll of small dark cards with accent-colored data: steps (mint number), sleep (lavender number), heart rate (cherry number).
- **Meal timeline:** Vertical list of dark cards with meal type pill (yellow badge), food name, and inline macro summary.
- **FAB:** Mint-colored floating action button (bottom right) that expands into: Scan Label, Scan Barcode, Photo, Search, Manual.

#### Workout Session

- Active workout uses a mint-accented header card showing current exercise, set count, and timer.
- Each set logged appears as a dark card row with weight and reps in display-weight numbers.
- Previous session's data shown in muted text for reference.

---

## 9. Security and Privacy

### 9.1 Data Protection

- **In transit:** All API communication over HTTPS. TLS 1.3 enforced on VPS.
- **At rest:** PostgreSQL encryption for sensitive data. Blood test PDFs stored encrypted.
- **AI privacy:** PII stripped before sending data to Claude API. No names, email, or account IDs included in AI prompts. An AI transparency page shows users exactly what data is sent.
- **Authentication:** Simple token-based auth for v1 (single user). Upgrade path to OAuth 2.0/JWT for multi-user.

### 9.2 Fitbit API Security

Fitbit API access uses OAuth 2.0 with PKCE flow. Refresh tokens are stored encrypted in the backend database. Token refresh is handled automatically by the backend, and the mobile app never directly holds Fitbit credentials.

### 9.3 Health Data Disclaimer

> *CherryFit is a personal health tracking tool and does not provide medical advice. All AI-generated insights include clear disclaimers. Blood test analysis is informational only and users are directed to consult healthcare providers for medical decisions. The app does not claim to diagnose, treat, or prevent any medical condition.*

---

## 10. Development Workflow and CI/CD

### 10.1 Git Workflow Rules

All development follows a strict branch-based workflow to keep `main` stable and deployable at all times.

#### Branch Naming Convention

| Branch Type | Pattern | Example |
|-------------|---------|---------|
| Feature | `feat/name-of-the-task` | `feat/nutrition-label-ocr` |
| Bug fix | `fix/description` | `fix/fitbit-sync-timeout` |
| Chore | `chore/description` | `chore/update-dependencies` |

#### Task Completion Checklist

Every task, before being considered complete, **must** pass the following:

1. **Work in a feature branch:** Start from latest `main`, create `feat/name-of-the-big-task`.
2. **Lint passes with zero warnings and zero errors:** Run `pnpm lint` (ESLint + Prettier) — no warnings, no errors.
3. **Type check passes with zero warnings and zero errors:** Run `pnpm typecheck` (TypeScript strict mode) — no warnings, no errors.
4. **Build succeeds:** Run `pnpm build` for backend; `expo build` / `eas build` commands for mobile.
5. **Git add and commit:** Use conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`).
6. **Request review:** Agent asks Sam to review the changes with a summary of what was done.
7. **Sam pushes:** Only Sam pushes to remote after review approval.

> **Note for AI coding agents:** After completing all automated checks (lint, typecheck, build), always stop and present Sam with: a summary of changes, any files added/modified/deleted, and a prompt to review and push. Never push to remote automatically.

### 10.2 GitHub Actions CI Pipeline

The repository includes GitHub Actions workflows that run on every push and pull request.

#### CI Workflow (`.github/workflows/ci.yml`)

Triggers on every push to any branch and every pull request to `main`:

1. **Install dependencies:** `pnpm install --frozen-lockfile`
2. **Lint:** `pnpm lint` — ESLint + Prettier check. Must pass with zero warnings/errors.
3. **Type check:** `pnpm typecheck` — TypeScript compilation check (no emit). Must pass clean.
4. **Build (backend):** `pnpm build:backend` — Compile Fastify backend.
5. **Build (mobile):** Type-check and bundle validation for React Native (Expo).
6. **Tests:** `pnpm test` — Run all unit and integration tests (when tests exist).

#### Additional CI Jobs

- **Dependency audit:** `pnpm audit` on PRs to flag known vulnerabilities.
- **Bundle size check:** Track React Native bundle size to prevent bloat.
- **Expo Doctor:** `npx expo-doctor` to validate Expo configuration.

### 10.3 Conventional Commits

All commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `chore:` | Maintenance, config changes, dependency updates |
| `docs:` | Documentation changes |
| `style:` | Code formatting (no logic change) |
| `refactor:` | Code restructuring (no behavior change) |
| `test:` | Adding or updating tests |

---

## 11. Deployment Strategy

### 11.1 Infrastructure Overview

| Component | Environment | Hosting |
|-----------|-------------|---------|
| Backend API | Production | Hostinger VPS, Docker Compose |
| PostgreSQL | Production | Docker container on VPS (with volume backup) |
| Mobile App | Production | Google Play Store (Android) |
| Mobile App | Development | Expo Dev Client / EAS Build (internal distribution) |

### 11.2 Per-Phase Deployment Steps

Each phase has a deployment checkpoint. At the end of each phase, the agent will remind Sam with a complete step-by-step deployment guide.

#### Phase 1 Deployment (Core Food Logging MVP)

> **🍒 SAM ACTION REQUIRED — Phase 1 Deployment**
>
> When Phase 1 tasks are complete, follow these steps:
>
> 1. **Backend deployment:**
>    - SSH into Hostinger VPS
>    - Clone repo: `git clone <repo-url>`
>    - Copy `.env.production` with: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `JWT_SECRET`
>    - Run `docker compose up -d` (starts Fastify + PostgreSQL)
>    - Run `pnpm db:migrate` to apply Drizzle migrations
>    - Verify API health: `curl https://api.cherryfit.dev/health`
>
> 2. **Domain + SSL:**
>    - Point `api.cherryfit.dev` A record to VPS IP
>    - Caddy or nginx-proxy handles auto-SSL via Let's Encrypt
>
> 3. **Mobile app (internal testing):**
>    - Run `eas build --platform android --profile preview`
>    - Install APK on personal device via EAS internal distribution
>    - Test all food logging flows end-to-end
>
> 4. **Verify Fitbit OAuth (if Phase 2 prep):**
>    - Register app at dev.fitbit.com
>    - Get OAuth 2.0 client ID and secret
>    - Add redirect URI for your backend

#### Phase 2 Deployment (Wearable Integration + Barcode)

> **🍒 SAM ACTION REQUIRED — Phase 2 Deployment**
>
> 1. Update backend on VPS: `git pull && docker compose up -d --build`
> 2. Run new migrations: `pnpm db:migrate`
> 3. **Fitbit API setup:**
>    - Add `FITBIT_CLIENT_ID` and `FITBIT_CLIENT_SECRET` to `.env.production`
>    - Complete OAuth flow from the app to authorize your Fitbit account
> 4. **Health Connect permissions:**
>    - Ensure Health Connect is installed on device
>    - Grant CherryFit read permissions for: steps, sleep, heart rate, exercise
> 5. Build new APK: `eas build --platform android --profile preview`
> 6. Test: log a meal → verify it appears in Fitbit; check Health Connect data on dashboard

#### Phase 3 Deployment (Workouts + AI Photos)

> **🍒 SAM ACTION REQUIRED — Phase 3 Deployment**
>
> 1. Update backend: `git pull && docker compose up -d --build && pnpm db:migrate`
> 2. No new external API keys needed (still using Claude API)
> 3. Build APK: `eas build --platform android --profile preview`
> 4. Test: create a workout template, log a session, verify progressive overload chart
> 5. Test: take food photo → verify AI estimation → confirm/adjust flow
> 6. **Consider: this is a good checkpoint for first Play Store submission** (see Section 12)

#### Phase 4 Deployment (Blood Tests + AI Insights)

> **🍒 SAM ACTION REQUIRED — Phase 4 Deployment**
>
> 1. Update backend: `git pull && docker compose up -d --build && pnpm db:migrate`
> 2. Verify Claude API has document/PDF processing enabled on your plan
> 3. Build APK: `eas build --platform android --profile production`
> 4. Test: upload a blood test PDF → verify extraction → check trend charts
> 5. Test: trigger AI insight generation → review output quality
> 6. **Final Play Store release** (see Section 12)

### 11.3 Backend Docker Compose Structure

```yaml
services:
  api:
    build: ./apps/backend
    ports: ["3000:3000"]
    env_file: .env.production
    depends_on: [db]
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: cherryfit
      POSTGRES_USER: cherryfit
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

volumes:
  pgdata:
```

---

## 12. Play Store Release Strategy

### 12.1 Recommended Approach: Incremental Releases

CherryFit will use **incremental releases** aligned with the development phases. This is recommended over a single big-bang release for several reasons: it forces discipline around production-readiness at each phase; it gets the core value (food logging) into daily use as early as possible; it builds Play Store presence and review history gradually; and it allows user feedback (even if just Sam) to shape later phases.

#### Release Schedule

| Version | Phase | What's Included | Play Store Track |
|---------|-------|-----------------|------------------|
| 0.1.0 | Phase 1 | Food logging (label OCR, manual, quick-log), dashboard, goals | Internal Testing |
| 0.2.0 | Phase 2 | + Fitbit sync, Health Connect, barcode scanning, basic trends | Internal Testing → Closed Testing |
| 0.3.0 | Phase 3 | + Workout tracking, AI food photos, restaurant search | Closed Testing |
| 1.0.0 | Phase 4 | + Blood tests, AI insights, data export. Full feature set | Production (Public) |

#### Versioning Convention

Follows SemVer: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes or major rewrites (1.0.0 = first public release)
- **MINOR:** New features (0.1.0 → 0.2.0 for each phase)
- **PATCH:** Bug fixes and small improvements (0.1.1, 0.1.2)

### 12.2 Play Store Setup Checklist

> **🍒 SAM ACTION REQUIRED — Play Store Setup (Do Before Phase 1 Completion)**
>
> This should be done early so the account is ready when the first build is:
>
> 1. **Create Google Play Developer account:**
>    - Go to play.google.com/console
>    - Pay one-time $25 USD registration fee
>    - Complete identity verification (may take 2–7 days)
>
> 2. **Create the CherryFit app listing:**
>    - App name: "CherryFit" (or working title, can change later)
>    - Default language: English
>    - App category: Health & Fitness
>    - Content rating: complete the questionnaire
>
> 3. **Prepare store listing assets:**
>    - App icon: 512x512 PNG (cherry-themed, mint accent on dark)
>    - Feature graphic: 1024x500 PNG
>    - Screenshots: minimum 2 phone screenshots (can be from dev builds)
>    - Short description: "Your health command center — smart food logging, workout tracking, and AI insights."
>    - Privacy policy URL: host a simple privacy policy page
>
> 4. **Configure signing:**
>    - Use Google Play App Signing (recommended)
>    - Generate upload keystore: `eas credentials` handles this
>
> 5. **Set up internal testing track:**
>    - Add your own email as a tester
>    - This allows deploying builds without full store review

### 12.3 EAS Build Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 13. Agent-to-Sam Interaction Protocol

### 13.1 When the Agent Must Ask Sam

The AI coding agent (Claude Code or similar) must always pause and request Sam's input in the following situations. Each reminder includes **all steps necessary** so Sam has full context.

| Trigger | What to Remind Sam |
|---------|--------------------|
| **Feature branch ready for review** | Summary of changes, files modified, lint/typecheck results. Ask Sam to review, then `git push` |
| **Environment variables needed** | Exact variable names, where to get the values (API dashboards, etc.), which `.env` file to add them to |
| **External API registration** | Step-by-step: go to URL, create account, register app, copy keys, add to env |
| **Deployment checkpoint (per phase)** | Full deployment steps (see Section 11.2), including SSH commands, migration, verification |
| **Play Store submission** | Build command, submission steps, what to check in Play Console, expected review time |
| **OAuth flow completion** | Which URL to visit, what permissions to grant, how to verify the connection works |
| **Manual device testing needed** | What to install, what flows to test, what to look for, how to report issues |
| **Design decision needed** | Present options with tradeoffs, ask Sam to choose |

### 13.2 Reminder Format

All agent reminders follow this template:

```
🍒 SAM ACTION REQUIRED — [Title]

What: [Brief description of what needs to happen]
Why: [Why this is needed right now]

Steps:
1. [Specific step with exact commands or URLs]
2. [Next step]
3. [...]

After you're done: [What to tell the agent so it can continue]
```

### 13.3 What the Agent Does Autonomously

The agent handles the following without asking Sam:

- Writing code, creating files, organizing project structure
- Running lint, typecheck, and build commands
- Running tests
- Git add and git commit (with conventional commit messages)
- Debugging errors and fixing issues
- Reading documentation and researching solutions
- Creating or updating configuration files

The agent **never** does the following without Sam's explicit approval:

- Push to remote (`git push`)
- Deploy to production
- Create or modify cloud resources
- Submit to app stores
- Add or change API keys or secrets
- Make irreversible data changes

---

## 14. MVP Phasing Strategy

The project is divided into four phases, with each phase delivering a usable increment. Phase 1 is the MVP — the minimum set of features that would make CherryFit useful every single day.

### Phase 1: Core Food Logging MVP (Weeks 1–4)

**Goal:** Replace Fitbit's food section for daily use.

- **Nutrition label OCR:** Camera → label scan → auto-fill macros → save. This is the killer feature.
- **Manual entry:** Fast form with all seven macro fields.
- **Quick log:** Recent meals and favorites for one-tap re-logging.
- **Daily dashboard:** Macro progress rings, meal timeline, daily totals.
- **Goal setting:** Set daily calorie and macro targets.
- **Local storage:** All data stored locally with backend sync.
- **CI/CD setup:** GitHub Actions pipeline, lint/typecheck/build checks.
- **Play Store internal testing:** First APK uploaded for personal use.

### Phase 2: Wearable Integration + Barcode (Weeks 5–7)

**Goal:** Connect to Fitbit ecosystem and add barcode scanning.

- **Health Connect integration:** Read steps, sleep, heart rate, exercises.
- **Fitbit write-back:** Sync food logs to Fitbit API.
- **Barcode scanning:** Open Food Facts lookup with local caching.
- **Dashboard enrichment:** Fitbit data cards on home screen.
- **Basic trend charts:** Weekly macro and calorie trends.

### Phase 3: Workout Tracking + AI Food Photos (Weeks 8–10)

**Goal:** Complete the exercise tracking and expand food logging methods.

- **Workout templates:** Create, edit, and log from templates.
- **Set/rep/weight logging:** Full workout session tracking.
- **Progressive overload charts:** Exercise-specific progress visualization.
- **AI food photo recognition:** Photo → AI estimation → confirm/adjust.
- **Restaurant food search:** Database lookup for chain restaurants.

### Phase 4: Blood Tests + AI Insights (Weeks 11–12+)

**Goal:** Add the intelligence layer.

- **Blood test PDF upload:** Upload → parse → extract lab values.
- **Lab value tracking:** Longitudinal charts with reference ranges.
- **AI insights engine:** Weekly automated insights across all data sources.
- **AI correlations:** Blood test trends correlated with nutrition and exercise.
- **Data export:** Export all data as CSV/JSON for portability.
- **Production Play Store release:** v1.0.0 to public track.

---

## 15. Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Fitbit API access restricted or deprecated by Google | High | Health Connect as primary data source; Fitbit write-back as best-effort feature that degrades gracefully |
| AI food photo recognition accuracy is poor for complex meals | Medium | Set user expectations clearly (show as estimates); prioritize label OCR and barcode as primary methods; allow easy manual correction |
| Claude API costs for frequent food photo/label analysis | Medium | Cache aggressively; batch requests; use label OCR only for first scan of each food (then cache); monitor API usage |
| Health data sensitivity and privacy concerns | Medium | Strip PII before AI calls; encrypt at rest; AI transparency page; self-hosted backend gives full data control |
| React Native Health Connect bridge maturity | Low–Med | Test early in Phase 1; have fallback to direct Fitbit API read if bridge is unreliable |
| Scope creep from feature richness | Medium | Strict phase discipline; Phase 1 must be daily-usable before moving to Phase 2; resist adding features outside current phase |
| Single developer bottleneck | Medium | AI coding tools (Claude Code) to accelerate development; modular architecture allows parallel feature development |
| Play Store review rejection | Low | Follow Material Design guidelines; complete privacy policy; accurate content rating; health app disclaimers in place |

---

## 16. Success Metrics

Since CherryFit starts as a personal tool, success is measured by daily utility and data quality rather than traditional product metrics.

| Metric | Target | How Measured |
|--------|--------|-------------|
| Daily active logging | Log all meals every day for 30+ consecutive days | Food log entries per day |
| Logging speed | Average under 15 seconds per food entry (label/barcode) | Time from app open to saved entry |
| Macro accuracy | Label OCR extracts correctly 95%+ of the time | Manual correction rate after OCR |
| Fitbit sync reliability | Food logs appear on Fitbit within 5 minutes of saving | Sync success rate and latency |
| Workout adherence | Log all weight training sessions with full set detail | Session completion rate |
| Insight quality | AI insights feel actionable, not generic | Subjective assessment |
| CI pipeline health | All PRs pass lint + typecheck + build with zero warnings | GitHub Actions pass rate |

---

## 17. Future Considerations

These features are explicitly out of scope for the current build but are noted for potential future development:

- **Multi-user support:** Authentication, user profiles, data isolation. Architecture supports this via user_id foreign keys.
- **iOS release:** React Native enables this with minimal additional work. Expo EAS Build handles distribution.
- **Social features:** Share workouts, meal plans, or progress with friends or a coach.
- **Wearable expansion:** Support for Garmin, Apple Watch, or other wearables via Health Connect.
- **Meal planning:** AI-generated meal plans based on macro targets and food preferences.
- **Integration with grocery apps:** Auto-add scanned foods to shopping lists.
- **App store release (iOS):** If CherryFit proves valuable, submit to App Store alongside Play Store.
- **Multi-language support:** Portuguese and French translations for broader reach.
- **Rebrand:** If expanding beyond personal use, consider renaming from CherryFit to a market-ready brand.

---

*— End of Document —*
