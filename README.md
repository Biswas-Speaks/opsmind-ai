# OpsMind AI — Operations & Asset Management Platform

OpsMind AI is an enterprise-style IT Operations Management platform integrating asset tracking, incident management, real-time CCTV monitoring, and multi-agent AI troubleshooting assistants.

## Monorepo Directory Structure

- `backend/`: Node.js, Express, TypeScript, Mongoose models, and Jest integration tests.
- `frontend/`: Next.js App Router, Tailwind CSS, Zustand, and Socket.IO client integrations.

## Deployment Setup

### 1. Database
Configure a MongoDB Atlas cluster and set the connection URL.

### 2. Backend (Render Web Service)
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Keys**:
  * `NODE_ENV`: `production`
  * `DATABASE_URL`: `mongodb+srv://...`
  * `JWT_SECRET`: `YOUR_SECRET`
  * `JWT_REFRESH_SECRET`: `YOUR_REFRESH_SECRET`
  * `CORS_ORIGIN`: `YOUR_VERCEL_FRONTEND_URL`
  * `GEMINI_API_KEY`: (Optional)

### 3. Frontend (Vercel)
- **Root Directory**: `frontend`
- **Framework Preset**: `Next.js`
- **Environment Keys**:
  * `NEXT_PUBLIC_API_URL`: `YOUR_RENDER_BACKEND_URL/api/v1`

## Local Development

### Installation
Run `npm install` in both `backend` and `frontend` folders.

### Seeding database
In `backend`, run:
```bash
npm run seed
```

### Running servers
In `backend`:
```bash
npm run dev
```

In `frontend`:
```bash
npm run dev
```
