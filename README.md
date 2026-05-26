# Summer Math Battle Tutor

Tablet-first React + Vite neon game dashboard for Alex and Katya summer math missions.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL.

## What to test first

1. Switch tabs in HUD (Home, Store, Parent, etc.).
2. On Home: click **Complete mission for Alex/Katya** and verify XP/coins/streak/score update.
3. Click **Claim grant prize** and verify one-time coin bonus.
4. Go to Store tab and click reward request buttons.
5. Refresh the browser and verify progress + reward requests persist (localStorage).
6. Open Parent tab and confirm reward requests appear in the review list.
7. Use a non-home tab to toggle weekday/weekend mode.

## Notes

- No backend; all state is localStorage-based.
- English-only UI.
- Original neon battle + mystery theme (no copyrighted franchise assets).
