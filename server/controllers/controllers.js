const User = require('../models/auth')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs') // Fixed typo: bcrybt -> bcrypt
const { validationResult } = require('express-validator');

exports.signup = async(req, res) => {
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({
                status: 'fail',
                errors: errors.array()
            });
        }

        const user = await User.findOne({email: req.body.email});
        if(user){
            return res.status(400).json({
                status: 'fail', // Fixed typo: fails -> fail
                message: 'user already exists' // Fixed typo: massage -> message
            });
        }
        
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        const newUser = await User.create({
            ...req.body,
            password: hashedPassword,
        });
        
        const token = jwt.sign({_id: newUser._id}, 'scretkey123', {
            expiresIn: '10d',
        });
        
        res.status(201).json({
            status: 'success',
            message: 'user registered successfully', // Fixed typo: registerd -> registered
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        })
    } catch(error){
        console.error('Signup error:', error); // Added logging
        res.status(500).json({
            status: 'error',
            message: 'registration failed',
            error: error.message
        })
    }
}

exports.signin = async(req, res) => {
    try{
        const {email, password} = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email and password are required'
            });
        }
        
        const user = await User.findOne({email});
        
        if(!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(401).json({
                status: 'fail',
                message: 'invalid password'
            })
        }

        const token = jwt.sign({_id: user._id}, 'scretkey123', {
            expiresIn: '10d',
        });
        
        res.status(200).json({
            status: 'success',
            token,
            message: 'logged in successfully', // Fixed typo: loged -> logged
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        })
    } catch (error) {
        console.error('Signin error:', error); // Added logging
        res.status(500).json({
            status: 'error',
            message: 'Login failed',
            error: error.message
        });
    }
}