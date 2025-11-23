/**
 * Conversation routes: start chats, get history
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../middleware/auth-middleware';
import type { Env, Conversation, Message } from '../lib/types';

const conversations = new Hono<{ Bindings: Env }>();

// All conversation routes require authentication
conversations.use('/*', authMiddleware);

const startConversationSchema = z.object({
  avatarId: z.string()
});

/**
 * POST /api/conversations/start
 * Start a new conversation with an avatar
 */
conversations.post('/start', zValidator('json', startConversationSchema), async (c) => {
  const { avatarId } = c.req.valid('json');
  const user = c.get('user');

  // Verify avatar exists and is accessible
  const avatar = await c.env.DB.prepare(
    'SELECT * FROM avatars WHERE id = ? AND is_active = 1'
  )
    .bind(avatarId)
    .first();

  if (!avatar) {
    return c.json({ error: 'Avatar not found' }, 404);
  }

  // Check if user already has a conversation with this avatar
  const existingConversation = await c.env.DB.prepare(
    'SELECT * FROM conversations WHERE user_id = ? AND avatar_id = ? ORDER BY created_at DESC LIMIT 1'
  )
    .bind(user.userId, avatarId)
    .first<Conversation>();

  if (existingConversation) {
    // Return existing conversation
    return c.json({ conversation: existingConversation });
  }

  // Create new conversation
  const conversationId = nanoid();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO conversations (id, user_id, avatar_id, created_at) VALUES (?, ?, ?, ?)'
  )
    .bind(conversationId, user.userId, avatarId, now)
    .run();

  const newConversation: Conversation = {
    id: conversationId,
    user_id: user.userId,
    avatar_id: avatarId,
    title: null,
    last_message: null,
    last_message_at: null,
    created_at: now
  };

  return c.json({ conversation: newConversation });
});

/**
 * GET /api/conversations
 * Get all conversations for the authenticated user
 */
conversations.get('/', async (c) => {
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    `SELECT c.*, a.name as avatar_name, a.profile_image_url as avatar_image
     FROM conversations c
     JOIN avatars a ON c.avatar_id = a.id
     WHERE c.user_id = ?
     ORDER BY c.last_message_at DESC, c.created_at DESC`
  )
    .bind(user.userId)
    .all();

  return c.json({ conversations: result.results || [] });
});

/**
 * GET /api/conversations/:id
 * Get a specific conversation
 */
conversations.get('/:id', async (c) => {
  const conversationId = c.req.param('id');
  const user = c.get('user');

  const conversation = await c.env.DB.prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  )
    .bind(conversationId, user.userId)
    .first<Conversation>();

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  return c.json({ conversation });
});

/**
 * GET /api/conversations/:id/messages
 * Get messages for a conversation
 */
conversations.get('/:id/messages', async (c) => {
  const conversationId = c.req.param('id');
  const user = c.get('user');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  // Verify user owns this conversation
  const conversation = await c.env.DB.prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  )
    .bind(conversationId, user.userId)
    .first();

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  // Get messages
  const result = await c.env.DB.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?'
  )
    .bind(conversationId, limit, offset)
    .all<Message>();

  return c.json({ messages: result.results || [] });
});

/**
 * DELETE /api/conversations/:id
 * Delete a conversation
 */
conversations.delete('/:id', async (c) => {
  const conversationId = c.req.param('id');
  const user = c.get('user');

  // Verify ownership
  const conversation = await c.env.DB.prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  )
    .bind(conversationId, user.userId)
    .first();

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  // Delete messages first (foreign key constraint)
  await c.env.DB.prepare(
    'DELETE FROM messages WHERE conversation_id = ?'
  )
    .bind(conversationId)
    .run();

  // Delete conversation
  await c.env.DB.prepare(
    'DELETE FROM conversations WHERE id = ?'
  )
    .bind(conversationId)
    .run();

  return c.json({ success: true });
});

export default conversations;
