import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';

const router = express.Router();

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, full_name } = req.body;

      // Check if user exists
      const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await pool.query(
        'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
        [email, hashedPassword, full_name]
      );

      const user = result.rows[0];

      // Create default categories for new user
      const defaultCategories = [
        // Income categories
        { name: 'Maosh', type: 'income', icon: 'briefcase', color: '#10B981' },
        { name: 'Boshqa daromadlar', type: 'income', icon: 'dollar-sign', color: '#06B6D4' },
        // Expense categories
        { name: 'Oziq-ovqat', type: 'expense', icon: 'utensils', color: '#EF4444' },
        { name: 'Transport', type: 'expense', icon: 'car', color: '#F59E0B' },
        { name: 'Xaridlar', type: 'expense', icon: 'shopping-bag', color: '#EC4899' },
        { name: 'Kommunal to\'lovlar', type: 'expense', icon: 'file-text', color: '#6366F1' },
        { name: 'Boshqa xarajatlar', type: 'expense', icon: 'more-horizontal', color: '#64748B' }
      ];

      for (const cat of defaultCategories) {
        await pool.query(
          'INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5)',
          [user.id, cat.name, cat.type, cat.icon, cat.color]
        );
      }

      // Generate JWT with userId for consistency
      const token = jwt.sign(
        { userId: user.id, id: user.id, email: user.email, role: 'user' },
        process.env.JWT_SECRET || 'kista_secret_key_2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: 'user'
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login
router.post('/login',
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // BYPASS: Try to find user, otherwise create one
      let result = await pool.query('SELECT id, email, full_name FROM users WHERE email = $1', [email]);
      let user = result.rows[0];

      if (!user) {
        // Auto-register strictly for "random" access
        const hashedPassword = await bcrypt.hash(password || '123456', 10);
        const newUserQuery = await pool.query(
          'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
          [email, hashedPassword, 'Test User']
        );
        user = newUserQuery.rows[0];

        // Add default categories for this temporary user
        const defaultCategories = [
          { name: 'Maosh', type: 'income', icon: 'briefcase', color: '#10B981' },
          { name: 'Oziq-ovqat', type: 'expense', icon: 'utensils', color: '#EF4444' }
        ];
        for (const cat of defaultCategories) {
          await pool.query(
            'INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5)',
            [user.id, cat.name, cat.type, cat.icon, cat.color]
          );
        }
      }

      // Generate JWT (Always success)
      const token = jwt.sign(
        { userId: user.id, id: user.id, email: user.email, role: 'user' },
        process.env.JWT_SECRET || 'kista_secret_key_2024',
        { expiresIn: '30d' }
      );

      res.json({
        message: 'Login successful (Bypass Mode)',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: 'user'
        }
      });
    } catch (error) {
      console.error('Login bypass error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;

