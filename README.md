# Just Do It and Be Done

A local-storage-first family productivity, learning, and rewards web app for Alex and Katya.

Core philosophy: **Freedom is earned through responsibility.**
Russian motto: **Сделал дело — гуляй смело.**

## Features

- Profile select for Alex, Katya, and Parent Dashboard
- Daily routines, Brain Missions, chores, life scenarios, outside time, rewards, and weekly freedom status
- Local storage persistence for MVP
- Parent approvals for chores, cooking, outside time, and helping tasks
- AI-ready serverless endpoints that never expose `OPENAI_API_KEY` to frontend code
- Mock fallback when no API key is configured

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the Vite URL shown in your terminal.

## OpenAI API key

Create `.env.local` for local serverless-capable environments or add the variable in your hosting provider:

```bash
OPENAI_API_KEY=your_key_here
```

The browser calls these backend endpoints:

- `/api/ai/generate-daily-plan`
- `/api/ai/check-answer`
- `/api/ai/weekly-report`

If the key is missing, the app uses mock daily tasks and mock answer checking.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New Project** and import the GitHub repository.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variable `OPENAI_API_KEY` in Vercel Project Settings.
7. Deploy.

## Connect to GitHub later

```bash
git remote add origin git@github.com:YOUR_ACCOUNT/YOUR_REPO.git
git push -u origin just-do-it-be-done
```

## Future database structure

The current state is organized by child, date, plans, task status, rewards, and weekly reports so it can be moved from local storage to a database later.
