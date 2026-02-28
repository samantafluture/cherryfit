# CherryFit

Personal health management Android app extending the Fitbit ecosystem with intelligent food logging, workout tracking, blood test insights, and AI-powered health intelligence.

## Tech Stack

- **Mobile:** React Native (Expo SDK 52) + Expo Router + TypeScript
- **Backend:** Fastify + tRPC + Drizzle ORM + PostgreSQL
- **AI:** Google Gemini API (vision + text)
- **Shared:** Zod schemas + TypeScript types

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (Docker)
docker compose up -d

# Start backend
cd apps/backend && pnpm dev

# Start mobile
cd apps/mobile && npx expo start
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm build:backend` | Build backend |
| `pnpm format` | Format with Prettier |
