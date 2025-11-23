export interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'standard' | 'premium';
  subscription_status: 'active' | 'inactive' | 'cancelled';
}

export interface Avatar {
  id: string;
  name: string;
  tagline: string;
  profile_image_url: string;
  age: number;
  occupation: string;
  interests: string;
  tier: 'free' | 'standard' | 'premium';
}

export interface Conversation {
  id: string;
  avatar_id: string;
  avatar_name?: string;
  avatar_image?: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
