// Authorization Middleware

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
    next();
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

module.exports = { requireOwnership, requireAdmin };
