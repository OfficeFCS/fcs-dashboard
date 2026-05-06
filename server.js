// =====================================================
//  Final Cleaning Solutions Inc. — Backend Server
//  Node.js + Express + PostgreSQL (Neon)
//
//  Two endpoints:
//    GET  /api/state  — load the full dashboard state
//    POST /api/state  — save the full dashboard state
//
//  The entire state (jobs, employees, positions) is
//  stored as a single JSON blob in one database row.
//  Simple and easy to maintain for a small dashboard.
// =====================================================

'use strict';

const express = require('express');
const { Pool } = require('pg');
const path    = require('path');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON bodies
app.use(express.json({ limit: '1mb' }));

// Serve the frontend from the public/ folder
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================
//  AUTH
//  Password is stored in the DASHBOARD_PASSWORD env var.
//  The token sent to the client is an HMAC of the password
//  so it changes automatically if the password changes.
// =====================================================

function getToken() {
  const pw = process.env.DASHBOARD_PASSWORD || '';
  return crypto.createHmac('sha256', 'fcs-dashboard').update(pw).digest('hex');
}

function requireAuth(req, res, next) {
  // If no password is set, allow all requests (useful for local dev)
  if (!process.env.DASHBOARD_PASSWORD) return next();
  const auth  = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (token !== getToken()) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// =====================================================
//  DATABASE
//  Connects to PostgreSQL using the DATABASE_URL
//  environment variable set in Render's dashboard.
//  SSL is required for Neon (and most cloud Postgres).
// =====================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Create the state table if it doesn't exist yet
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS state (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  console.log('Database ready.');
}

// =====================================================
//  API ROUTES
// =====================================================

// POST /api/login — check password and return a token
app.post('/api/login', (req, res) => {
  if (!process.env.DASHBOARD_PASSWORD) return res.json({ token: '' });
  if (req.body.password !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  res.json({ token: getToken() });
});

// GET /api/state — return the saved dashboard state
app.get('/api/state', requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM state WHERE key = 'db'");
    if (result.rows.length === 0) {
      // No data yet — frontend will seed with demo data and save it
      res.json(null);
    } else {
      res.json(JSON.parse(result.rows[0].value));
    }
  } catch (err) {
    console.error('GET /api/state error:', err.message);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

// POST /api/state — save the full dashboard state
app.post('/api/state', requireAuth, async (req, res) => {
  try {
    const value = JSON.stringify(req.body);
    // Upsert: insert or update the single state row
    await pool.query(
      `INSERT INTO state (key, value) VALUES ('db', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [value]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/state error:', err.message);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// =====================================================
//  START
// =====================================================
initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
