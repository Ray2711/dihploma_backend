// routes/auth.js
const express           = require('express');
const router            = express.Router();
const pool              = require('../config/db');
const bcrypt            = require('bcrypt');
const jwt               = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Register
router.post(
  '/register',
  [
    body('username')
      .isAlphanumeric().withMessage('Username must be alphanumeric')
      .isLength({ min: 3, max: 30 }),
    body('email').isEmail(),
    body('password')
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;
    try {
      const exists = await pool.query(
        'SELECT 1 FROM users WHERE email=$1 OR username=$2',
        [email, username]
      );
      if (exists.rows.length) {
        return res.status(400).json({ error: 'User already exists' });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const result = await pool.query(
        `INSERT INTO users (username, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, username, email`,
        [username, email, hash]
      );
      res.status(201).json({ user: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('emailOrUsername').notEmpty(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { emailOrUsername, password } = req.body;
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email=$1 OR username=$1',
        [emailOrUsername]
      );
      if (!result.rows.length) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRES_IN }
      );
      res.json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error during login' });
    }
  }
);

module.exports = router;