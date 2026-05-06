# FCS Employee Dashboard

Employee and job management dashboard for **Final Cleaning Solutions Inc.**

## Live Site

[https://fcs-dashboard.onrender.com](https://fcs-dashboard.onrender.com)

> Hosted on Render (free tier). The server sleeps after 15 minutes of inactivity — first load may take ~30 seconds to wake up.

## Features

- **Whiteboard** — active jobs displayed as cards with employees connected by dashed lines
- **Zoom to fit** — whiteboard auto-scales so all active jobs are visible without scrolling (works on mobile)
- **Drag & drop** — drag employees from the side panel onto job cards to assign them (desktop)
- **Tap to assign** — tap "+ Assign" on an employee then tap a job card to assign (mobile)
- **Job dates & time** — start date, end date, and start time shown on whiteboard cards (e.g. Monday, May 11 – Wednesday, May 13 · 6:00AM)
- **Jobs panel** — create, edit, and delete jobs with contractor info, phone, email, address, and dates
- **Employees panel** — create, edit, and delete employees with level, availability, and assignment tracking
- **Employee levels** — Foreman (orange), Journeyman (blue), Apprentice levels 1–6 (yellow)
- **Status colors** — green for active/working, purple for on leave or unavailable, red for inactive jobs
- **Search & sort** — search both jobs and employees; active records always appear at the top
- **Synced data** — changes save to a PostgreSQL database and sync across all devices
- **Auto-refresh** — dashboard silently re-fetches data every 5 minutes so open tabs stay current
- **Password protection** — login screen with password stored securely in environment variables
- **Sign out** — sign out button in the top right of the whiteboard header
- **PWA** — installable as a home screen app on iOS and Android (no App Store required)
- **FCS branding** — company logo in the sidebar header and whiteboard header

## Installing as an App (PWA)

**iPhone (Safari):**
1. Open the site in Safari
2. Tap the share button (box with arrow at the bottom)
3. Tap **Add to Home Screen** → **Add**

**Android (Chrome):**
1. Open the site in Chrome
2. Tap the three dots → **Add to Home Screen**

## File Structure

```
FCSDASH/
├── server.js               — Node.js + Express backend
├── package.json            — dependencies
├── public/
│   ├── index.html          — page structure and layout
│   ├── login.html          — login page
│   ├── style.css           — all styling
│   ├── app.js              — all logic (data, rendering, drag & drop)
│   ├── manifest.json       — PWA manifest
│   ├── sw.js               — service worker (PWA caching)
│   └── FCS-Logo-remove.png — company logo
```

## Stack

- **Frontend** — vanilla HTML, CSS, JavaScript
- **Backend** — Node.js + Express
- **Database** — PostgreSQL (Neon free tier)
- **Hosting** — Render free tier

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `DASHBOARD_PASSWORD` | Password required to access the dashboard |
