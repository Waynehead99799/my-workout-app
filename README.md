## Workout Tracker

Mobile-first workout tracker built with Next.js and MongoDB.

## Features
- Multi-user login (NextAuth credentials).
- Daily set-level logging (weight/reps/RPE).
- Calendar with strict done status (all required sets completed).
- Cycle restart and latest-vs-previous comparison.
- Inline autoplay-muted looping YouTube embeds for exercise/substitutions.

## Setup
1. Create `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
MONGODB_DB=workout_tracker
NEXTAUTH_SECRET=replace-with-a-long-random-secret
NEXTAUTH_URL=http://localhost:3000
```

2. Install dependencies and run:

```bash
npm install
npm run dev
```

3. Open `http://localhost:3000`.

## Usage
- Sign up and login.
- Use Calendar and Workout screens to log sets.
- Day is marked done only when all warm-up and working sets are logged.
- Start a new cycle in Settings and compare against previous cycle.
- YouTube autoplay can vary by browser policy, so embeds use muted loop parameters.
