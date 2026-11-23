# Hireside

Practice interviews with an AI that hears and sees you, then scores you out of 100.

## Change the product name
Edit `brand.js` (one file). The header, footer, page title, share text and reminders all follow it. Also update the `<title>` text in `index.html` if you want the static title to match.

## Look and feel
Colours and fonts are the variables at the top of `styles.css` (cream, sage, burgundy, light and dark). Icons are Lucide (ISC licence) in `icons.js`; use `icon("name")` to add one. The app uses no emoji. Design rules (see top of `styles.css`): one filled burgundy button per screen, spacing in multiples of 4px, no gradients, glows, pill shapes, all-caps labels or hover bounce, and plain wording with no hype words.

## Run it (needs Node 20+, no installs)
```
cp .env.example .env      # then edit .env
node server.js            # open http://localhost:8080
```
Use **Chrome or Edge** (voice recognition). Without any keys the app still works with the built-in interviewer.

## Turn on the smart interviewer (free)
Put ONE free key in `.env`: `GROQ_API_KEY` (console.groq.com) or `GEMINI_API_KEY` (aistudio.google.com).
Follow-up questions then react to what the candidate actually said. If the AI is slow (>4.5s) or down, the built-in question is used.
If a model name is retired, set `LLM_MODEL` in `.env`.

## Owner review page
Set `ADMIN_TOKEN` in `.env` (long random string), open `http://localhost:8080/#admin`, paste the token.
Feedback is saved in `data/feedback.jsonl`.

## Security
- API keys and the owner token live only on the server (`.env`, never in the browser, never in Git: `.gitignore` blocks it).
- Owner review needs `ADMIN_TOKEN` (24+ random characters). Wrong guesses are rate-limited.
- All text is escaped before display, the server sends a strict Content-Security-Policy, and the AI prompt treats speech as data.
- There are no uploads and no database, so those attacks have nothing to hit.
- Before going public: leave `ALLOW_DEMO_PRO` unset (it lets anyone get Pro free), and set a strong `ADMIN_TOKEN` in Render's environment.
- Still browser-only until real login and payments exist: Pro status and the weekly free limit.

## Daily self-updating knowledge (free, via GitHub Actions)
1. Put the project in a GitHub repo.
2. Repo Settings → Secrets → add `GEMINI_API_KEY` (or `GROQ_API_KEY`).
3. Add public pages you trust to `tools/sources.json` (not Glassdoor/LinkedIn: their terms forbid scraping).
4. `.github/workflows/daily-knowledge.yml` then refreshes the "What's new in interviews" list every day.

## Tests
`npm test` (scoring, rounds, question engine).

## Not built yet (needs a real backend / paid services)
- Real Google / LinkedIn / GitHub login (sign-in is demo mode, stored in the browser)
- Real payments and auto-renewing subscriptions; automatic 1-month reward after approval
- Weekly free limit and Pro status are enforced in the browser only, so a determined user can bypass them
- Web push reminders when the tab is closed (reminders work while the app is open)
- Recordings live in the user's own browser storage (free: deleted after one view; Pro: after 24h)
