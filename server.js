const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// Added for this Git branch
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const { body } = require('express-validator');

var authRouter = require('./routes/auth');
var dashboardRouter = require('./routes/Dashboard');
var immigrationRouter = require('./routes/Immigration');
var profileRouter = require('./routes/Profile');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'GOCSPX-3p0mYH8m7VfX5d4h8j9kL0qJz9W',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000} // 10 Minutes
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use('./routes/Dashboard', express.static(path.join(__dirname, 'Dashboard')));

// Redirects
const friendlyRedirects = {
  '/dashboard': './public/Dashboard.html',
  '/Dashboard': './public/Dashboard.html',
  '/immigration': './public/Immigration.html',
  '/Immigration': './public/Immigration.html',
  '/profile': './public/Profile.html',
  '/Profile': './public/Profile.html',
  '/login': './public/Login.html',
  '/Login': './public/Login.html',
  '/signup': './public/Signup.html',
  '/Signup': './public/Signup.html',
  '/home': '/index.html',
  '/index': '/index.html',
};

Object.entries(friendlyRedirects).forEach(([from, to]) => {
  app.get(from, (req, res) => res.redirect(to));
  app.get(from + '/', (req, res) => res.redirect(to));
});

// Extensionless redirects for root pages, eg. /account -> /account.html
function tryRedirectToHtml(req, res, next) {
  const p = req.path;
  if (p.startsWith('/api/') || path.extname(p)) return next();

  const candidate = path.join(__dirname, `${p}.html`); // eg. /points-calculator -> /points-calculator.html
  fs.access(candidate, fs.constants.F_OK, (err) => {
    if (!err) {
      return res.redirect(`${p}.html`);
    }

    // Support for pages inside folders (Dashboard/Dashboard.html)
    const name = p.replace(/^\//, '');
    if (!name) return next();
    const cap = name.charAt(0).toUpperCase() + name.slice(1);
    const dirFile = path.join(__dirname, cap, `${cap}.html`);
    fs.access(dirFile, fs.constants.F_OK, (err2) => {
      if (!err2) return res.redirect(`/${cap}/${cap}.html`);
      return next();
    });
  });
}

app.get('/:page', tryRedirectToHtml);
app.get('/:page/', tryRedirectToHtml);

// Mount auth router
app.use('/auth', authRouter);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AUSWO2025',
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


// Edit user profile fields
app.put('/api/users/:userID', async (req, res) => {
  const { userID } = req.params;
  const { firstName, lastName, email, userName, phoneNumber } = req.body || {};

  // Update only provided fields
  const fields = [];
  const values = [];
  const toNullable = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);
  if (typeof firstName === 'string') { fields.push('firstName = ?'); values.push(toNullable(firstName)); }
  if (typeof lastName === 'string')  { fields.push('lastName = ?');  values.push(toNullable(lastName)); }
  if (typeof email === 'string')     { fields.push('email = ?');     values.push(toNullable(email)); }
  if (typeof userName === 'string')  { fields.push('userName = ?');  values.push(toNullable(userName)); }
  if (typeof phoneNumber === 'string') { fields.push('phoneNumber = ?'); values.push(toNullable(phoneNumber)); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const sql = `UPDATE Users SET ${fields.join(', ')} WHERE userID = ?`;
    values.push(userID);
    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });

    // Return the updated user
    const [rows] = await pool.query(
      'SELECT userID, firstName, lastName, email, userName, phoneNumber, visaOption, visaPoints FROM Users WHERE userID = ? LIMIT 1',
      [userID]
    );
    res.json(rows[0] || { ok: true });
  } catch (err) {
    // Handle duplicate key errors (unique constraints for email/phone/userName)
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(409).json({ error: 'Duplicate value for a unique field' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
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


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
