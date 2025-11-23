/**
 * Image routes: serve images from R2 bucket
 */

import { Hono } from 'hono';
import type { Env } from '../lib/types';

const images = new Hono<{ Bindings: Env }>();

/**
 * GET /api/images/:avatarId/:category/:filename
 * Serve an image from R2 storage
 */
images.get('/:avatarId/:category/:filename', async (c) => {
  const avatarId = c.req.param('avatarId');
  const category = c.req.param('category');
  const filename = c.req.param('filename');

  const key = `${avatarId}/${category}/${filename}`;

  try {
    const object = await c.env.AVATARS.get(key);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(object.body, {
      headers
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return c.json({ error: 'Failed to fetch image' }, 500);
  }
});

/**
 * GET /api/images/profile/:avatarId
 * Get avatar profile image URL
 */
images.get('/profile/:avatarId', async (c) => {
  const avatarId = c.req.param('avatarId');

  const avatar = await c.env.DB.prepare(
    'SELECT profile_image_url FROM avatars WHERE id = ?'
  )
    .bind(avatarId)
    .first();

  if (!avatar) {
    return c.json({ error: 'Avatar not found' }, 404);
  }

  return c.json({ url: avatar.profile_image_url });
});

export default images;
