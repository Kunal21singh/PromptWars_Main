import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { BigQuery } from '@google-cloud/bigquery';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(session({
  name: 'zenith.sid',
  secret: process.env.SESSION_SECRET || 'zenith_session_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Serve static assets from the root and src directories
app.use(express.static(__dirname));

// ==========================================
// BigQuery Setup & Fallback Configuration
// ==========================================
let bigquery = null;
let useFallback = false;
const datasetId = process.env.BIGQUERY_DATASET || 'zenith_dataset';
const tableId = process.env.BIGQUERY_TABLE || 'accounts';
const projectId = process.env.GCP_PROJECT_ID;

const MOCK_DB_PATH = path.join(__dirname, 'bigquery_mock_db.json');
const hasGcpConfig = projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (hasGcpConfig) {
  try {
    bigquery = new BigQuery({
      projectId: projectId,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    console.log(`[BigQuery] Initialized for project: ${projectId}`);
  } catch (err) {
    console.error('[BigQuery] Initialization failed, using local mock database:', err.message);
    useFallback = true;
  }
} else {
  console.log('\n\x1b[33m%s\x1b[0m', '[BigQuery] Configuration is not fully set.');
  console.log('To run Zenith with real GCP BigQuery integration, set the following env vars:');
  console.log('  - GCP_PROJECT_ID');
  console.log('  - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON file)');
  console.log(`[Fallback] Using local mock database file: ${MOCK_DB_PATH}\n`);
  useFallback = true;
}

// Ensure local mock db exists if fallback is active
if (useFallback && !fs.existsSync(MOCK_DB_PATH)) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify([], null, 2), 'utf8');
}

// Programmatic schema verification and creation
async function initBigQuery() {
  if (useFallback) return;
  try {
    const dataset = bigquery.dataset(datasetId);
    const [datasetExists] = await dataset.exists();
    if (!datasetExists) {
      console.log(`[BigQuery] Creating dataset: ${datasetId}`);
      await dataset.create();
    }

    const table = dataset.table(tableId);
    const [tableExists] = await table.exists();
    if (!tableExists) {
      console.log(`[BigQuery] Creating table: ${tableId}`);
      const schema = [
        { name: 'username', type: 'STRING', mode: 'REQUIRED' },
        { name: 'password', type: 'STRING', mode: 'REQUIRED' },
        { name: 'profile', type: 'STRING', mode: 'NULLABLE' },
        { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' }
      ];
      await table.create({ schema });
    }
    console.log(`[BigQuery] Table '${tableId}' in dataset '${datasetId}' is connected and ready.`);
  } catch (err) {
    console.error('[BigQuery] Schema verification failed. Falling back to local mock DB:', err.message);
    useFallback = true;
    if (!fs.existsSync(MOCK_DB_PATH)) {
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify([], null, 2), 'utf8');
    }
  }
}

// Call async initialization
initBigQuery();

// ==========================================
// Password Hashing & Comparison
// ==========================================
const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// ==========================================
// Mock Database Operations Helper
// ==========================================
function readMockDb() {
  try {
    const data = fs.readFileSync(MOCK_DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Failed to read mock db:', e.message);
    return [];
  }
}

function writeMockDb(data) {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write mock db:', e.message);
  }
}

// ==========================================
// BigQuery / Mock Database Queries
// ==========================================
async function getUserByUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();

  if (useFallback) {
    const rows = readMockDb();
    const matches = rows.filter(r => r.username.trim().toLowerCase() === normalizedUsername);
    if (matches.length === 0) return null;
    // Sort descending by created_at to fetch the latest state
    matches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return matches[0];
  } else {
    try {
      const query = `
        SELECT username, password, profile, created_at 
        FROM \`${projectId}.${datasetId}.${tableId}\`
        WHERE LOWER(username) = @username
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const options = {
        query: query,
        params: { username: normalizedUsername },
      };
      const [rows] = await bigquery.query(options);
      return rows[0] || null;
    } catch (err) {
      console.error('[BigQuery] getUserByUsername query failed, using mock DB fallback:', err.message);
      const rows = readMockDb();
      const matches = rows.filter(r => r.username.trim().toLowerCase() === normalizedUsername);
      if (matches.length === 0) return null;
      matches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return matches[0];
    }
  }
}

async function getAllUsernames() {
  if (useFallback) {
    const rows = readMockDb();
    const usernames = rows.map(r => r.username.trim());
    return [...new Set(usernames)];
  } else {
    try {
      const query = `
        SELECT DISTINCT username 
        FROM \`${projectId}.${datasetId}.${tableId}\`
      `;
      const [rows] = await bigquery.query(query);
      return rows.map(row => row.username.trim());
    } catch (err) {
      console.error('[BigQuery] getAllUsernames query failed, using mock DB fallback:', err.message);
      const rows = readMockDb();
      const usernames = rows.map(r => r.username.trim());
      return [...new Set(usernames)];
    }
  }
}

async function insertUser(username, encodedPassword, profile) {
  const newRow = {
    username: username.trim(),
    password: encodedPassword,
    profile: JSON.stringify(profile),
    created_at: new Date().toISOString()
  };

  if (useFallback) {
    const rows = readMockDb();
    rows.push(newRow);
    writeMockDb(rows);
  } else {
    try {
      const bqRow = {
        ...newRow,
        created_at: bigquery.timestamp(new Date(newRow.created_at))
      };
      await bigquery.dataset(datasetId).table(tableId).insert([bqRow]);
      console.log(`[BigQuery] Successfully appended row for user: ${username}`);
    } catch (err) {
      console.error('[BigQuery] Streaming insert failed. Appending to local mock DB as fallback. Error:', err.message);
      if (err.name === 'PartialFailureError') {
        console.error('[BigQuery] Partial Failure Details:', JSON.stringify(err.errors));
      }
      const rows = readMockDb();
      rows.push(newRow);
      writeMockDb(rows);
    }
  }
}

// ==========================================
// REST API Endpoints
// ==========================================

// Get all registered usernames (for Profile selector)
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await getAllUsernames();
    res.json({ success: true, accounts });
  } catch (e) {
    console.error('Error fetching accounts:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Register a new user account
app.post('/api/register', async (req, res) => {
  const { username, password, profile } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this name already exists.' });
    }

    const hashedPassword = await hashPassword(password);
    await insertUser(username, hashedPassword, profile);

    req.session.username = username.trim();
    req.session.authenticated = true;

    res.json({
      success: true,
      username: username.trim(),
      profile: profile,
      message: 'Account registered successfully.'
    });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Authenticate user and return profile/state data
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const userRecord = await getUserByUsername(username);
    if (!userRecord) {
      return res.status(400).json({ success: false, message: 'Account not found.' });
    }

    const passwordMatch = await comparePassword(password, userRecord.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password.' });
    }

    let parsedProfile = {};
    try {
      parsedProfile = JSON.parse(userRecord.profile || '{}');
    } catch (e) {
      console.error('Failed to parse user profile JSON payload:', e);
    }

    req.session.username = userRecord.username;
    req.session.authenticated = true;

    res.json({
      success: true,
      username: userRecord.username,
      profile: parsedProfile.profile || parsedProfile,
      moodLogs: parsedProfile.moodLogs,
      journals: parsedProfile.journals,
      chatHistory: parsedProfile.chatHistory,
      soundscape: parsedProfile.soundscape,
      pomodoro: parsedProfile.pomodoro,
      message: 'Authentication successful.'
    });
  } catch (e) {
    console.error('Login authentication error:', e);
    res.status(500).json({ success: false, message: 'Server error during login verification.' });
  }
});

// Sync updated user data (profile state, moodLogs, journals, chatHistory)
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.authenticated && req.session.username) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Authentication required.' });
}

