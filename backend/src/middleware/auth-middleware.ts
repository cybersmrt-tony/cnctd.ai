/**
 * Authentication middleware for protecting routes
 */

import { Context, Next } from 'hono';
import { verifyJWT } from '../lib/auth';
import type { Env, JWTPayload } from '../lib/types';

/**
 * Extend Hono context to include user info
 */
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

/**
 * Middleware to verify JWT and attach user to context
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('user', payload);
  await next();
}

/**
 * Optional auth middleware - doesn't fail if no token present
 */
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    if (payload) {
      c.set('user', payload);
    }
  }

  await next();
}
