# Zenith Student Well-being Companion

A vanilla JavaScript SPA with an Express backend that helps students manage exam stress, journal feelings, and access personalized guidance using generative AI.

## Key Features

- Student wellness dashboard with mood logs, journals, and focus tools
- Secure account registration and login using `express-session`
- Password protection with `bcryptjs` hashing
- Generative AI support via Google Gemini for companion chat, journal suggestions, and mindfulness prompts
- BigQuery integration with a local JSON fallback for offline development
- Frontend components assembled in `src/components`

## Project Structure

- `server.js` - Express backend, session auth, BigQuery/mock DB persistence, API endpoints
- `src/main.js` - SPA router and render logic
- `src/store.js` - client state store and backend sync handling
- `src/components/` - UI views for login, dashboard, companion, journal, mindfulness, settings
- `src/utils/gemini.js` - Gemini AI connector and fallback simulation
- `src/utils/sanitize.js` - HTML escaping helper (for XSS protection)

## Requirements

- Node.js 20+ (project was tested with Node 20.x on Windows)
- npm or Yarn

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Then open `http://localhost:8080` in your browser.

## Environment Variables

The app supports the following optional environment variables:

- `SESSION_SECRET` - secret key for Express session cookies
- `NODE_ENV=production` - enables secure cookies in production
- `GCP_PROJECT_ID` - Google Cloud project for BigQuery
- `GOOGLE_APPLICATION_CREDENTIALS` - path to the GCP service account JSON file

If BigQuery is not configured, the app falls back to `bigquery_mock_db.json` in the project root.

## Generative AI Integration

This project uses Google Gemini via `src/utils/gemini.js`:

- `GeminiConfig` manages the API key and key storage
- `GenAI` methods power the companion chat, journal insights, and mindfulness prompts
- AI usage is wired into `src/components/Companion.js`, `src/components/Journal.js`, and `src/components/Mindfulness.js`

## Security Notes

- Passwords are hashed with `bcryptjs` before storage
- Session-based authentication is enforced for profile update and password change routes
- Client state does not persist sensitive credentials in `localStorage`
- The backend uses `httpOnly` and `sameSite` cookies for session protection

## Notes

- This is a prototype wellness companion app built around student mental health and exam readiness
- The frontend is intentionally lightweight and framework-free for fast iteration
- BigQuery support is optional, but the local fallback allows the app to run without GCP credentials
