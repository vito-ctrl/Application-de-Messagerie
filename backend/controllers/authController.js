const User = require('../models/User.js');
// const { generateToken } = require('../services/authService.js');

const register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    // const token = generateToken(user);
    res.status(201).json({ user});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  // const token = generateToken(user);
  res.json({ user});
};

module.exports = { register, login };
