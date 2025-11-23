/**
 * Avatar routes: listing and details
 */

import { Hono } from 'hono';
import { optionalAuthMiddleware } from '../middleware/auth-middleware';
import type { Env, Avatar } from '../lib/types';

const avatars = new Hono<{ Bindings: Env }>();

/**
 * GET /api/avatars
 * Get all active avatars
 */
avatars.get('/', optionalAuthMiddleware, async (c) => {
  const user = c.get('user');
  const userTier = user?.tier || 'free';

  // Get all active avatars
  const result = await c.env.DB.prepare(
    'SELECT id, name, tagline, profile_image_url, age, occupation, interests, tier FROM avatars WHERE is_active = 1 ORDER BY created_at DESC'
  ).all<Avatar>();

  const allAvatars = result.results || [];

  // Filter based on user tier
  let availableAvatars = allAvatars;

  if (userTier === 'free') {
    availableAvatars = allAvatars.filter(a => a.tier === 'free');
  } else if (userTier === 'standard') {
    availableAvatars = allAvatars.filter(a => a.tier === 'free' || a.tier === 'standard');
  }
  // Premium users get all avatars

  return c.json({ avatars: availableAvatars });
});

/**
 * GET /api/avatars/:id
 * Get detailed information about a specific avatar
 */
avatars.get('/:id', optionalAuthMiddleware, async (c) => {
  const avatarId = c.req.param('id');
  const user = c.get('user');
  const userTier = user?.tier || 'free';

  const avatar = await c.env.DB.prepare(
    'SELECT * FROM avatars WHERE id = ? AND is_active = 1'
  )
    .bind(avatarId)
    .first<Avatar>();

  if (!avatar) {
    return c.json({ error: 'Avatar not found' }, 404);
  }

  // Check if user has access to this avatar
  if (userTier === 'free' && avatar.tier !== 'free') {
    return c.json({ error: 'Upgrade required to access this avatar' }, 403);
  }

  if (userTier === 'standard' && avatar.tier === 'premium') {
    return c.json({ error: 'Premium subscription required for this avatar' }, 403);
  }

  return c.json({ avatar });
});

export default avatars;
