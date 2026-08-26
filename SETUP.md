# 🛠️ Installation & Setup Guide

This guide walks through starting the **Smart Campus Intelligence System** locally from scratch.

---

## 1. System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Runtime**: Node.js v18+ or v20+ (LTS recommended)
- **Package Manager**: npm v9+

---

## 2. Step-by-Step Installation

### Step 1: Install Backend Dependencies & Database
```bash
cd backend
npm install
```

### Step 2: Push Prisma Database Schema & Seed Data
```bash
# Push relational schema to local SQLite database (backend/dev.db)
npx prisma db push

# Populate initial demo courses, faculty, students, resources, and marketplace items
npm run seed
```

### Step 3: Start the Backend Server
```bash
npm run dev
```
*The server will start on `http://localhost:5000`.*

---

### Step 4: Install Frontend Dependencies
Open a new terminal window:
```bash
cd frontend
npm install
```

### Step 5: Start the Frontend Application
```bash
npm run dev
```
*The web application will open on `http://localhost:5173`.*

---

## 3. Verifying the Setup

1. Open your browser and navigate to `http://localhost:5173`.
2. Click the **Prof. Sarah Jenkins (Faculty)** 1-Click Demo button to sign in as Faculty.
3. In another tab (or Incognito window), sign in with the **Alex Rivera (Student)** 1-Click Demo button.
4. Try uploading a study guide as Student $\rightarrow$ switch to Faculty tab $\rightarrow$ navigate to **Resource Moderation** $\rightarrow$ click **Approve**.
5. Switch back to Student tab $\rightarrow$ navigate to **Resource Hub & PYQs** $\rightarrow$ verify your approved document is now globally visible with download capability.
