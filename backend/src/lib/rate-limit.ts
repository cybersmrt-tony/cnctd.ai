/**
 * Rate limiting logic for message and image requests
 * Tracks daily usage per user based on subscription tier
 */

import type { Env, User, RateLimits } from './types';

/**
 * Get rate limits for a subscription tier
 */
export function getRateLimits(tier: string): RateLimits {
  switch (tier) {
    case 'premium':
      return {
        messagesPerDay: 999999, // Unlimited
        imagesPerDay: 100
      };
    case 'standard':
      return {
        messagesPerDay: 1000,
        imagesPerDay: 20
      };
    case 'free':
    default:
      return {
        messagesPerDay: 20,
        imagesPerDay: 5
      };
  }
}

/**
 * Check if a user has exceeded their message limit
 */
export async function checkMessageLimit(userId: string, env: Env): Promise<boolean> {
  const user = await getUserFromDB(userId, env);
  if (!user) return false;

  const limits = getRateLimits(user.subscription_tier);
  const today = new Date().toISOString().split('T')[0];

  // Reset counter if it's a new day
  if (!user.last_message_reset || user.last_message_reset !== today) {
    await env.DB.prepare(
      'UPDATE users SET message_count_today = 0, last_message_reset = ? WHERE id = ?'
    )
      .bind(today, userId)
      .run();
    return true; // User has quota available
  }

  return user.message_count_today < limits.messagesPerDay;
}

/**
 * Check if a user has exceeded their image limit
 */
export async function checkImageLimit(userId: string, env: Env): Promise<boolean> {
  const user = await getUserFromDB(userId, env);
  if (!user) return false;

  const limits = getRateLimits(user.subscription_tier);
  const today = new Date().toISOString().split('T')[0];

  // Reset counter if it's a new day
  if (!user.last_image_reset || user.last_image_reset !== today) {
    await env.DB.prepare(
      'UPDATE users SET image_count_today = 0, last_image_reset = ? WHERE id = ?'
    )
      .bind(today, userId)
      .run();
    return true; // User has quota available
  }

  return user.image_count_today < limits.imagesPerDay;
}

/**
 * Increment message count for a user
 */
export async function incrementMessageCount(userId: string, env: Env): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  await env.DB.prepare(
    'UPDATE users SET message_count_today = message_count_today + 1, last_message_reset = ? WHERE id = ?'
  )
    .bind(today, userId)
    .run();
}

/**
 * Increment image count for a user
 */
export async function incrementImageCount(userId: string, env: Env): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  await env.DB.prepare(
    'UPDATE users SET image_count_today = image_count_today + 1, last_image_reset = ? WHERE id = ?'
  )
    .bind(today, userId)
    .run();
}

/**
 * Get remaining message quota for a user
 */
export async function getRemainingMessages(userId: string, env: Env): Promise<number> {
  const user = await getUserFromDB(userId, env);
  if (!user) return 0;

  const limits = getRateLimits(user.subscription_tier);
  const today = new Date().toISOString().split('T')[0];

  // If new day, return full quota
  if (!user.last_message_reset || user.last_message_reset !== today) {
    return limits.messagesPerDay;
  }

  return Math.max(0, limits.messagesPerDay - user.message_count_today);
}

/**
 * Get remaining image quota for a user
 */
export async function getRemainingImages(userId: string, env: Env): Promise<number> {
  const user = await getUserFromDB(userId, env);
  if (!user) return 0;

  const limits = getRateLimits(user.subscription_tier);
  const today = new Date().toISOString().split('T')[0];

  // If new day, return full quota
  if (!user.last_image_reset || user.last_image_reset !== today) {
    return limits.imagesPerDay;
  }

  return Math.max(0, limits.imagesPerDay - user.image_count_today);
}

/**
 * Helper function to get user from database
 */
async function getUserFromDB(userId: string, env: Env): Promise<User | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<User>();

  return result;
}
