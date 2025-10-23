// Load environment variables from .env file
require('dotenv').config();

// Validate critical environment variables on startup
const requiredEnvVars = ['SESSION_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('CRITICAL ERROR: Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('Please create a .env file with these variables.');
    process.exit(1);
}

console.log('Environment variables have loaded successfully');

const express = require('express');
const path = require('path');
const fs = require('fs');

// Added for this Git branch
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const { body, validationResult } = require('express-validator');

// Database Setup
const pool = require('./db');

// Route Handlers
var authRouter = require('./routes/auth');
var dashboardRouter = require('./routes/Dashboard');
var immigrationRouter = require('./routes/Immigration');
var profileRouter = require('./routes/Profile');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// Secure Session Configuration
const sessionSecret = process.env.SESSION_SECRET || 'GOCSPX-3p0mYH8m7VfX5d4h8j9kL0qJz9W' // Use an environment variable in production
if (!sessionSecret) {
  console.error('CRITICAL ERROR: SESSION_SECRET is not set in environment variables.');
  process.exit(1);
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // Prevent client-side JS access
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict' // Mitigate CSRF attacks
  },
  name: 'sessionID' // Custom cookie name - adding obscurity due to not using default connect.sid
}));

// Passport middleware - must be after session and before routes
app.use(passport.initialize());
app.use(passport.session());

app.use('/Dashboard', express.static(path.join(__dirname, 'Dashboard')));

// Helper to wait for DB to be ready
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

// Authorization Middleware
// Require user to be logged in
function requireAuth(req, res, next) {
  if (!req.session.isLoggedIn || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized - Please log in' });
  }
  next();
}

// Require user to own the resource they are accessing
function requireOwnership(req, res, next) {
   if (!req.session.isLoggedIn || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }
    
    const requestedUserId = parseInt(req.params.userID, 10);
    const sessionUserId = parseInt(req.session.userId, 10);
    
    if (requestedUserId !== sessionUserId) {
        return res.status(403).json({ error: 'Forbidden - You can only access your own data' });
    }
    next()
}

// Require user to be admin
function requireAdmin(req, res, next) {
    if (!req.session.isLoggedIn || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }
    if (!req.userRoles || !req.userRoles.isAdmin) {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    next();
}


// -----------------
// API Routes
// -----------------

app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT userID, firstName, lastName, email, userName, phoneNumber FROM Users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
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

// Edit user profile fields
app.put('/api/users/:userID', requireAuth, requireOwnership, [
    body('firstName').optional({ checkFalsy: true }).isLength({ min: 1, max: 50 }).trim().escape(),
    body('lastName').optional({ checkFalsy: true }).isLength({ min: 1, max: 50 }).trim().escape(),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('userName').optional({ checkFalsy: true }).isLength({ min: 3, max: 30 }).matches(/^\w+$/).trim(),
    body('phoneNumber').optional({ checkFalsy: true }).isMobilePhone().trim().escape()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    
  const { userID } = req.params;
  const { firstName, lastName, email, userName, phoneNumber } = req.body || {};

  // Whitelist allowed fields only (To prevent some fields like passwordHash and isAdmin from being updated here)
  const allowedFields = ['firstName', 'lastName', 'email', 'userName', 'phoneNumber'];

  // Update only provided fields
  const fields = [];
  const values = [];
  const toNullable = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);


  if (allowedFields.includes('firstName') && typeof firstName === 'string') { fields.push('firstName = ?'); values.push(toNullable(firstName)); }
  if (allowedFields.includes('lastName') && typeof lastName === 'string')  { fields.push('lastName = ?');  values.push(toNullable(lastName)); }
  if (allowedFields.includes('email') && typeof email === 'string')     { fields.push('email = ?');     values.push(toNullable(email)); }
  if (allowedFields.includes('userName') && typeof userName === 'string')  { fields.push('userName = ?');  values.push(toNullable(userName)); }
  if (allowedFields.includes('phoneNumber') && typeof phoneNumber === 'string') { fields.push('phoneNumber = ?'); values.push(toNullable(phoneNumber)); }

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
app.get('/api/users/:userID', requireAuth, requireOwnership, async (req, res) => {
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
app.put('/api/users/:userID/visa-points', requireAuth, requireOwnership, async (req, res) => {
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

// -----------------------

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
  '/contact': './public/contact.html',
  '/Contact': './public/contact.html',
  '/preferences': './public/preferences.html',
  '/Preferences': './public/preferences.html',
  '/admin': '/AdminPage.html',
  '/Admin': '/AdminPage.html',
  '/home': '/index.html',
  '/index': '/index.html',
  '/': '/index.html',
};

Object.entries(friendlyRedirects).forEach(([from, to]) => {
  app.get(from, (req, res) => res.redirect(to));
  app.get(from + '/', (req, res) => res.redirect(to));
});

app.get('/AdminPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'AdminPage.html'));
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

// Middleware to obtain user roles and admin status
app.use(async (req, res, next) => {
    if (req.session.isLoggedIn && req.session.userId) {
        try {
            const [userRows] = await pool.query('SELECT userID, userName, email, firstName, lastName FROM Users WHERE userID = ?', [req.session.userId]);

            if (!userRows || userRows.length === 0) {
                req.session.destroy();
                req.userRoles = { roles: [], isAdmin: false };
                return next();
            }

            const user = userRows[0];
            const [roleRows] = await pool.query(
                `SELECT Roles.roleName FROM UserRoles
                JOIN Roles ON UserRoles.roleID = Roles.roleID
                WHERE UserRoles.userID = ?`, [req.session.userId]
            );
            const roles = roleRows.map(row => row.roleName);
            const isAdmin = roles.includes('Admin');
            console.log('User roles:', roles);

            req.userRoles = { user, roles, isAdmin };
        } catch (error) {
            console.error('Error obtaining user roles and/or admin status', error);
            req.userRoles = { roles: [], isAdmin: false };
        }
    } else {
        req.userRoles = { roles: [], isAdmin: false };
    }
    next();
});

// Routers
app.use('/auth', authRouter);
app.use('/Dashboard', dashboardRouter);
app.use('/Immigration', immigrationRouter);
app.use('/Profile', profileRouter);

// Start Server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
