const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Fetch all users 
router.get('/all', requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT
                u.userID as id,
                u.firstName as firstName,
                u.lastName as lastName,
                u.userName as userName,
                (SELECT roleName FROM Roles WHERE roleID = (SELECT roleID FROM UserRoles WHERE userID = u.userID LIMIT 1)) as role,
                u.email as email,
                u.phoneNumber as phoneNumber,
                u.visaOption as visaOption,
                u.visaPoints as visaPoints
            FROM Users u`
        );
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Remove user
router.delete('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const currentUserID = req.session?.userId;
    const connection = await pool.getConnection();

    try {
        // Prevent admin from deleting themselves
        if (parseInt(id) === parseInt(currentUserID)) {
            return res.status(400).json({ error: 'You cannot remove your own account' });
        }
        await connection.beginTransaction();

        // Delete related records
        await connection.query('DELETE FROM UserRoles WHERE userID = ?', [id]);
        // Preserve QuickNews articles but set author to NULL
        await connection.query('UPDATE QuickNews SET authorID = NULL WHERE authorID = ?', [id]);
        // Delete the user
        await connection.query('DELETE FROM Users WHERE userID = ?', [id]);

        await connection.commit();
        res.sendStatus(200);
    } catch (error) {
        await connection.rollback();
        console.error('Error removing user:', error);
        res.status(500).send({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// Fetch Contact Messages
router.get('/contact-messages', requireAdmin, async (req, res) => {
    try {
        const [messages] = await pool.query(
            `SELECT
                cm.messageID as id,
                cm.topic as topic,
                cm.messageBody as messageBody,
                cm.dateSent as dateSent,
                u.userID as userID,
                COALESCE(u.firstName, cm.guestfirstName) as firstName,
                COALESCE(u.lastName, cm.guestlastName) as lastName,
                COALESCE(u.email, cm.guestEmail) as email
            FROM ContactMessages cm
            LEFT JOIN Users u ON cm.userID = u.userID
            ORDER BY cm.dateSent ASC
        `);
        res.json({ messages });
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Remove Contact Message
router.delete('/contact-messages/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM ContactMessages WHERE messageID = ?', [id]);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error removing contact message:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Post quick news
router.post('/quick-news', requireAdmin, async (req, res) => {
    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
        const authorID = req.session.userId || null;
        const [result] = await pool.query(
            'INSERT INTO QuickNews (title, body, authorID) VALUES (?, ?, ?)',
            [title, body, authorID]
        );

        res.status(201).json({
            success: true,
            newsID: result.insertId,
            message: 'Quick news posted successfully'
        });
    } catch (error) {
        console.error('Error posting quick news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;