# ⚙️ Environment Variables & Configuration

The application is completely configured through standard environment variables. A template file `.env.example` is located in the `backend/` directory.

---

## 1. Backend Environment Configuration (`backend/.env`)

```ini
# Server Port
PORT=5000

# Embedded SQLite Database Path
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET="smart-campus-jwt-super-secret-key-production-ready-2026-safe"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Campus Branding & Institutional Email Domain Restriction
COLLEGE_NAME="St. Bernard Institute of Technology"
COLLEGE_SHORT_NAME="SBIT"
COLLEGE_EMAIL_DOMAIN="sbjit.edu.in"
COLLEGE_DEPARTMENTS="Computer Science & Engineering,Electronics & Communication Engineering,Electrical Engineering,Mechanical Engineering,Civil Engineering,Information Technology,Applied Sciences & Humanities"
COLLEGE_SEMESTERS="1,2,3,4,5,6,7,8"

# Development Flags
DEV_MODE="true"
AUTO_VERIFY_EMAILS_IN_DEV="true"

# Client Web Application URL (CORS & Socket.io Origins)
CLIENT_URL="http://localhost:5173"
```

---

## 2. Frontend Configuration (`frontend/.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:5000/api/v1` | Backend REST API endpoint |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Real-time WebSocket / Socket.io server |
