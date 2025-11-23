# cnctd.ai Quick Setup Guide

This is a step-by-step guide to get cnctd.ai running locally.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Cloudflare account created
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Logged into Wrangler (`wrangler login`)
- [ ] Stripe account (for payment testing)

## Step-by-Step Setup

### 1. Backend Setup (15 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create D1 database
npx wrangler d1 create cnctd-db
# Copy the database_id and update wrangler.toml line 10

# Create KV namespace
npx wrangler kv:namespace create SESSIONS
# Copy the id and update wrangler.toml line 15

# Create R2 bucket
npx wrangler r2 bucket create cnctd-avatars

# Run migrations locally
npx wrangler d1 execute cnctd-db --local --file=migrations/001_initial_schema.sql
npx wrangler d1 execute cnctd-db --local --file=migrations/002_seed_avatars.sql

# Set Stripe secrets (can skip for now, use test mode)
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# Start backend
npm run dev
```

Backend should now be running at `http://localhost:8787`

### 2. Frontend Setup (5 minutes)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend should now be running at `http://localhost:5173`

### 3. Test the Application

1. Open browser to `http://localhost:5173`
2. Click "Sign Up"
3. Create an account (use any email/password)
4. Browse available avatars
5. Click an avatar to start chatting
6. Send a message
7. Try requesting a photo: "Can I see a photo of you?"

### 4. Optional: Run Test Script

```bash
cd backend
chmod +x scripts/test-endpoints.sh
./scripts/test-endpoints.sh http://localhost:8787
```

## Common Issues and Solutions

### Issue: Database not found
**Solution**: Make sure you ran the migrations with `--local` flag for local development

### Issue: WebSocket connection failed
**Solution**: Ensure both backend and frontend are running. Check browser console for errors.

### Issue: CORS errors
**Solution**: Make sure FRONTEND_URL in wrangler.toml matches your frontend URL

### Issue: JWT errors
**Solution**: Clear localStorage and try logging in again

### Issue: Images not loading
**Solution**: The MVP uses placeholder images. In production, upload actual images to R2 bucket.

## Next Steps

1. **Add Image Library**: Upload actual avatar images to R2 bucket
2. **Configure Stripe**: Set up real Stripe products and webhooks
3. **Deploy Backend**: `npm run deploy` from backend directory
4. **Deploy Frontend**: Build and deploy to Cloudflare Pages
5. **Update Environment Variables**: Point frontend to production API

## Development Workflow

### Making Changes

Backend changes:
```bash
cd backend
# Make changes
npm run dev  # Auto-reloads
```

Frontend changes:
```bash
cd frontend
# Make changes
npm run dev  # Hot reload enabled
```

### Testing

```bash
# Backend type checking
cd backend && npm run type-check

# Frontend type checking
cd frontend && npm run type-check

# API endpoint testing
cd backend && ./scripts/test-endpoints.sh
```

### Database Queries

```bash
# Local database
npx wrangler d1 execute cnctd-db --local --command="SELECT * FROM users"

# Production database
npx wrangler d1 execute cnctd-db --command="SELECT * FROM users"
```

## Production Deployment

### Backend

1. Update `wrangler.toml`:
   - Change `JWT_SECRET` to a secure random string
   - Update `FRONTEND_URL` to production URL

2. Run production migrations:
```bash
npx wrangler d1 execute cnctd-db --file=migrations/001_initial_schema.sql
npx wrangler d1 execute cnctd-db --file=migrations/002_seed_avatars.sql
```

3. Deploy:
```bash
npm run deploy
```

### Frontend

1. Update environment variables for production API

2. Build:
```bash
npm run build
```

3. Deploy `dist` folder to hosting platform

## Project Structure

```
cnctd.ai/
├── backend/               # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts      # Main entry point
│   │   ├── chat-session.ts  # WebSocket handler
│   │   ├── lib/          # Utilities
│   │   ├── routes/       # API routes
│   │   └── middleware/   # Auth middleware
│   ├── migrations/       # Database schema
│   └── wrangler.toml     # Cloudflare config
│
└── frontend/             # React app
    ├── src/
    │   ├── pages/        # Route pages
    │   ├── components/   # React components
    │   ├── lib/          # API client, auth
    │   └── styles/       # Tailwind CSS
    └── package.json

```

## Support

For questions or issues:
1. Check the main [README.md](README.md)
2. Review Cloudflare Workers documentation
3. Check browser console for errors
4. Review backend logs with `npm run tail`

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Hono Framework](https://hono.dev/)
- [React Router](https://reactrouter.com/)
