# 🎬 FlixVideo — AI-Powered Movie & TV Discovery Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green?logo=mongodb)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Cloud-red?logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

FlixVideo is a full-featured, production-grade streaming and movie discovery platform powered by Claude AI and OpenAI. It combines real-time content data from TMDB with AI-driven recommendations, social watch parties, and a complete subscription system with multi-gateway payments.

**Live Demo:** [flix-video-ten.vercel.app](https://flix-video-ten.vercel.app)  
**API Docs:** [flixvideo-backend.onrender.com/api-docs](https://flixvideo-backend.onrender.com/api-docs)  
**GitHub:** [github.com/wachira7/Flix-video](https://github.com/wachira7/Flix-video)

---

## ✨ Features

### 🤖 AI-Powered

- **AI Chat Assistant** — conversational movie/TV recommendations via Claude AI with fallback to OpenAI GPT-4
- **Personalized Recommendations** — generated from user favorites, ratings, and watch history
- **Conversation Persistence** — full AI chat history stored in MongoDB per user session

### 🎥 Content & Discovery

- **TMDB Integration** — real-time movie and TV show data, trailers, cast, and similar content
- **Smart Search** — autocomplete with Redis caching and multi-criteria filtering
- **Watch History** — MongoDB-backed progress tracking with continue-watching support
- **Streaming Availability** — where to watch by country (Netflix, Prime, etc.)

### 👥 Social Features

- **Watch Parties** — synchronized playback with real-time chat via Socket.io (chat stored in MongoDB)
- **Reviews & Ratings** — nested comments with threaded discussions
- **User Lists** — custom watchlists and favorites
- **Following** — social graph between users

### 💳 Payments & Subscriptions

- **Three Subscription Tiers** — Free, Basic, Premium with usage-based feature gating
- **Stripe** — card payments and checkout sessions
- **M-Pesa** — Safaricom STK Push for mobile money (Kenya)
- **NOWPayments** — cryptocurrency payments (Bitcoin, Ethereum, USDT)
- **Automated Billing** — BullMQ job queues for subscription management

### 📧 Notifications

- **Email Notifications** — payment success/failure, subscription expiry, watch party invites via Resend
- **In-App Notifications** — real-time bell icon with MongoDB-backed notification history
- **Socket.io** — real-time notification delivery

### 🔧 DevOps & Monitoring

- **Prometheus + Grafana** — production metrics on Oracle Cloud Free Tier VM
- **Sentry** — error tracking and monitoring
- **GitHub Actions** — CI/CD pipeline with automated deployments to Render
- **Docker Compose** — full local development environment

---

## 🛠 Tech Stack

| Layer | Technology |
| -------|-----------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Primary DB** | PostgreSQL 15 (users, payments, subscriptions) |
| **Document DB** | MongoDB (chat messages, watch history, AI conversations, notifications) |
| **Cache / Queue** | Redis Cloud, BullMQ |
| **AI** | Claude AI (Anthropic), OpenAI GPT-4 |
| **Payments** | Stripe, M-Pesa Daraja API, NOWPayments |
| **Storage** | AWS S3 (avatars), Cloudinary |
| **Email** | Resend |
| **Real-time** | Socket.io |
| **Monitoring** | Prometheus, Grafana, Sentry |
| **Deployment** | Render (backend), Vercel (frontend), Oracle Cloud (monitoring) |
| **CI/CD** | GitHub Actions |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                     │
│              Next.js 16 + TypeScript                     │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   Backend (Render)                       │
│              Node.js + Express.js                        │
│         107 REST endpoints + Socket.io                   │
└────┬──────────┬──────────┬───────────┬──────────────────┘
     │          │          │           │
┌────▼───┐ ┌───▼───┐ ┌────▼────┐ ┌───▼────────────────┐
│Postgres│ │MongoDB│ │  Redis  │ │   BullMQ Workers   │
│  (Core │ │(Chat, │ │ (Cache, │ │ (Payments, Notifs, │
│  data) │ │History│ │Queues)  │ │  Analytics, AI)    │
└────────┘ └───────┘ └─────────┘ └────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- MongoDB 7+
- Redis (or Redis Cloud account)
- Yarn

### 1. Clone the repository

```bash
git clone https://github.com/wachira7/Flix-video.git
cd Flix-video
```

### 2. Set up environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in your values

# Frontend
cp frontend/.env.example frontend/.env.local
# Fill in your values
```

### 3. Start with Docker Compose (recommended)

```bash
# Start all infrastructure services
docker-compose up -d

# This starts: PostgreSQL, MongoDB, Redis, Prometheus, Grafana
```

### 4. Run database migrations

```bash
cd backend
# Run all PostgreSQL migrations
for f in src/database/postgres/migrations/*.sql; do
  psql $DATABASE_URL -f "$f"
done
```

### 5. Start the backend

```bash
cd backend
yarn install
yarn dev
```

### 6. Start the frontend

```bash
cd frontend
yarn install
yarn dev
```

The app will be available at `http://localhost:3000`  
API docs at `http://localhost:5000/api-docs`

---

## 📁 Project Structure

```
Flix-video/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/     # Request handlers
│   │   │   ├── middlewares/     # Auth, rate limiting, validation
│   │   │   └── routes/          # Express routes with Swagger docs
│   │   ├── config/              # Database, cache, metrics config
│   │   ├── integrations/        # Stripe, M-Pesa, NOWPayments
│   │   ├── jobs/                # BullMQ workers and schedulers
│   │   ├── models/              # MongoDB models
│   │   ├── services/            # AI, email, storage services
│   │   ├── sockets/             # Socket.io handlers
│   │   └── utils/               # Logger, helpers, constants
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   ├── components/              # React components
│   ├── lib/                     # API clients, hooks, utilities
│   └── types/                   # TypeScript type definitions
├── infrastructure/
│   ├── monitoring/              # Prometheus + Grafana config
│   ├── kubernetes/              # K8s manifests
│   └── terraform/               # Infrastructure as Code
├── database/
│   ├── postgres/migrations/     # SQL migration files
│   └── mongodb/                 # MongoDB init scripts
└── docker-compose.yml
```

---

## 🔌 API Overview

The backend exposes **107 REST endpoints** across these modules:

| Module | Base Path | Description |
| --- | --- | --- |
| Auth | `/api/auth` | Registration, login, JWT, OAuth, 2FA |
| Users | `/api/users` | Profile, avatar, watch history |
| Movies | `/api/movies` | TMDB movie data |
| TV Shows | `/api/tv` | TMDB TV show data |
| Search | `/api/search` | Full-text search with Redis cache |
| AI | `/api/ai` | Chat, conversations, recommendations |
| Payments | `/api/payments` | Stripe, M-Pesa, crypto |
| Subscriptions | `/api/subscriptions` | Plans, upgrades, usage |
| Watch Party | `/api/watch-party` | Create, join, manage parties |
| Notifications | `/api/notifications` | In-app notification management |
| Admin | `/api/admin` | User management, analytics |

Full documentation available at `/api-docs` (Swagger UI).

---

## 💰 Payment Gateways

| Gateway | Method | Currency | Status |
| --------|--------|----------|--------|
| Stripe | Card | USD/KES | ✅ Production |
| M-Pesa | Mobile Money | KES | ✅ Sandbox |
| NOWPayments | Crypto (BTC, ETH, USDT) | USD | ✅ Sandbox |

---

## 📊 Monitoring

Prometheus metrics are exposed at `/metrics` and scraped by a Grafana dashboard deployed on Oracle Cloud Free Tier.

Key metrics tracked:

- API response times and error rates
- Payment success/failure rates
- Active WebSocket connections
- BullMQ job queue depths
- Redis cache hit rates
- Subscription tier distribution

---

## 🔐 Environment Variables

See `.env.example` for all required variables. Key ones:

```env
# Core
NODE_ENV=production
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...

# AI
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
AI_PRIMARY_PROVIDER=claude

# Payments
STRIPE_SECRET_KEY=...
MPESA_CONSUMER_KEY=...
NOWPAYMENTS_API_KEY=...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_S3_BUCKET=...

# Monitoring
SENTRY_DSN=...
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Emmanuel Warutere Wachira**  
Full-Stack Developer & DevOps Engineer  
[Portfolio](https://wew-portfolio.vercel.app) · [GitHub](https://github.com/wachira7) · [LinkedIn](https://linkedin.com/in/emmanuelwaruts77)
