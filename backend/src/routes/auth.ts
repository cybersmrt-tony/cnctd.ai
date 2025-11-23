/**
 * Authentication routes: signup and login
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { hashPassword, verifyPassword, createUserToken } from '../lib/auth';
import type { Env, User } from '../lib/types';

const auth = new Hono<{ Bindings: Env }>();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

/**
 * POST /api/auth/signup
 * Register a new user
 */
auth.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // Check if user already exists
  const existingUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  )
    .bind(email)
    .first();

  if (existingUser) {
    return c.json({ error: 'Email already registered' }, 400);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = nanoid();
  const today = new Date().toISOString().split('T')[0];

  await c.env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, subscription_tier, subscription_status,
     message_count_today, image_count_today, last_message_reset, last_image_reset)
     VALUES (?, ?, ?, 'free', 'active', 0, 0, ?, ?)`
  )
    .bind(userId, email, passwordHash, today, today)
    .run();

  // Generate JWT
  const token = await createUserToken(userId, email, 'free', c.env.JWT_SECRET);

  return c.json({
    token,
    user: {
      id: userId,
      email,
      subscription_tier: 'free'
    }
  });
});

/**
 * POST /api/auth/login
 * Authenticate a user
 */
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // Get user
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  )
    .bind(email)
    .first<User>();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Generate JWT
  const token = await createUserToken(
    user.id,
    user.email,
    user.subscription_tier,
    c.env.JWT_SECRET
  );

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      subscription_tier: user.subscription_tier,
      subscription_status: user.subscription_status
    }
  });
});

export default auth;
