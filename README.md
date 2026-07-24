# Summer Kids App

A gamified, neon-arcade web app that turns daily math practice into an adventure
for two kids — **Alex** (Grade 8, ⚡ Battle) and **Katya** (Grade 5, 🔍 Mystery) —
with a PIN-protected **Parent** dashboard for oversight and reward approvals.

Built as a single-page **Vite** app. Almost all logic and markup live in
`index.html`, state is stored in `localStorage`, and it deploys to **Vercel**.

## Philosophy

> **Responsibilities remain — effort earns privileges.**

Rewards are privileges, family experiences, choices, and positive motivation —
**never exemptions** from practice, chores, or the day's responsibilities.
There are no "skip practice", "skip chore", or "skip day" rewards.

## Run locally

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Math Thinking System

The production Math Thinking system provides 150 curriculum strategies, progressive
wrong-answer teaching, Pattern Hunter, mastery-gated Math Secrets, spaced reviews,
error-pattern evidence, and PIN-gated parent analytics. Architecture and extension
guidance are documented in [`docs/MATH_THINKING_SYSTEM.md`](docs/MATH_THINKING_SYSTEM.md).

## Running tests

```bash
npm ci
npm run check
npm run build
```

`npm run check` runs JavaScript syntax checks and validates catalogue IDs, required
fields, grade ranges, prerequisites, and topic references.

## Deploy to Vercel

1. Push this branch to GitHub.
2. Import the repo in Vercel. Framework preset: **Vite**.
3. Build command `npm run build`, output directory `dist`. Deploy.

Hero images live in `public/img/` and are referenced by absolute path
(`/img/alex-hero.jpg`, `/img/katya-hero.jpg`), so they resolve from the web root
on Vercel. (When opening the built file directly via `file://` the images won't
load — that's expected; use `npm run preview` or Vercel for an accurate preview.)

## Login / profile structure

- The app opens on a **profile picker**: **Alex**, **Katya**, or **Parent**.
- Tapping **Alex** or **Katya** drops that child into their own dashboard, scoped
  to their own coins, XP, streaks, Adventure Keys, missions, and reward requests.
- Tapping **Parent** goes to a **PIN screen** (default PIN `1234`), then the parent
  admin dashboard. Kids cannot reach the parent dashboard without the PIN.
- The active profile is saved in `localStorage`. The **Switch** button in the top
  bar returns to the picker at any time.

There are no accounts and no backend — a profile is just a scoped local session.

## Currencies

- **Coins** reward effort and completed missions. They are the spendable currency,
  but only ever via a parent-approved request.
- **XP** is progression only. It is never spendable and is never deducted by a
  purchase.
- **Adventure Keys** come only from long-term consistency — they are awarded at
  streak milestones (3, 7, 14, and 30 days), never from a single task. Keys gate
  the premium rewards.

## Reward approval flow (step by step)

1. In the store, a child taps **Request Reward** on an item they can afford. Kids
   can never buy or redeem directly.
2. A request record is created and the item shows **Pending Parent Approval**.
   **No coins or keys are deducted at request time, and nothing is escrowed.**
3. The child can see their own request history: pending, approved, or declined.
   Duplicate pending requests for the same item are blocked, and a child can't
   request an item they can't currently afford.
4. In the parent dashboard, each pending request lists the child, reward, cost
   (coins + Adventure Keys for premium), and date.
5. **Approve** re-checks the child's balance at that moment and **only then**
   deducts coins (and keys, for premium rewards). If the balance changed and no
   longer covers it, approval is refused gracefully.
6. **Decline** deducts nothing and marks the request declined with a date.
7. The full request and purchase history persists across refreshes.

### Premium rewards (require BOTH currencies)

| Reward                | Coins | Adventure Keys |
|-----------------------|:-----:|:--------------:|
| $5 Reward             | 300   | 1              |
| $10 Gift Card         | 500   | 2              |
| $15 Game/App Purchase | 700   | 3              |

The request is disabled with a clear message unless the child has **both** the
coins and the keys; both are deducted only on parent approval.

## What parents can edit from the dashboard

- **Rewards Manager** — edit any reward's coin/key price, and enable/disable a
  reward (disabled rewards are hidden from the kids' store).
- **Adjustments** — manually adjust coins, XP, streak, and Adventure Keys per
  child, and mark a mission complete on a child's behalf.
- **Weekly Summary** — per-child view of missions done, coins available, coins
  spent (approved), keys, and streak status.
- **Settings** — change the parent PIN and toggle sound effects.

## Where data is stored

All state lives under a single `localStorage` key:

```
smbt-state-v2
```

This includes both children's stats, the active profile, the editable reward
catalog, every reward request, the parent PIN, and settings (e.g. mute).

> **Caveat:** storage is per-device and per-browser. Clearing browser data (or
> using a different device/browser) resets all progress.

## Sound & motion

Short, soft Web Audio cues play on task complete, coin earn, streak milestone,
Adventure Key award, request sent, and approval received. A global mute toggle
in parent settings is persisted. All animations use CSS transforms/opacity and
honor `prefers-reduced-motion`.