app.post('/api/update-profile', ensureAuthenticated, async (req, res) => {
  const profileData = req.body.profileData;
  const username = req.session.username;

  if (!profileData) {
    return res.status(400).json({ success: false, message: 'Profile data is required.' });
  }

  try {
    const userRecord = await getUserByUsername(username);
    if (!userRecord) {
      return res.status(400).json({ success: false, message: 'Account not found.' });
    }

    // Keep existing password, but insert new updated profile state
    await insertUser(username, userRecord.password, profileData);

    res.json({ success: true, message: 'State successfully synchronized with backend.' });
  } catch (e) {
    console.error('Profile update sync error:', e);
    res.status(500).json({ success: false, message: 'Server error during profile synchronization.' });
  }
});

// Change user password
app.post('/api/change-password', ensureAuthenticated, async (req, res) => {
  const username = req.session.username;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing parameters.' });
  }

  try {
    const userRecord = await getUserByUsername(username);
    if (!userRecord) {
      return res.status(400).json({ success: false, message: 'Account not found.' });
    }

    const passwordMatch = await comparePassword(oldPassword, userRecord.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password.' });
    }

    const newHashedPassword = await hashPassword(newPassword);

    let parsedProfile = {};
    try {
      parsedProfile = JSON.parse(userRecord.profile || '{}');
    } catch (e) {
      console.error('Failed to parse user profile JSON:', e);
    }

    await insertUser(username, newHashedPassword, parsedProfile);

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (e) {
    console.error('Password change error:', e);
    res.status(500).json({ success: false, message: 'Server error during password update.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
    res.clearCookie('zenith.sid');
    res.json({ success: true, message: 'Logged out successfully.' });
  });

// Direct any unmatched routes to index.html for Single Page Application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Zenith Server running on http://localhost:${PORT}`);
});
