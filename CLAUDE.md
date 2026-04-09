@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server (http://localhost:3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `next/core-web-vitals`)
- `node scripts/fix-programtemplates-from-json.js` — reseed/repair `ProgramTemplate` docs in MongoDB from `data/*.json`

There is no test runner configured.

## Required environment (`.env.local`)

`MONGODB_URI`, `MONGODB_DB`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Without these, both the dev server and the import script will fail.

## Architecture

Next.js App Router + NextAuth (credentials) + Mongoose. Mobile-first single-user-per-session workout tracker.

**Important: this repo uses Next.js 16 and React 19** — per `AGENTS.md`, do not assume older Next.js conventions. Read `node_modules/next/dist/docs/` before changing routing, server actions, caching, or config.

**Auth.** `src/auth.ts` configures NextAuth v5 (beta) with a Credentials provider against the `User` model (bcrypt). `src/lib/current-user.ts` is the server-side helper used by route handlers and RSC pages to get the active user. NextAuth session typing is augmented in `src/types/next-auth.d.ts`.

**Data model (`src/lib/models/`).**
- `User` — credentials account.
- `ProgramTemplate` — the static program definition (days, exercises, prescribed warm-up/working sets). Seeded from `data/*.json` via the script in `scripts/`.
- `WorkoutCycle` — a user's run through the program. Only one `isActive: true` per user (enforced by unique index; `getOrCreateActiveCycle` handles the 11000 race). `cycleIndex` increments on restart.
- `WorkoutSession` — one calendar day of training within a cycle.
- `SetLog` — individual logged set (weight/reps/RPE), the unit of progress tracking.
- `ExerciseChoice` — user's chosen substitution for an exercise within a cycle.

**Service layer.** `src/lib/services/workout.ts` is the single source of truth for cycle/session/day resolution: mapping a calendar date to a template day relative to `cycle.startedAt`, deciding when a day is "done" (strict: every prescribed warm-up and working set must be logged), and coordinating cycle restarts. Route handlers and client components should go through this rather than touching models directly.

**Routes.** Pages live under `src/app/{calendar,workout,dashboard,progress,settings,login}`; JSON APIs under `src/app/api/{auth,sessions,set-logs,cycles,compare,program,import}`. The `compare` endpoint/page powers latest-vs-previous-cycle comparison; `import` and the script consume `data/`.

**Client components** (`src/components/`) are the interactive shells (`calendar-client`, `workout-day-client`, `compare-client`, `restart-cycle`, `mobile-nav`, `topbar`, `session-provider`). Server pages fetch via the service layer and hand data down; mutations go back through `/api/*`.

**YouTube embeds** for exercise demos use muted-loop autoplay parameters intentionally — browser autoplay policies require this; don't "fix" by removing mute.
