const { body } = require ('express-validator')

exports.registerValidator = [
    body('name')
        .notEmpty()
        .withMessage('name is required')
        .isLength({ min: 3})
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