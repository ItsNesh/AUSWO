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

// Creating QuickNews table manually for now, not sure why it doesn't work will need to invesigate later
(async () => {
  try {
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
