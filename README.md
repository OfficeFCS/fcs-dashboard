# FCS Employee Dashboard

Employee and job management dashboard for **Final Cleaning Solutions Inc.**

## Live Site

[https://officefcs.github.io/fcs-dashboard](https://officefcs.github.io/fcs-dashboard)

## Features

- **Whiteboard** — active jobs displayed as draggable cards with employees connected by lines
- **Drag & drop** — drag employees from the side panel onto job cards to assign them
- **Jobs panel** — create, edit, and delete jobs with contractor info, phone, email, and address
- **Employees panel** — create, edit, and delete employees with level, availability, and assignment tracking
- **Employee levels** — Foreman (orange), Journeyman (blue), Apprentice levels 1–6 (yellow)
- **Status colors** — green for active/working, purple for on leave or unavailable, red for inactive jobs
- **Search & sort** — search both jobs and employees; active records always appear at the top
- **Persistent data** — everything saves automatically to browser localStorage

## File Structure

```
FCSDASH/
├── index.html   — page structure and layout
├── style.css    — all styling
└── app.js       — all logic (data, rendering, drag & drop)
```

## Usage

Open `index.html` in any modern browser. No server or install required.
