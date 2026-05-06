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
- **Jobs panel** — create, edit, and delete jobs with contractor info, phone, email, and address
- **Employees panel** — create, edit, and delete employees with level, availability, and assignment tracking
- **Employee levels** — Foreman (orange), Journeyman (blue), Apprentice levels 1–6 (yellow)
- **Status colors** — green for active/working, purple for on leave or unavailable, red for inactive jobs
- **Search & sort** — search both jobs and employees; active records always appear at the top
- **Synced data** — changes save to a PostgreSQL database and sync across all devices
- **Auto-refresh** — dashboard silently re-fetches data every 5 minutes so open tabs stay current
- **FCS branding** — company logo in the sidebar header and whiteboard header

## File Structure

```
FCSDASH/
├── server.js        — Node.js + Express backend
├── package.json     — dependencies
├── public/
│   ├── index.html          — page structure and layout
│   ├── style.css           — all styling
│   ├── app.js              — all logic (data, rendering, drag & drop)
│   └── FCS-Logo-remove.png — company logo
```

## Stack

- **Frontend** — vanilla HTML, CSS, JavaScript
- **Backend** — Node.js + Express
- **Database** — PostgreSQL (Neon free tier)
- **Hosting** — Render free tier
