const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        // Save user
        const savedUser = await user.save();

        // Create token
        let token;
        try {
            token = jwt.sign(
                { id: savedUser._id },
                process.env.JWT_SECRET || 'default_secret_key_for_development',
                { expiresIn: '24h' }
            );
        } catch (tokenError) {
            console.error('Token generation error:', tokenError);
            // Still return success but without token
            return res.status(201).json({
                message: 'User registered successfully but token generation failed',
                user: {
                    id: savedUser._id,
                    username: savedUser.username,
                    email: savedUser.email
                }
            });
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Error registering user',
            error: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        let token;
        try {
            token = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET || 'default_secret_key_for_development',
                { expiresIn: '24h' }
            );
        } catch (tokenError) {
            console.error('Token generation error:', tokenError);
            return res.status(500).json({
                message: 'Login successful but token generation failed',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        }

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Error logging in',
            error: error.message
        });
    }
}; 