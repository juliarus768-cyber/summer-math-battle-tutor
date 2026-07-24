# PROJECT

Summer Math Battle Tutor is an English-only educational web app for Alex, entering Grade 8, and Katya, entering Grade 5. It follows the Ontario mathematics curriculum and prioritizes understanding over memorization.

# SAFETY

Never delete, reset, rename, or migrate existing child progress without an explicit backward-compatible migration.
Preserve the existing localStorage key and all stored progress.
Preserve Parent PIN protection, profile separation, rewards, coins, XP, streaks, store requests, and accessibility behaviour.
Do not add external tracking, advertising, public accounts, chat, social sharing, or unsafe links.

# LEARNING RULES

Use the teaching sequence:

1. Let the child attempt independently.
2. After one error, give a small context-aware hint.
3. After a second error, show the relevant Winning Strategy or Math Secret.
4. After a third error, teach the solution step by step without marking the child as failed.
5. Schedule a similar reinforcement question later.
6. Use encouraging language such as “Good try. Let’s fix the step.”

The app must include:

- Brain Boosts
- Winning Strategies
- Math Secrets
- Pattern Hunter
- memory hooks
- worked examples
- common-mistake warnings
- spaced review
- mastery tracking
- parent analytics

# QUALITY

Do not claim completion until:

- npm ci succeeds
- JavaScript syntax checks pass
- npm run build succeeds
- the app opens without console errors
- all major child and parent flows are manually tested
- responsive layouts are checked
- a pull request is created with test evidence
