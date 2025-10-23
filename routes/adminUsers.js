const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin } = require('../server.js');

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
    try {
        await pool.query('DELETE FROM Users WHERE userID = ?', [id]);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error removing user:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

module.exports = router;