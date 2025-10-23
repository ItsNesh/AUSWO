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
    const connection = await pool.getConnection();

    try {
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

module.exports = router;