# cnctd.ai - AI Companion Chat Platform

A full-stack AI companion chat platform built with Cloudflare Workers, React, and Workers AI. Users can have real-time conversations with AI avatars that have unique personalities and can share photos from a curated library.

## Features

- **Real-time Chat**: WebSocket-based chat using Cloudflare Durable Objects
- **AI Personalities**: Each avatar has a unique personality powered by Workers AI
- **Smart Image Library**: Photo sharing system that intelligently matches user requests
- **Subscription Tiers**: Freemium model with Free, Standard ($20/mo), and Premium ($40/mo) plans
- **Rate Limiting**: Usage limits based on subscription tier
- **Stripe Integration**: Secure payment processing
- **JWT Authentication**: Secure user authentication
- **Modern Stack**: React + TypeScript + Tailwind CSS

## Tech Stack

### Backend
- Cloudflare Workers (Hono framework)
- D1 (SQLite database)
- R2 (Object storage for images)
- Durable Objects (WebSocket connections)
- Workers AI (Llama 3.1 8B)
- Stripe (Payments)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Project Structure

```
cnctd.ai/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main worker
│   │   ├── chat-session.ts       # Durable Object for WebSocket
│   │   ├── lib/
│   │   │   ├── auth.ts           # JWT & password hashing
│   │   │   ├── rate-limit.ts     # Rate limiting logic
│   │   │   └── types.ts          # TypeScript types
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── avatars.ts
│   │   │   ├── conversations.ts
│   │   │   ├── images.ts
│   │   │   └── payments.ts
│   │   └── middleware/
│   │       └── auth-middleware.ts
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_seed_avatars.sql
│   └── wrangler.toml
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── lib/
    │   └── styles/
    └── package.json
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Stripe account (for payments)

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create Cloudflare resources**

Create D1 database:
```bash
npx wrangler d1 create cnctd-db
```
Copy the `database_id` from the output and update `wrangler.toml`

Create KV namespace:
```bash
npx wrangler kv:namespace create SESSIONS
```
Copy the `id` from the output and update `wrangler.toml`

Create R2 bucket:
```bash
npx wrangler r2 bucket create cnctd-avatars
```

4. **Run database migrations**
```bash
npx wrangler d1 execute cnctd-db --local --file=migrations/001_initial_schema.sql
npx wrangler d1 execute cnctd-db --local --file=migrations/002_seed_avatars.sql
```

For production:
```bash
npx wrangler d1 execute cnctd-db --file=migrations/001_initial_schema.sql
npx wrangler d1 execute cnctd-db --file=migrations/002_seed_avatars.sql
```

5. **Set secrets**
```bash
npx wrangler secret put STRIPE_SECRET_KEY
# Enter your Stripe secret key when prompted

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter your Stripe webhook secret when prompted
```

6. **Update JWT_SECRET in wrangler.toml for production**

7. **Start development server**
```bash
npm run dev
```

Backend will run on `http://localhost:8787`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file** (optional)
```bash
VITE_API_URL=http://localhost:8787/api
VITE_WS_URL=ws://localhost:8787/api
```

4. **Start development server**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Deployment

#### Backend Deployment

```bash
cd backend
npm run deploy
```

#### Frontend Deployment

Build for production:
```bash
cd frontend
npm run build
```

Deploy the `dist` folder to Cloudflare Pages, Vercel, or your preferred hosting platform.

## Subscription Tiers

### Free Tier
- 20 messages per day
- 5 images per day
- Access to free avatars

### Standard ($20/mo)
- 1,000 messages per day
- 20 images per day
- Access to standard avatars

### Premium ($40/mo)
- Unlimited messages
- 100 images per day
- Access to all avatars

## Database Schema

See [backend/migrations/001_initial_schema.sql](backend/migrations/001_initial_schema.sql) for complete schema.

Main tables:
- `users` - User accounts and subscription info
- `avatars` - AI avatar profiles
- `avatar_images` - Photo library with metadata
- `conversations` - Chat sessions
- `messages` - Chat messages
- `user_received_images` - Track sent images to avoid repetition
- `subscriptions` - Stripe subscription records

## Image Library System

The platform uses a pre-generated image library instead of real-time generation:

1. Images are organized by avatar, category, and tags
2. User photo requests are parsed using AI
3. Matching algorithm scores images based on:
   - Category match
   - Tag relevance
   - Previously sent images (avoids repetition)
   - Send count (prefers less-used images)
4. Top candidates are selected with randomness for variety

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Avatars
- `GET /api/avatars` - List all avatars
- `GET /api/avatars/:id` - Get avatar details

### Conversations
- `POST /api/conversations/start` - Start conversation
- `GET /api/conversations` - List user conversations
- `GET /api/conversations/:id/messages` - Get messages

### Payments
- `POST /api/payments/create-checkout` - Create Stripe checkout
- `POST /api/payments/webhook` - Stripe webhook handler

### WebSocket
- `GET /api/chat/:conversationId/ws` - WebSocket connection for real-time chat

## Environment Variables

### Backend (wrangler.toml)
- `JWT_SECRET` - Secret for JWT signing
- `FRONTEND_URL` - Frontend URL for CORS
- `STRIPE_SECRET_KEY` - Stripe secret (via wrangler secret)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (via wrangler secret)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL

## Development Tips

1. **Local Testing**: Use `wrangler dev` to test Workers locally
2. **Database Queries**: Use `npx wrangler d1 execute cnctd-db --local --command="SELECT * FROM users"`
3. **Logs**: Use `npm run tail` to view production logs
4. **Type Safety**: Run `npm run type-check` in both backend and frontend

## Security Features

- JWT-based authentication
- Password hashing with PBKDF2
- CORS protection
- SQL injection prevention (prepared statements)
- Rate limiting
- Input validation with Zod

## Future Enhancements

- Voice messages
- Video calls
- Group chats
- Custom avatars
- Image generation integration
- Mobile apps
- Push notifications

## Contributing

This is a private project. For inquiries, contact the development team.

## License

Proprietary - All rights reserved

## Support

For technical support or questions, please contact support@cnctd.ai
