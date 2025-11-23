/**
 * Type definitions for cnctd.ai backend
 */

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  AVATARS: R2Bucket;
  AI: Ai;
  CHAT_SESSION: DurableObjectNamespace;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  subscription_tier: 'free' | 'standard' | 'premium';
  subscription_status: 'active' | 'inactive' | 'cancelled';
  stripe_customer_id: string | null;
  message_count_today: number;
  image_count_today: number;
  last_message_reset: string | null;
  last_image_reset: string | null;
  created_at: string;
}

export interface Avatar {
  id: string;
  name: string;
  tagline: string;
  personality_prompt: string;
  physical_description: string;
  profile_image_url: string;
  age: number;
  occupation: string;
  interests: string;
  tier: 'free' | 'standard' | 'premium';
  is_active: boolean;
  created_at: string;
}

export interface AvatarImage {
  id: string;
  avatar_id: string;
  file_path: string;
  category: string;
  subcategory: string;
  tags: string;
  mood: string | null;
  time_of_day: string | null;
  setting: string | null;
  outfit_style: string | null;
  caption_template: string | null;
  send_count: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  avatar_id: string;
  title: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  tier: 'free' | 'standard' | 'premium';
  status: 'active' | 'inactive' | 'cancelled';
  current_period_end: string | null;
  created_at: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  tier: string;
  exp: number;
}

export interface RateLimits {
  messagesPerDay: number;
  imagesPerDay: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export interface PhotoRequest {
  category: string;
  tags: string[];
  mood?: string;
  setting?: string;
}

export interface ImageMatch {
  image: AvatarImage;
  score: number;
}

export interface WebSocketMessage {
  type: 'message' | 'photo_request' | 'error' | 'rate_limit' | 'typing';
  data?: any;
  error?: string;
}

export interface UserReceivedImage {
  id: string;
  user_id: string;
  avatar_id: string;
  image_id: string;
  conversation_id: string;
  sent_at: string;
}
