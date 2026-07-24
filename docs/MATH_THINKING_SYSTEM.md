# Math Thinking System

## Architecture

`index.html` remains the application shell and owns profiles, missions, questions, rewards, parent access, persistence, and cloud sync. `math-secrets.js` is loaded once after the main application script and exposes one `window.MathThinkingSystem` adapter. `math-parent-report.js` consumes that adapter and renders only inside the existing PIN-gated Parent Dashboard. `public/service-worker.js` caches the production shell and Math Thinking assets.

The modules do not wrap or replace mission functions. The mission lifecycle calls `questionPresented` and `answerRecorded` explicitly, which prevents repeated listeners and makes the integration visible.

## State schema and migration

The storage key remains `smbt-state-v2`. Math Thinking data is additive:

```text
mathThinking
  version: 3
  migratedAt
  alex | katya
    updatedAt
    unlocked[]
    seen{}
    review{ strategyId: { stage, due, last, remembered } }
    events[]
    topic{}
    errors{}
    hintsUsed
    strategyViews
    usefulSelections
    patternAttempts
    patternUseful
```

Migration is idempotent. Missing objects are back-filled without replacing existing child, economy, mastery, request, PIN, settings, or profile data. Legacy `mathSecrets` unlock and review evidence is copied forward once. Cloud merge preserves the newest per-child Math Thinking snapshot.

## Curriculum catalogue

The catalogue contains 150 stable strategy records across Grades 4-8. Every record has:

- stable ID and title
- topic and strand
- minimum and maximum grade
- prerequisite strategy IDs
- explanation and worked example
- memory hook and common mistake
- Pattern Hunter question
- optional child-specific variants
- review tags

Run `npm test` to validate count, unique IDs, required fields, topic references, grade ranges, and prerequisites.

## Unlock and mastery rules

Level 1 strategies require two correct answers plus topic exposure. Level 2 requires five correct answers and its prerequisite. Level 3 requires nine correct answers and its prerequisite. This prevents advanced techniques from unlocking before the related foundation.

## Review algorithm

Successful use schedules review at approximately 1, 3, 7, 14, then 30 days. A forgotten reviewed strategy shortens the interval by one stage. Due topics receive extra mission-selection weight, so reviews appear inside future missions. A standalone “I remember” action is supplementary and is not the only review mechanism.

## Question integration

Questions use their real `topic`, optional `skill`, operation inferred from question metadata/text, child, grade, attempt number, recent errors, mastery, seen strategies, and due reviews. One best eligible strategy is selected.

- First attempt stays independent.
- First miss shows a small clue.
- Second miss shows one strategy and a different-number micro-example.
- Third miss opens Tutor Mode with steps for the live question and waits for the child to continue.
- One to three similar questions are queued later, capped at 26 total.
- Productive strategy use and useful Pattern Hunter selections are recorded separately from views.

Targeted error evidence includes fraction denominators, perimeter/area, division order/remainders, decimal alignment, exponent meaning, BEDMAS order, equation balance, coordinate order, and integer sign direction.

## Parent analytics

The report is inside `#parent-content`, so it is only visible after the existing PIN gate. Alex and Katya are reported separately with overall/recent accuracy, hints, strategy views, useful Pattern Hunter selections, unlocked secrets, reviews due, topic mastery, recurring errors, improvement, rushed-answer signal, deterministic next focus, curriculum coverage, timestamp, and system version.

## Testing

```bash
npm ci
node --check math-secrets.js
node --check math-parent-report.js
npm test
npm run build
npm run preview
```

Manual browser coverage should include both child profiles, PIN access, all three teaching tiers, correct answers, unlocks, reviews, Pattern Hunter, switching and reload persistence, parent analytics, store requests/approval, tablet and phone layouts, service-worker updates, and console errors.

## Extension guidance

Add a strategy to the structured catalogue, never directly to a question string. Reuse normalized topic IDs and add a mapping only when a legacy generator uses a different label. New analytics must remain deterministic unless an actual AI service is introduced and disclosed. Any state addition must be backward-compatible and must keep `smbt-state-v2`.
