/**
 * Main Cloudflare Worker entry point
 * Routes all API requests and WebSocket connections
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ChatSession } from './chat-session';
import auth from './routes/auth';
import avatars from './routes/avatars';
import conversations from './routes/conversations';
import images from './routes/images';
import payments from './routes/payments';
import type { Env } from './lib/types';

export { ChatSession };

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors({
  origin: (origin) => {
    const allowedOrigins = ['http://localhost:5173', 'https://cnctd.ai'];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600
}));

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'cnctd.ai API',
    version: '1.0.0',
    status: 'operational'
  });
});

// Mount API routes
app.route('/api/auth', auth);
app.route('/api/avatars', avatars);
app.route('/api/conversations', conversations);
app.route('/api/images', images);
app.route('/api/payments', payments);

/**
 * WebSocket endpoint for real-time chat
 * GET /api/chat/:conversationId/ws?userId=xxx&avatarId=xxx&token=xxx
 */
app.get('/api/chat/:conversationId/ws', async (c) => {
  const conversationId = c.req.param('conversationId');
  const userId = c.req.query('userId');
  const avatarId = c.req.query('avatarId');
  const token = c.req.query('token');

  if (!userId || !avatarId || !token) {
    return c.text('Missing required parameters', 400);
  }

  // TODO: Verify JWT token here for production
  // const payload = await verifyJWT(token, c.env.JWT_SECRET);
  // if (!payload || payload.userId !== userId) {
  //   return c.text('Unauthorized', 401);
  // }

  // Get Durable Object stub
  const id = c.env.CHAT_SESSION.idFromName(conversationId);
  const stub = c.env.CHAT_SESSION.get(id);

  // Forward the WebSocket upgrade request
  const url = new URL(c.req.url);
  url.searchParams.set('userId', userId);
  url.searchParams.set('conversationId', conversationId);
  url.searchParams.set('avatarId', avatarId);

  const request = new Request(url.toString(), c.req.raw);
  return stub.fetch(request);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal server error',
    message: err.message
  }, 500);
});

export default app;
