/**
 * Payment routes: Stripe integration for subscriptions
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import Stripe from 'stripe';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../middleware/auth-middleware';
import type { Env } from '../lib/types';

const payments = new Hono<{ Bindings: Env }>();

const createCheckoutSchema = z.object({
  tier: z.enum(['standard', 'premium'])
});

/**
 * POST /api/payments/create-checkout
 * Create a Stripe checkout session for subscription
 */
payments.post('/create-checkout', authMiddleware, zValidator('json', createCheckoutSchema), async (c) => {
  const { tier } = c.req.valid('json');
  const user = c.get('user');

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia'
  });

  // Get or create Stripe customer
  let customerId: string;

  const existingUser = await c.env.DB.prepare(
    'SELECT stripe_customer_id FROM users WHERE id = ?'
  )
    .bind(user.userId)
    .first<{ stripe_customer_id: string | null }>();

  if (existingUser?.stripe_customer_id) {
    customerId = existingUser.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.userId
      }
    });
    customerId = customer.id;

    // Update user with customer ID
    await c.env.DB.prepare(
      'UPDATE users SET stripe_customer_id = ? WHERE id = ?'
    )
      .bind(customerId, user.userId)
      .run();
  }

  // Determine price based on tier
  const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = tier === 'premium'
    ? {
        currency: 'usd',
        product_data: {
          name: 'Premium Subscription',
          description: 'Unlimited messages, 100 images/day, access to all avatars'
        },
        unit_amount: 4000, // $40.00
        recurring: {
          interval: 'month'
        }
      }
    : {
        currency: 'usd',
        product_data: {
          name: 'Standard Subscription',
          description: '1000 messages/day, 20 images/day, access to standard avatars'
        },
        unit_amount: 2000, // $20.00
        recurring: {
          interval: 'month'
        }
      };

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: priceData,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${c.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${c.env.FRONTEND_URL}/pricing`,
    metadata: {
      userId: user.userId,
      tier
    }
  });

  return c.json({ url: session.url });
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhooks
 */
payments.post('/webhook', async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia'
  });

  const sig = c.req.header('stripe-signature');
  if (!sig) {
    return c.json({ error: 'No signature' }, 400);
  }

  let event: Stripe.Event;

  try {
    const body = await c.req.text();
    event = stripe.webhooks.constructEvent(body, sig, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return c.json({ error: 'Webhook signature verification failed' }, 400);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;

      if (userId && tier && session.subscription) {
        // Update user subscription
        await c.env.DB.prepare(
          'UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE id = ?'
        )
          .bind(tier, 'active', userId)
          .run();

        // Create subscription record
        const subscriptionId = nanoid();
        await c.env.DB.prepare(
          'INSERT INTO subscriptions (id, user_id, stripe_subscription_id, tier, status) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(subscriptionId, userId, session.subscription as string, tier, 'active')
          .run();
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const status = subscription.status === 'active' ? 'active' : 'inactive';
        await c.env.DB.prepare(
          'UPDATE users SET subscription_status = ? WHERE id = ?'
        )
          .bind(status, userId)
          .run();

        await c.env.DB.prepare(
          'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?'
        )
          .bind(status, subscription.id)
          .run();
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await c.env.DB.prepare(
          'UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE id = ?'
        )
          .bind('free', 'inactive', userId)
          .run();

        await c.env.DB.prepare(
          'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?'
        )
          .bind('cancelled', subscription.id)
          .run();
      }
      break;
    }
  }

  return c.json({ received: true });
});

/**
 * GET /api/payments/subscription
 * Get current subscription status
 */
payments.get('/subscription', authMiddleware, async (c) => {
  const user = c.get('user');

  const subscription = await c.env.DB.prepare(
    'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  )
    .bind(user.userId)
    .first();

  return c.json({ subscription });
});

export default payments;
