var express = require('express');
var router = express.Router();
var argon2 = require('argon2');
var { body, validationResult } = require('express-validator');
var mysql = require('mysql2/promise');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;

// MySQL connection configuration
var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'AUSWO2025',
    database: 'AUSWO',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Registration route
router.post('/register', [
    // Validate and sanitize inputs
    body('firstName').notEmpty().withMessage('First name is required').trim().escape(),
    body('lastName').notEmpty().withMessage('Last name is required').trim().escape(),
    body('phoneNumber').notEmpty().withMessage('Phone number is required').trim().escape(),
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('userName').notEmpty().withMessage('Username is required').trim().escape(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long').trim().escape(),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phoneNumber, email, userName, password } = req.body;

    try {
        // Check if user already exists
        const [existingUser] = await pool.execute('SELECT * FROM Users WHERE email = ? OR userName = ?', [email, userName]);
        if (existingUser.length > 0) {
            return res.status(400).json({ errors: [{ msg: 'User with this email or username already exists'}]});
        }

        // Hash password using Argon2
        const hashedPassword = await argon2.hash(password);

        // Insert new user
        const query = 'INSERT INTO Users (firstName, lastName, phoneNumber, email, userName, passwordHash) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [firstName, lastName, phoneNumber, email, userName, hashedPassword]);

        // Assign Member Role to new user
        const userId = result.insertId;
        const roleQuery = 'INSERT INTO UserRoles (userID, roleID) VALUES (?, ?)';
        await pool.execute(roleQuery, [userId, 2]);

        // Redirect to login page after successful registration
        res.status(201).json({ redirect: '/Login.html' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ errors: [{ msg: 'Error registering user' }] });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { userName, password } = req.body;

    try {
        // Check if user exists
        const [users] = await pool.execute('SELECT * FROM Users WHERE userName = ?', [userName]);
        if (users.length === 0) {
            return res.status(400).json({ errors: [{ msg: 'Invalid username or password' }] });
        }

        const user = users[0];

        // Compare password using Argon2
        const match = await argon2.verify(user.passwordHash, password);
        if (!match) {
            return res.status(400).json({ errors: [{ msg: 'Invalid username or password' }] });
        }

        // Create session
        req.session.userId = user.userID;
        req.session.isLoggedIn = true;
        res.status(200).json({ redirect: '/Profile.html' });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ errors: [{ msg: 'Error logging in user' }] });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ errors: [{ msg: 'Error logging out' }] });
        }
        res.clearCookie('connect.sid');
        res.redirect('/Login.html');
    });
});

router.get('/session-info', async (req, res, next) => {
    if (!req.session.isLoggedIn || !req.session.userId) {
        return res.json({ isLoggedIn: false });
    }

    try {
        const [userRows] = await pool.query('SELECT userID, userName, email, firstName, lastName FROM Users WHERE userID = ?', [req.session.userId]);
        const user = userRows[0];

        const [roleRows] = await pool.query(
            `SELECT Roles.roleName FROM UserRoles
            JOIN Roles ON UserRoles.roleID = Roles.roleID
            WHERE UserRoles.userID = ?`, [req.session.userId]
        );
        const roles = roleRows.map(row => row.roleName);

        const isAdmin = roles.includes('Admin');

        req.userRoles = { user, roles, isAdmin, isManager, branchId, branchName };
        next();
    } catch (error) {
        console.error('Error obtaining user roles and/or admin status', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}, (req, res) => {
    if (req.session.isLoggedIn) {
        res.json({
            isLoggedIn: true,
            userId: req.userRoles.user.userID,
            userName: req.userRoles.user.userName,
            email: req.userRoles.user.email,
            firstName: req.userRoles.user.firstName,
            lastName: req.userRoles.user.lastName,
            roles: req.userRoles.roles,
        });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// Google Passport
const GOOGLE_CLIENT_ID = '227608984263-fqq6iudhv9c71aaf61mao6t8td9m7oh7.routers.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

// Might need to add authorised redirect URIs in Google Cloud Console once its understood what page we want to be redirected to. (If not completed, message Nicholas)

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/google/callback",
    passReqToCallback: true
},
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let newUser = {};
            const [existingUser] = await pool.execute('SELECT * FROM Users WHERE email = ?', [profile.email]);
            if (existingUser.length > 0) {
                // If user exists, return existing user
                return done(null, existingUser[0]);
            } else {
                // If the user does not exist, create the new user
                newUser = {
                    firstName: profile.given_name || '',
                    lastName: profile.family_name || '',
                    email: profile.email || '',
                    userName: profile.email ? profile.email.split('@')[0] : ''
                };
                // Insert new user into user table
                const newUserValues = [newUser.firstName, newUser.lastName, newUser.email, newUser.userName];
                const [result] = await pool.execute('INSERT INTO Users (firstName, lastName, email, userName) VALUES (?, ?, ?, ?)', newUserValues);
                newUser.userID = result.insertId;

                // Assign member role to new user
                const roleQuery = 'INSERT INTO UserRoles (userID, roleID) VALUES (?, ?)';
                await pool.execute(roleQuery, [newUser.userID, 2]);

                return done(null, newUser);
            }
        } catch (error) {
            console.error('Error authenticating with Google:', error);
            return done(error, false);
        }
    }));

passport.serializeUser(function (user, done) {
    done(null, user.userID);
});

passport.deserializeUser(async function (id, done) {
    try {
        const [user] = await pool.execute('SELECT * FROM Users WHERE userID = ?', [id]);
        if (user.length === 0) {
            return done(new Error('User not found'));
        }
        done(null, user[0]);
    } catch (error) {
        done(error);
    }
});

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/failure',
    })
);

router.get('/google/success', (req, res) => {
    // Set session variables
    req.session.isLoggedIn = true;
    req.session.userId = req.user.userID;
    res.redirect('/index.html');
});

router.get('/failure', (req, res) => {
    res.send('Something went wrong');
});

module.exports = router;
