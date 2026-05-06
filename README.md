# FCS Employee Dashboard

Employee and job management dashboard for **Final Cleaning Solutions Inc.**

## Live Site

[https://fcs-dashboard.onrender.com](https://fcs-dashboard.onrender.com)

> Hosted on Render (free tier). The server sleeps after 15 minutes of inactivity — first load may take ~30 seconds to wake up.

## Features

- **Whiteboard** — active jobs displayed as draggable cards with employees connected by lines
- **Drag & drop** — drag employees from the side panel onto job cards to assign them
- **Jobs panel** — create, edit, and delete jobs with contractor info, phone, email, and address
- **Employees panel** — create, edit, and delete employees with level, availability, and assignment tracking
- **Employee levels** — Foreman (orange), Journeyman (blue), Apprentice levels 1–6 (yellow)
- **Status colors** — green for active/working, purple for on leave or unavailable, red for inactive jobs
- **Search & sort** — search both jobs and employees; active records always appear at the top
- **Synced data** — changes save to a PostgreSQL database and sync across all devices

## File Structure

```
FCSDASH/
├── server.js        — Node.js + Express backend
├── package.json     — dependencies
├── public/
│   ├── index.html   — page structure and layout
│   ├── style.css    — all styling
│   └── app.js       — all logic (data, rendering, drag & drop)
```

## Stack

- **Frontend** — vanilla HTML, CSS, JavaScript
- **Backend** — Node.js + Express
- **Database** — PostgreSQL (Neon free tier)
- **Hosting** — Render free tier
