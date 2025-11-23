-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'inactive',
  stripe_customer_id TEXT,
  message_count_today INTEGER DEFAULT 0,
  image_count_today INTEGER DEFAULT 0,
  last_message_reset TEXT,
  last_image_reset TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Avatars table
CREATE TABLE avatars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  personality_prompt TEXT NOT NULL,
  physical_description TEXT NOT NULL,
  profile_image_url TEXT NOT NULL,
  age INTEGER,
  occupation TEXT,
  interests TEXT,
  tier TEXT DEFAULT 'free',
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Avatar images library
CREATE TABLE avatar_images (
  id TEXT PRIMARY KEY,
  avatar_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  tags TEXT NOT NULL,
  mood TEXT,
  time_of_day TEXT,
  setting TEXT,
  outfit_style TEXT,
  caption_template TEXT,
  send_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (avatar_id) REFERENCES avatars(id)
);

-- Conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  title TEXT,
  last_message TEXT,
  last_message_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (avatar_id) REFERENCES avatars(id)
);

-- Messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Track sent images to avoid repetition
CREATE TABLE user_received_images (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (image_id) REFERENCES avatar_images(id)
);

-- Subscriptions
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_avatar ON conversations(avatar_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_avatar_images_avatar ON avatar_images(avatar_id);
CREATE INDEX idx_avatar_images_category ON avatar_images(category);
CREATE INDEX idx_received_user_avatar ON user_received_images(user_id, avatar_id);
