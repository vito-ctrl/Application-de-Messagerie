const { body } = require('express-validator')

exports.registerValidator = [
    body('name')
        .notEmpty()
        .withMessage('name is required')
        .isLength({ min: 3 })
        .withMessage('name must be at least 3 characters'),
    body('email')
        .isEmail()
        .withMessage('invalid email')
        .normalizeEmail(),
    body('password')
        .isStrongPassword()
        .withMessage('password have to be stronger')
]

exports.loginValidator = [
    body('email')
        .isEmail()
        .withMessage('invalid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('password is required')
]

const registerValidator = (req, res, next) => {
    const { username, email, password } = req.body;

    // Check if all fields are present
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate username
    if (username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    next();
};

const loginValidator = (req, res, next) => {
    const { email, password } = req.body;

    // Check if all fields are present
    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    next();
};

module.exports = {
    registerValidator,
    loginValidator
};