var express = require('express');
var router = express.Router();
var argon2 = require('argon2');
var { body, validationResult } = require('express-validator');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;

// MySQL connection pool (shared)
var pool = require('../db');

// To limit repeated registration/login attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 100 requests per windowMs
    message: 'Too many registration attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Registration route
router.post('/register', authLimiter, [
    // Validate and sanitize inputs
    body('firstName').notEmpty().withMessage('First name is required').trim().escape(),
    body('lastName').notEmpty().withMessage('Last name is required').trim().escape(),
    body('phoneNumber').notEmpty().withMessage('Phone number is required').trim().escape(),
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('userName').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 chars').matches(/^\w+$/).withMessage('Only letters, numbers, and underscores allowed'),
    body('password').isLength({ min: 8 }).withMessage('Min 8 chars').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Must have upper, lower, and number'),
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
        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16, // 64 MB
            timeCost: 3,
            parallelism: 1
        });

        // Insert new user
        const query = 'INSERT INTO Users (firstName, lastName, phoneNumber, email, userName, passwordHash) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [firstName, lastName, phoneNumber, email, userName, hashedPassword]);

        // Assign Member Role to new user
        const userId = result.insertId;
        const roleQuery = 'INSERT INTO UserRoles (userID, roleID) VALUES (?, ?)';
        await pool.execute(roleQuery, [userId, 2]);

        // Log successful registration (To see if its working + Security monitoring)
        console.log(`New user registered: ${userName} (ID: ${userId})`);

        // Redirect to login page after successful registration
        res.status(201).json({ redirect: '/Login.html' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ errors: [{ msg: 'Error registering user' }] });
    }
});


// Login route
router.post('/login', [
    // Validate inputs
    body('userName').notEmpty().withMessage('Username is required').trim().escape(),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { userName, password } = req.body;

    try {
        // Check if user exists
        const [users] = await pool.execute('SELECT * FROM Users WHERE userName = ?', [userName]);
        if (users.length === 0) {
            return res.status(400).json({ errors: [{ msg: 'Invalid username or password' }] });
        }

        const user = users[0];

        // Check if user has a password (OAuth users won't)
        if (!user.passwordHash) {
            return res.status(400).json({ errors: [{ msg: 'Please log in using your OAuth provider' }] });
        }

        // Compare password using Argon2
        const match = await argon2.verify(user.passwordHash, password);
        if (!match) {
            return res.status(400).json({ errors: [{ msg: 'Invalid username or password' }] });
        }

        // Session Regeneration to prevent session fixation
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                return res.status(500).json({ errors: [{ msg: 'Error logging in user' }] });
            }

            // Set session variables after regneration
            req.session.userId = user.userID;
            req.session.isLoggedIn = true;
        
            // Log successful login (Security monitoring)
            console.log(`User logged in: ${userName} (ID: ${user.userID})`);
        
        
            res.status(200).json({
                redirect: '/index.html',
                userID: user.userID,
                userName: user.userName
            });
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ errors: [{ msg: 'Error logging in user' }] });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    const userID = req.session.userId;
    
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session during logout:', err);
            return res.status(500).json({ errors: [{ msg: 'Error logging out' }] });
        }

        // Log logout for security monitoring
        if (userID) {
            console.log(`User logged out: ID ${userID}`);
        }

        res.clearCookie('sessionID', { path: '/', httpOnly: true, sameSite: 'strict' });
        res.redirect('/Login.html');
    });
});

router.get('/session-info', async (req, res, next) => {
    if (!req.session.isLoggedIn || !req.session.userId) {
        return res.json({ isLoggedIn: false });
    }

    try {
        const [userRows] = await pool.query('SELECT userID, userName, email, firstName, lastName FROM Users WHERE userID = ?', [req.session.userId]);

        if (!userRows || userRows.length === 0) {
            // User has been deleted but session still exists
            req.session.destroy();
            return res.status(401).json({ isLoggedIn: false, message: 'User not found' });
        }

        const user = userRows[0];

        const [roleRows] = await pool.query(
            `SELECT Roles.roleName FROM UserRoles
            JOIN Roles ON UserRoles.roleID = Roles.roleID
            WHERE UserRoles.userID = ?`, [req.session.userId]
        );
        const roles = roleRows.map(row => row.roleName);

        const isAdmin = roles.includes('Admin');

        req.userRoles = { user, roles, isAdmin };
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
            isAdmin: req.userRoles.isAdmin
        });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// Google Passport
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '227608984263-fqq6iudhv9c71aaf61mao6t8td9m7oh7.apps.googleusercontent.com'; // Use an environment variable in production
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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'; // Use an environment variable in production
const PORT = process.env.PORT || 3000;

// Ensure that Google OAuth credentials are set
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('CRITICAL: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables');
    process.exit(1);
}

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${PORT}/auth/google/callback`,
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

                console.log(`New OAuth user created: ${newUser.userName} (${newUser.userID})`);

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
