const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {


            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from MongoDB and attach it to the request object
            // .select('-password') ensures we don't accidentally pass the password back
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized, you must be an admin' });
    }
};

// Generic middleware to authorize specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (req.user && roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ 
                message: `Not authorized, required roles: ${roles.join(', ')}` 
            });
        }
    };
};

module.exports = { protect, admin, authorize };
