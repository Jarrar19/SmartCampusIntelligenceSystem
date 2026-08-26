# 🚀 Live Deployment Guide — Smart Campus Intelligence System

This guide outlines step-by-step instructions to deploy the **Smart Campus Intelligence System** live to production for free or at low cost.

---

## Architecture Overview

- **Frontend**: React + TypeScript + Vite + Tailwind CSS (Deploy on **Vercel** or **Netlify**)
- **Backend**: Node.js + Express + Socket.IO (Deploy on **Render** or **Railway**)
- **Database**: SQLite (built-in) or PostgreSQL / Railway DB
- **File Storage**: Local server disk storage (`/storage`) or persistent disk volume

---

## 🛠️ Method 1: Render (Backend) + Vercel (Frontend) — Recommended Free Option

### Part A: Deploy Backend on Render

1. **Push your code to GitHub**:
   - Create a repository on GitHub and push the project.

2. **Create a New Web Service on Render**:
   - Go to [render.com](https://render.com) and log in.
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository.

3. **Configure Service Settings**:
   - **Name**: `smart-campus-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build && npx prisma db push && npm run prisma:seed`
   - **Start Command**: `npm start`

4. **Environment Variables on Render**:
   Add the following under **Environment Variables**:
   ```env
   PORT=5000
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="generate-a-random-secure-64-char-string-here"
   JWT_EXPIRES_IN="24h"
   JWT_REFRESH_EXPIRES_IN="7d"
   COLLEGE_NAME="St. Bernard Institute of Technology"
   COLLEGE_SHORT_NAME="SBIT"
   COLLEGE_EMAIL_DOMAIN="sbjit.edu.in"
   DEV_MODE="false"
   AUTO_VERIFY_EMAILS_IN_DEV="true"
   CLIENT_URL="https://your-frontend-domain.vercel.app"
   ```

5. **Deploy & Copy API URL**:
   - Once deployed, copy your live backend URL (e.g. `https://smart-campus-api.onrender.com`).

---

### Part B: Deploy Frontend on Vercel

1. **Import Project on Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **Add New...** -> **Project**.
   - Select your GitHub repository.

2. **Configure Vercel Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Add Environment Variable**:
   ```env
   VITE_API_URL=https://smart-campus-api.onrender.com/api/v1
   ```
   *(Replace with your actual backend Render URL)*

4. **Click Deploy**:
   - Vercel will build and publish your live application.

---

## 🛠️ Method 2: Single VPS Deployment (DigitalOcean / AWS EC2 / Ubuntu)

If you prefer running frontend & backend together on a Single Ubuntu VPS:

1. **SSH into your server**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js 20 & Nginx**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
   sudo npm install -g pm2
   ```

3. **Clone Repo & Build**:
   ```bash
   git clone https://github.com/your-username/smart-campus.git
   cd smart-campus
   
   # Setup Backend
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run prisma:seed
   npm run build
   pm2 start dist/server.js --name "smart-campus-backend"
   
   # Setup Frontend
   cd ../frontend
   npm install
   VITE_API_URL="https://yourdomain.com/api/v1" npm run build
   ```

4. **Configure Nginx Reverse Proxy & SSL**:
   Create `/etc/nginx/sites-available/smart-campus`:
   ```nginx
   server {
       server_name yourdomain.com;

       location / {
           root /var/www/smart-campus/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /socket.io/ {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
           proxy_set_header Host $host;
       }
   }
   ```
   Enable site & obtain SSL certificate:
   ```bash
   sudo ln -s /etc/nginx/sites-available/smart-campus /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## ⚡ Verification Checklist After Deployment

- [ ] Check `/health` endpoint on backend (`https://your-backend-api.com/health`)
- [ ] Test 1-click Faculty/Student demo logins
- [ ] Test real-time Socket.IO chat connection
- [ ] Test file resource upload & download
- [ ] Test course creation and marketplace product creation
