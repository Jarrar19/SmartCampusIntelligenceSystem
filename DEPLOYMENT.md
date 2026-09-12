# 🚀 Live Deployment Guide — Smart Campus Intelligence System

This guide provides step-by-step instructions to deploy the **Smart Campus Intelligence System** live to the cloud.

---

## 🏗️ Architecture Overview

| Component | Technology | Recommended Host | Free Tier Available? |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite + Tailwind CSS | **Vercel** or **Netlify** | ✅ Yes (100% Free) |
| **Backend** | Node.js + Express + Socket.IO | **Render** or **Railway** | ✅ Yes (Free on Render, Trial on Railway) |
| **Database** | SQLite with Prisma ORM | Embedded disk volume | ✅ Included |
| **Realtime** | WebSockets (Socket.IO) | Render Web Service / VPS | ✅ Supported |

---

## 📦 Step 0: Commit and Push Latest Code to GitHub

Before deploying to Vercel or Render, ensure all your latest changes are pushed to GitHub:

```bash
git add .
git commit -m "feat: configure deployment files and CORS enhancements"
git push origin main
```

---

## 🌟 Method 1: Render (Backend) + Vercel (Frontend) — Recommended Free Option

### Part A: Deploy the Backend on Render

1. Go to [render.com](https://render.com) and sign in (using your GitHub account).
2. Click **New +** → **Web Service**.
3. Select your GitHub repository: `SmartCampusIntelligenceSystem`.
4. Configure the settings:
   - **Name**: `smart-campus-backend` (or any unique name)
   - **Region**: Closest to you (e.g., Singapore, Frankfurt, or Oregon)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install --include=dev && npx prisma generate && npm run build && npx prisma db push && npm run prisma:seed
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`

5. Add **Environment Variables** (under *Advanced* / *Environment Variables*):
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `5000` | Port for server |
   | `DATABASE_URL` | `file:./dev.db` | Local SQLite database file |
   | `JWT_SECRET` | *(Generate a random 64-character string)* | Must not be default in production |
   | `JWT_EXPIRES_IN` | `24h` | Token expiration |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token duration |
   | `COLLEGE_NAME` | `S. B. Jain Institute of Technology, Management & Research` | College branding |
   | `COLLEGE_SHORT_NAME` | `SBJIT` | Short name |
   | `COLLEGE_EMAIL_DOMAIN` | `sbjit.edu.in` | Valid email domain |
   | `DEV_MODE` | `false` | Disable mock auth bypass |
   | `AUTO_VERIFY_EMAILS_IN_DEV` | `true` | Allows newly registered users to sign in immediately |
   | `CLIENT_URL` | `https://your-frontend.vercel.app` *(update after Part B)* | Frontend URL for CORS & WebSockets |

6. Click **Create Web Service**.
   - Render will build the TypeScript project, push Prisma schemas, run seeds, and start the server.
   - Once deployed, copy your backend URL (e.g., `https://smart-campus-backend.onrender.com`).
   - Test it by visiting `https://smart-campus-backend.onrender.com/health` in your browser. It should return `{"status":"healthy", ...}`.

---

### Part B: Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `SmartCampusIntelligenceSystem`.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://smart-campus-backend.onrender.com/api/v1` *(replace with your actual Render URL)* |
6. Click **Deploy**.
   - Vercel will build and deploy your frontend in ~30 seconds.
   - You will get a live URL (e.g., `https://smart-campus-frontend.vercel.app`).

---

### Part C: Link CORS (Final Step)

1. Return to your **Render** Dashboard → Your Backend Service → **Environment**.
2. Update `CLIENT_URL` with your actual Vercel URL:
   ```env
   CLIENT_URL=https://smart-campus-frontend.vercel.app
   ```
3. Save changes. Render will automatically redeploy with the updated CORS policy.

---

## 🐳 Method 2: Docker Compose (Single VPS / AWS EC2 / DigitalOcean)

If you have a Linux VPS (Ubuntu 22.04 / 24.04) and want both frontend, backend, database, and reverse proxy running together in 1 command:

1. **SSH into your server**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Docker & Docker Compose**:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-v2
   sudo systemctl enable --now docker
   ```

3. **Clone the repository**:
   ```bash
   git clone https://github.com/Jarrar19/SmartCampusIntelligenceSystem.git
   cd SmartCampusIntelligenceSystem
   ```

4. **Launch containers**:
   ```bash
   docker compose up -d --build
   ```

5. **Access the application**:
   - Open `http://your-server-ip` in your browser.
   - Nginx will serve the frontend on port 80 and automatically proxy API calls (`/api/`) and WebSockets (`/socket.io/`) to the backend container.

---

## 🚂 Method 3: Railway (All-in-One Cloud PaaS)

Railway allows deploying both frontend and backend with zero cold starts:

1. Sign in at [railway.app](https://railway.app) with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. **Deploy Backend**:
   - Add service from repo, set Root Directory to `/backend`.
   - Add persistent disk volume mounted at `/app/prisma` and `/app/storage` (so data is never wiped on redeploys).
   - Add environment variables (same as Render above).
   - Railway generates a public domain (e.g., `https://smart-campus-backend.up.railway.app`).
4. **Deploy Frontend**:
   - Add another service from same repo, set Root Directory to `/frontend`.
   - Set environment variable `VITE_API_URL=https://smart-campus-backend.up.railway.app/api/v1`.
   - Generate domain.

---

## ✅ Post-Deployment Verification Checklist

Once deployed, verify these 5 core flows:
1. **Health Check**: Open `https://your-backend.com/health` (should return `{ "status": "healthy" }`).
2. **Demo Login**: Go to your frontend URL and test 1-click Faculty and Student login.
3. **Smart Student Login**: Test logging in with PRN or student name.
4. **File Uploads**: Go to Academic Resources or Marketplace and upload a file/image to confirm storage permissions.
5. **Real-time Chat**: Open two browser windows (one faculty, one student) and verify live messaging via WebSockets.
