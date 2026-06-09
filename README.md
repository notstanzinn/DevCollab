# 🚀 DevCollab — Real-time Code Collaboration Platform

A full-stack platform where developers share, fork, and collaboratively edit code snippets in real time.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Monaco Editor, Socket.io-client |
| Backend | Node.js + Express, Socket.io |
| Database | MongoDB (Atlas) + Mongoose |
| Auth | JWT (httpOnly cookies, refresh tokens) |
| Payments | Stripe subscriptions |
| Email | SendGrid |
| File Uploads | Cloudinary |
| Styling | Vanilla CSS (dark glassmorphism) |

## Project Structure

```
PROJECT/
├── client/     ← React + Vite frontend (port 5173)
└── server/     ← Node.js + Express backend (port 5000)
```

## Setup

### 1. Fill in environment variables

**`server/.env`**
```
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@yourdomain.com
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

**`client/.env`**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2. Start the servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Visit: http://localhost:5173

## Features

- ✅ **Auth** — Register/login with JWT (httpOnly cookies + refresh token rotation)
- ✅ **Snippets** — Create, edit, delete, search, filter by language with pagination
- ✅ **Real-time collab** — Socket.io rooms per snippet, live code sync + presence avatars
- ✅ **Social** — Star, fork, follow/unfollow with in-app notifications
- ✅ **Comments** — Threaded comments with replies and likes
- ✅ **Payments** — Stripe subscription (Free/Pro plans) with webhook handling
- ✅ **Email** — SendGrid welcome + notification emails
- ✅ **Avatar uploads** — Cloudinary with auto face-crop
- ✅ **Admin dashboard** — User/snippet management, stats, role assignment
- ✅ **Dark glassmorphism UI** — Premium design with micro-animations

## Stripe Setup

1. Create a product in Stripe Dashboard
2. Add a recurring price (monthly, $9.99)
3. Copy the `price_xxx` ID → `STRIPE_PRO_PRICE_ID`
4. For webhooks, listen to: `checkout.session.completed`, `customer.subscription.deleted`

## API Endpoints

| Method | Route | Auth |
|---|---|---|
| POST | /api/auth/register | — |
| POST | /api/auth/login | — |
| GET | /api/snippets | optional |
| POST | /api/snippets | ✅ |
| POST | /api/snippets/:id/star | ✅ |
| POST | /api/snippets/:id/fork | ✅ |
| GET | /api/admin/stats | admin |
| POST | /api/payments/create-checkout | ✅ |
| POST | /api/payments/webhook | — |
