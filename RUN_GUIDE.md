# 🚀 Quick Run & Deployment Guide

## 💻 1. Local Development

### Terminal 1: Backend
```bash
pip install -r requirements.txt
python backend/api/main.py
```
> API will run on `http://localhost:8000` (Docs at `http://localhost:8000/docs`, Health at `http://localhost:8000/health`)

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
> App will run on `http://localhost:3000`

---

## 🌐 2. Cloud Deployment (Option A: Render + Vercel)

### Step 1: Deploy Backend to Render (or Railway)
1. Push repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service** (or use Blueprint with `render.yaml`).
3. Set **Build Command**:
   ```bash
   pip install --upgrade pip && pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt
   ```
4. Set **Start Command**:
   ```bash
   uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add Environment Variable:
   - `GEMINI_API_KEY`: Your Gemini API Key
6. Copy the assigned URL (e.g., `https://voicerag-backend.onrender.com`).

### Step 2: Deploy Frontend to Vercel
1. In [Vercel Dashboard](https://vercel.com), click **Add New** -> **Project** and select this repository.
2. Set **Root Directory**: `frontend`
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://voicerag-backend.onrender.com` (Your deployed Render backend URL)
4. Click **Deploy**.

---

## 🐳 3. Docker Compose (VPS / Local)
```bash
docker compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
