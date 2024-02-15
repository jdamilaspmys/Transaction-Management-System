const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { User } = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { successRes, unauthorizedRes, clientErrorRes, conflictErrorRes, serverErrorRes } = require('../util/response');
require('dotenv').config();

// POST /users/register
/**
 * @openapi
 * /users/register:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             example:
 *               message: User registered successfully
 *               username: abc1234
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             example:
 *               message: Email is invalid
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             example:
 *               message: Email already exists
 */
// Validation middleware for registration
const validateRegistration = [
  check('email').isEmail().withMessage('Invalid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return clientErrorRes(res, { errors: errors.array() });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return conflictErrorRes(res, { message: 'Email already exists' });
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const username = req.body.email.split('@')[0] + randomSuffix;

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      username,
      email: req.body.email,
      hashedPassword
    });

    await newUser.save();

    createdRes(res, { message: 'User registered successfully', username  });
  } catch (error) {
    console.error(error);
    serverErrorRes(res, { message: 'Internal server error' });
  }
});


// POST /users/login
/**
 * @openapi
 * /users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Log in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             example:
 *               token: "JWT_TOKEN_HERE"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             example:
 *               message: Invalid email or password
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             example:
 *               message: Invalid email or password
 */
const validateLogin = [
  check('username').notEmpty().withMessage('Username is required'),
  check('password').notEmpty().withMessage('Password is required')
];
router.post('/login',validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return clientErrorRes(res, { errors: errors.array() });
    }
    
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return unauthorizedRes(res, { message: 'Invalid username or password' });
    }

    const isValidPassword = await bcrypt.compare(req.body.password, user.hashedPassword);
    if (!isValidPassword) {
      return unauthorizedRes(res, { message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    successRes(res, { token });
  } catch (error) {
    console.error(error);
    serverErrorRes(res, { message: 'Internal server error' });
  }
});

module.exports = router;
