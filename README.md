# TeamFlow – Project Management SaaS

> **Tagline:** Plan clearly. Work together. Deliver better.

TeamFlow is a production-grade B2B SaaS project management application built with the MERN stack (MongoDB, Express, React, Node.js). It provides organizations with workspaces, projects, Kanban boards, task tracking, team collaboration, real-time updates, notifications, and analytics.

---

## 🎨 Design System

- **Primary Forest Green:** `#173F35`
- **Secondary Forest Green:** `#285747`
- **Warm Ivory Background:** `#F7F6F2`
- **White Surface:** `#FFFFFF`
- **Muted Sage:** `#A9B8A5`
- **Amber Accent:** `#D49A52`
- **Charcoal Text:** `#242B27`
- **Secondary Text:** `#747B73`
- **Border:** `#E9E7E0`
- **Status Colors:**
  - Success: `#477A5B`
  - Warning: `#D49A52`
  - Danger: `#C66A5A`

**Typography:**
- Headings: `Manrope`, sans-serif
- Body: `Inter`, sans-serif

---

## 🏗️ Architecture & Project Structure

```text
TeamFlow/
├── client/                     # Vite + React Frontend
│   ├── public/                 # Static assets & favicon
│   ├── src/
│   │   ├── assets/             # Brand logos & icons
│   │   ├── components/         # Common, Layout, and UI design system components
│   │   ├── features/           # Feature-sliced modules (auth, workspace, projects, tasks, etc.)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Page layouts (MainLayout)
│   │   ├── pages/              # Route view pages (HomePage, StatusPage, NotFoundPage)
│   │   ├── routes/             # App routing definitions
│   │   ├── services/           # Axios API client & services
│   │   ├── store/              # Redux Toolkit store & slices
│   │   ├── utils/              # Utility functions (cn class combiner)
│   │   ├── App.jsx             # Root router component
│   │   └── main.jsx            # Entry point
│   ├── .env.example            # Client environment template
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Express + Node.js API Server
│   ├── src/
│   │   ├── config/             # DB & Environment validation
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Error handlers, authentication, CORS, rate limits
│   │   ├── models/             # Mongoose database models
│   │   ├── routes/             # Express API routes (health, auth, etc.)
│   │   ├── services/           # Business logic
│   │   ├── sockets/            # Socket.IO handlers
│   │   ├── validators/         # Zod request validators
│   │   ├── utils/              # Server utility functions
│   │   ├── app.js              # Express app initialization
│   │   └── server.js           # Server listen & DB connection
│   ├── tests/                  # Automated integration & unit tests
│   ├── .env.example            # Server environment template
│   └── package.json
├── docs/                       # Project specifications and stage guidelines
├── .gitignore
├── package.json                # Workspace root scripts
└── README.md
```

---

## ⚙️ Environment Configuration

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Key configuration keys:
- `PORT`: Port for API server (default `5000`)
- `NODE_ENV`: `development` | `production` | `test`
- `MONGODB_URI`: MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/teamflow`)
- `CLIENT_URL`: Allowed CORS origin (default `http://localhost:5173`)
- `JWT_ACCESS_SECRET`: Secret for signing access tokens
- `JWT_REFRESH_SECRET`: Secret for signing refresh tokens

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```
Key configuration keys:
- `VITE_API_URL`: Base API endpoint (default `http://localhost:5000/api`)
- `VITE_SOCKET_URL`: Base Socket.IO URL (default `http://localhost:5000`)

---

## 🚀 Getting Started

### 1. Installation

Install all root, client, and server dependencies:
```bash
npm install
```

Or install in each directory individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Running in Development Mode

Run the Backend server (starts on `http://localhost:5000`):
```bash
npm run dev:server
```

Run the Frontend client (starts on `http://localhost:5173`):
```bash
npm run dev:client
```

### 3. Running Automated Tests

Run backend tests:
```bash
npm run test:server
```

Run frontend tests:
```bash
npm run test:client
```

Run all tests:
```bash
npm test
```

### 4. Verifying Health Endpoint

Visit:
- `http://localhost:5000/api/health`
Response:
```json
{
  "status": "ok",
  "app": "TeamFlow API",
  "version": "1.0.0",
  "timestamp": "2026-11-14T...",
  "uptime": "10.2s",
  "environment": "development",
  "services": {
    "database": {
      "status": "connected"
    }
  }
}
```
