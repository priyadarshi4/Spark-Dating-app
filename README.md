# 💖 Spark — Where Hearts Collide

> A production-ready, full-stack dating application built with Gen Z aesthetics, real-time features, and ML-powered recommendations.

![Spark Banner](https://via.placeholder.com/1200x400/1C1C2E/FF2D55?text=💖+Spark+—+Where+Hearts+Collide)

---

## 🌟 Overview

**Spark** is a complete, scalable dating platform combining Tinder-style swiping, Instagram-quality aesthetics, and real-time messaging — built for the modern era.

### Brand Identity
- **Name:** Spark
- **Tagline:** *Where hearts collide*
- **Colors:** Crimson `#FF2D55` · Violet `#BF5AF2` · Rose `#FF6CAE` · Dark `#1C1C2E`
- **Typography:** Playfair Display (headings) + DM Sans (body)

---
## 🏗️ Tech Stack

| Layer        | Technology                                                     |
|--------------|----------------------------------------------------------------|
| **Frontend** | Next.js 14, React 18, Framer Motion, Tailwind CSS, Zustand     |
| **Backend**  | Node.js, Express.js                                            |
| **Database** | MongoDB with Mongoose (geospatial indexes)                     |
| **Real-time**| Socket.io (chat, notifications, typing indicators)            |
| **Auth**     | JWT + Refresh tokens + Google OAuth 2.0 (Passport.js)         |
| **Storage**  | Cloudinary (photo CDN + transformations)                       |
| **Cache**    | Redis (feed deduplication, session blacklist)                  |
| **Security** | bcrypt, helmet, rate limiting, input validation                |

---

## 📁 Project Structure

```
spark/
├── backend/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   ├── redis.js          # Redis connection + no-op fallback
│   │   ├── socket.js         # Socket.io init + all event handlers
│   │   ├── passport.js       # JWT + Google OAuth strategies
│   │   └── cloudinary.js     # Cloudinary + multer storage
│   ├── controllers/
│   │   ├── authController.js     # Register, login, OAuth, refresh, verify
│   │   ├── userController.js     # Profile CRUD, location, preferences
│   │   ├── swipeController.js    # Like, pass, superlike, rewind, feed, who-liked-me
│   │   ├── matchController.js    # Match list, stats, unmatch
│   │   ├── chatController.js     # Messages, reactions, delete
│   │   ├── mediaController.js    # Photo upload/delete/reorder
│   │   ├── notificationController.js
│   │   ├── premiumController.js  # Stripe checkout, boost
│   │   └── adminController.js    # Dashboard, ban, fraud scan
│   ├── models/
│   │   ├── User.js           # Full user schema with virtuals, indexes
│   │   ├── Match.js          # Match + unread counts
│   │   ├── Message.js        # Chat messages + reactions
│   │   ├── Swipe.js          # Swipe history (for rewind + dedup)
│   │   └── Notification.js   # In-app notifications
│   ├── middleware/
│   │   ├── auth.js           # protect, requirePremium, requireAdmin
│   │   ├── rateLimiter.js    # Per-route rate limits
│   │   ├── errorHandler.js   # Global error handling
│   │   └── validator.js      # express-validator rules
│   ├── routes/
│   │   ├── auth.js           # /api/auth/*
│   │   ├── users.js          # /api/users/*
│   │   ├── swipes.js         # /api/swipes/*
│   │   ├── matches.js        # /api/matches/*
│   │   ├── chat.js           # /api/chat/*
│   │   ├── notifications.js  # /api/notifications/*
│   │   ├── media.js          # /api/media/*
│   │   ├── premium.js        # /api/premium/*
│   │   └── admin.js          # /api/admin/*
│   ├── services/
│   │   ├── mlService.js          # ELO scoring, compatibility, collaborative filtering, fraud
│   │   ├── notificationService.js
│   │   └── emailService.js       # Nodemailer templates
│   ├── utils/
│   │   └── logger.js         # Winston logger
│   ├── server.js             # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.js      # Auth guard + page transitions
    │   │   └── BottomNav.js      # Instagram-style tab bar
    │   ├── swipe/
    │   │   ├── SwipeCard.js      # Physics-based drag card
    │   │   └── FilterSheet.js    # Discovery filters bottom sheet
    │   └── animations/
    │       └── MatchOverlay.js   # Confetti + celebration modal
    ├── context/
    │   ├── AuthContext.js        # JWT auth state + token refresh
    │   ├── SocketContext.js      # Socket.io connection + event bus
    │   ├── ThemeContext.js       # Dark/light mode
    │   └── NotificationContext.js
    ├── hooks/
    │   ├── useSwipe.js
    │   └── index.js              # useDebounce, useGeolocation, etc.
    ├── pages/
    │   ├── index.js              # Landing page
    │   ├── auth.js               # Login + Register
    │   ├── onboarding.js         # Multi-step profile setup
    │   ├── discover.js           # Main swipe interface
    │   ├── matches.js            # Matches + who liked you
    │   ├── chat/
    │   │   ├── index.js          # Conversation list
    │   │   └── [id].js           # Chat room
    │   ├── profile.js            # My profile editor
    │   ├── profile/[id].js       # View someone's profile
    │   ├── notifications.js      # Activity feed
    │   ├── premium.js            # Upgrade page
    │   └── settings.js           # App settings
    ├── services/
    │   └── api.js                # Axios client + typed API helpers
    ├── styles/
    │   └── globals.css           # Design system: glass, neumorphism, animations
    ├── tailwind.config.js
    ├── next.config.js
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (Atlas or local)
- Redis (optional — app degrades gracefully without it)
- Cloudinary account

### 1. Clone & Install

```bash
git clone https://github.com/yourname/spark.git
cd spark
npm install          # installs root devDeps
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in: MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, CLOUDINARY_*

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run in Development

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Visit: **http://localhost:3000**

---

## 🔥 Core Features

### ❤️ Swipe System
- Physics-based drag cards (Framer Motion)
- Like / Pass / Super Like / Rewind
- Swipe overlay labels (LIKE / NOPE / SUPER)
- Daily swipe limits (free: 50/day, premium: unlimited)

### 💖 Matching Engine
- Mutual like detection
- Shared interests computed at match time
- Compatibility score (0-100)
- Real-time match celebration (confetti + animation)

### 💬 Real-time Chat
- Socket.io bidirectional messaging
- Typing indicators (animated dots)
- Read receipts
- Optimistic message updates
- Message reactions (emoji)
- Ice breaker suggestions

### 🔍 Discovery Feed
- Geo-distance filtering (`2dsphere` index)
- Age / gender preference filters
- ELO-based ranking with boost priority
- Redis-powered swipe deduplication

### 🤖 ML Services
- **ELO scoring** — attractiveness score updates after every swipe
- **Compatibility score** — interests, age, goals, activity
- **Collaborative filtering** — "users who liked same profiles"
- **Fraud detection** — heuristic scoring (photos, name, activity rate)
- **Nightly batch job** — recomputes engagement scores

### 💎 Premium (Gold / Platinum)
- See who liked you
- Unlimited swipes + rewinds + super likes
- Profile Boost (30-min discovery priority)
- Stripe checkout integration (placeholder, plug in key)

---

## 📡 API Reference

| Method | Endpoint                        | Auth     | Description                    |
|--------|---------------------------------|----------|--------------------------------|
| POST   | /api/auth/register              | —        | Register new user              |
| POST   | /api/auth/login                 | —        | Email/password login           |
| GET    | /api/auth/google                | —        | Google OAuth redirect          |
| POST   | /api/auth/refresh               | —        | Refresh JWT token              |
| GET    | /api/auth/me                    | ✅       | Get current user               |
| GET    | /api/swipes/feed                | ✅       | Discovery feed (paginated)     |
| POST   | /api/swipes                     | ✅       | Swipe (like/pass/superlike)    |
| POST   | /api/swipes/rewind              | ✅ 💎   | Undo last swipe                |
| GET    | /api/swipes/who-liked-me        | ✅       | List users who liked you       |
| GET    | /api/matches                    | ✅       | Get all matches                |
| DELETE | /api/matches/:id                | ✅       | Unmatch                        |
| GET    | /api/chat/:matchId/messages     | ✅       | Paginated message history      |
| POST   | /api/chat/:matchId/messages     | ✅       | Send REST message              |
| POST   | /api/media/photos               | ✅       | Upload photo (Cloudinary)      |
| DELETE | /api/media/photos/:photoId      | ✅       | Delete photo                   |
| GET    | /api/notifications              | ✅       | In-app notifications           |
| PUT    | /api/notifications/read-all     | ✅       | Mark all as read               |
| POST   | /api/premium/boost              | ✅ 💎   | Activate profile boost         |
| GET    | /api/admin/dashboard            | 🔐       | Admin stats dashboard          |

---

## 🔌 Socket.io Events

| Event              | Direction       | Payload                              |
|--------------------|-----------------|--------------------------------------|
| `join:matches`     | Client → Server | —                                    |
| `message:send`     | Client → Server | `{ matchId, content, type }`         |
| `message:new`      | Server → Client | Message object                       |
| `typing:start`     | Client → Server | `{ matchId }`                        |
| `typing:stop`      | Client → Server | `{ matchId }`                        |
| `message:read`     | Client → Server | `{ matchId }`                        |
| `match:new`        | Server → Client | `{ match, otherUser }`               |
| `notification:new` | Server → Client | Notification object                  |
| `superlike:received`| Server → Client | `{ from, name }`                    |
| `user:online`      | Server → Client | `{ userId }`                         |
| `user:offline`     | Server → Client | `{ userId, lastActive }`             |

---

## 🎨 Design System

### Color Palette
```css
--crimson:  #FF2D55   /* Primary CTA, hearts */
--violet:   #BF5AF2   /* Accents, gradients */
--rose:     #FF6CAE   /* Soft accents */
--gold:     #FFD700   /* Premium indicators */
--dark:     #1C1C2E   /* Primary background */
--darker:   #0F0F1A   /* Deepest background */
```

### UI Patterns
- **Glassmorphism** — `backdrop-filter: blur(20px)` + low-opacity white fill
- **Neumorphism** — subtle shadow insets for depth
- **Gradient text** — pink → violet on display headings
- **Glow buttons** — `box-shadow` with color-matched rgba
- **Framer Motion** — spring physics for all card/modal animations

---

## 🔐 Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** access tokens (7d) + **refresh tokens** (30d)
- Refresh token **blacklisting** in Redis on logout
- **Rate limiting** per route (auth: 10/15min, swipes: 30/min)
- **Helmet.js** HTTP security headers
- Input validation via **express-validator**
- **Fraud detection** ML heuristics with auto-ban at score ≥ 70

---

## 📈 Scalability Notes

- MongoDB `2dsphere` index for O(log n) geo queries
- Redis swipe deduplication (7-day TTL sets)
- Socket.io rooms per match (efficient message routing)
- Cloudinary CDN for global media delivery
- Connection pooling (maxPoolSize: 10) on MongoDB
- Graceful shutdown with SIGTERM handling
- Winston structured logging with file transport

---

## 🛣️ Roadmap

- [ ] Video calling (WebRTC)
- [ ] Story / 24h disappearing content
- [ ] AI-powered ice breakers (Anthropic API)
- [ ] Group events / meetups
- [ ] Voice messages
- [ ] Background check integration
- [ ] Multi-language support (i18n)
- [ ] Native iOS/Android (React Native port)

---

## 📄 License

MIT — Built with 💖 by the Spark team
