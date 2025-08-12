# AI Academy (Beginner-Friendly, Gamified)

A no-setup, modern, beginner-friendly AI learning hub with gamification. Runs as a static site (open `index.html`).

## Quick start

- Open `ai-academy/index.html` in your browser; or
- Serve locally for clean routing:

```bash
cd ai-academy
python3 -m http.server 8000
# open http://localhost:8000
```

## Features

- Beginner-friendly curriculum focused on non-technical learners
- Gamification: XP, levels, badges, learning streaks
- Quizzes with instant feedback and XP rewards
- Local-first progress via `localStorage`
- Modern UI with Tailwind (CDN) — no build tools required
- Safe-by-default content with ethics and verification guidance

## Structure

- `index.html`: App shell (header HUD, nav, view mount)
- `app.js`: SPA logic, routing, state, gamification, renderers
- `data/curriculum.json`: Modules, lessons, and quizzes

## Curriculum overview

- Start Here: AI basics, Generative AI 101, Everyday AI, Safety & Ethics
- Prompting Basics: Effective prompts, structured prompting, pitfalls
- No‑Code Tools: Chat assistants, images/audio, automations
- Data & RAG: Data basics, RAG (use your docs), evaluate outputs
- Careers & Capstone: Roles today, personal assistant project

## Gamification model

- Complete lesson: +50 XP
- Quiz: up to +100 XP (based on score)
- Level curve: ~ n^2 * 100 XP per level
- Badges: First Steps, Quiz Taker, Quiz Whiz (80%+), Perfectionist (100%), On a Roll (3-day streak), Dedicated (7-day streak), Explorer (module complete)

## Customization

- Update `data/curriculum.json` to add modules and lessons
- Adjust XP/badges in `app.js` (search for `addXp` and `badgeMeta`)
- Add assets or branding to `index.html`

## Notes

- Privacy: progress is stored only in the browser (localStorage)
- Accessibility: keyboard-friendly and semantic defaults; consider adding full a11y review for production
- Roadmap ideas: global leaderboard (backend), user accounts, certificates, more media-rich lessons