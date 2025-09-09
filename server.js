const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'AUSWO',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForDB(retries = 30, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(delayMs);
    }
  }
  return false;
}

// Helper to fix issue when visa columns exist on Users if DB was created before schema change
async function ensureUserVisaColumns() {
  try {
    const [col1] = await pool.query("SHOW COLUMNS FROM Users LIKE 'visaOption'");
    if (!Array.isArray(col1) || col1.length === 0) {
      await pool.query("ALTER TABLE Users ADD COLUMN visaOption VARCHAR(128) NULL");
    }
    const [col2] = await pool.query("SHOW COLUMNS FROM Users LIKE 'visaPoints'");
    if (!Array.isArray(col2) || col2.length === 0) {
      await pool.query("ALTER TABLE Users ADD COLUMN visaPoints INT NULL");
    }
  } catch (err) {
    console.error('Failed ensuring visa columns exist:', err);
  }
}

// Creating QuickNews table manually for now, not sure why it doesn't work will need to invesigate later
(async () => {
  try {
    await waitForDB();
    await ensureUserVisaColumns();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS QuickNews (
        newsID INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        body TEXT NOT NULL,
        datePublished DATETIME DEFAULT CURRENT_TIMESTAMP,
        authorID INT NOT NULL,
        FOREIGN KEY (authorID) REFERENCES Users(userID)
      )
    `);
  } catch (e) {
    console.error('DB init check failed:', e);
  }
})();

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT userID, firstName, lastName, email, userName, phoneNumber FROM Users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/users', async (req, res) => {
  const { firstName, lastName, phoneNumber, email, userName, passwordHash } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Users (firstName, lastName, phoneNumber, email, userName, passwordHash) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, phoneNumber, email, userName, passwordHash]
    );
    res.status(201).json({ userID: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get single user
app.get('/api/users/:userID', async (req, res) => {
  const { userID } = req.params;
  try {
    // Select * to avoid errors if newer columns are missing
    const [rows] = await pool.query(
      `SELECT * FROM Users WHERE userID = ? LIMIT 1`,
      [userID]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = rows[0] || {};
    const response = {
      userID: u.userID,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      userName: u.userName,
      phoneNumber: u.phoneNumber,
      visaOption: Object.prototype.hasOwnProperty.call(u, 'visaOption') ? u.visaOption : null,
      visaPoints: Object.prototype.hasOwnProperty.call(u, 'visaPoints') ? (u.visaPoints == null ? null : Number(u.visaPoints)) : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Update user visa points
app.put('/api/users/:userID/visa-points', async (req, res) => {
  const { userID } = req.params;
  const { visaOption, visaPoints } = req.body || {};
  if (!visaOption || typeof visaPoints !== 'number') {
    return res.status(400).json({ error: 'visaOption (string) and visaPoints (number) are required' });
  }
  try {
    await ensureUserVisaColumns();
    const [result] = await pool.query(
      'UPDATE Users SET visaOption = ?, visaPoints = ? WHERE userID = ?',
      [visaOption, visaPoints, userID]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update visa points' });
  }
});

// Quick news (for homepage)
app.get('/api/quick-news', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT newsID, title, body, datePublished FROM QuickNews ORDER BY datePublished DESC LIMIT 5'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// Simple login for now
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT userID FROM Users WHERE email = ? AND passwordHash = ? LIMIT 1',
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ userID: rows[0].userID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
