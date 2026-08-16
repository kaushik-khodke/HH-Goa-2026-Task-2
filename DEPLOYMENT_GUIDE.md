# 🚀 Complete Deployment Guide — Voice-Enabled Multilingual RAG

A complete, production-ready guide to deploying the **Voice-Enabled Multilingual RAG** system to the cloud.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Environment Variables Reference](#-environment-variables-reference)
3. [Method 1: Cloud 1-Click (Vercel + Render / Railway) — RECOMMENDED](#-method-1-cloud-1-click-deployment-recommended)
   - [Step A: Deploy Backend (Render or Railway)](#step-a-deploy-backend-on-render-or-railway)
   - [Step B: Deploy Frontend (Vercel)](#step-b-deploy-frontend-on-vercel)
4. [Method 2: Docker Compose (VPS / Single Server)](#-method-2-docker-compose-vps--single-server)
5. [Method 3: Linux VM with PM2, Systemd & Nginx](#-method-3-linux-vm-systemd--pm2--nginx)
6. [Method 4: Hugging Face Spaces](#-method-4-hugging-face-spaces)
7. [🔒 Security, HTTPS & Audio Permissions](#-security-https--microphone-permissions)
8. [🧪 Post-Deployment Verification & Testing](#-post-deployment-verification)
9. [🛠️ Troubleshooting & FAQ](#️-troubleshooting--faq)

---

## 🏗️ Architecture Overview

The system consists of two decoupled services:

```
┌───────────────────────────────────────────────────────────┐
│                      Client Browser                       │
│      • Multilingual Voice STT (Web Speech API / Mic)      │
│      • Dynamic Waveform & Latency Stage Analytics         │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTPS
                              ▼
┌───────────────────────────────────────────────────────────┐
│              Frontend Service (Next.js 14)                │
│       • Deployed on Vercel (https://your-app.vercel.app)  │
│       • React 18 + TailwindCSS + Lucide Icons             │
└─────────────────────────────┬─────────────────────────────┘
                              │ REST API Calls
                              ▼
┌───────────────────────────────────────────────────────────┐
│               Backend Service (FastAPI)                   │
│   • Deployed on Render / Railway / Docker                 │
│   • BM25 Sparse Index + BGE-M3 Dense Semantic Vectors     │
│   • Reciprocal Rank Fusion (RRF) & Cross-Encoder Rerank   │
│   • Grounded LLM Generation (Gemini) + Factual Guardrail  │
└───────────────────────────────────────────────────────────┘
```

---

## 🔑 Environment Variables Reference

### Backend Variables (`.env` or Cloud Dashboard)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Primary LLM for grounded answer generation | `AIzaSy...` |
| `SARVAM_API_KEY` | Optional | Sarvam AI key for Indic STT fallback | `sk_...` |
| `GROQ_API_KEY` | Optional | Groq API key for LLaMA/Qwen fallback | `gsk_...` |
| `XAI_API_KEY` | Optional | xAI key for Grok fallback | `xai-...` |
| `TARGET_LATENCY_MS` | Optional | Target latency budget in ms (Default: `200.0`) | `200.0` |
| `PRIMARY_GENERATION_MODEL` | Optional | Default generation model (Default: `gemini-3.5-flash-lite`) | `gemini-3.5-flash-lite` |
| `FALLBACK_GENERATION_MODELS`| Optional | Fallback model list | `gemini-2.5-flash,gemini-1.5-flash` |
| `PORT` | Auto | Listening port (assigned automatically by cloud PaaS) | `8000` |

### Frontend Variables (`.env.local` or Vercel Dashboard)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | Public HTTPS URL of the deployed FastAPI backend (no trailing slash) | `https://voicerag-backend.onrender.com` |

---

## 🌐 Method 1: Cloud 1-Click Deployment (Recommended)

This approach is free, highly scalable, and requires zero server maintenance.

### Step A: Deploy Backend on Render or Railway

#### Option A1: Deploy to Render using Blueprint (Easiest)
1. Push this repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Blueprint**.
3. Connect your GitHub repository. Render will automatically detect [`render.yaml`](file:///c:/Users/ASUS/jupyter%20notebook/priyal/render.yaml).
4. Enter your `GEMINI_API_KEY` when prompted.
5. Click **Apply**.

#### Option A2: Deploy to Render Manually (Web Service)
1. In [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following:
   - **Name**: `voicerag-backend`
   - **Region**: `Oregon (US West)` or nearest region
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Health Check Path**: `/health`
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your actual Gemini API key
   - `TARGET_LATENCY_MS` = `200.0`
5. Click **Create Web Service**.
6. Once deployed, note down your backend URL (e.g. `https://voicerag-backend.onrender.com`).

#### Option A3: Deploy to Railway
1. Log into [Railway.app](https://railway.app) and select **New Project** -> **Deploy from GitHub repo**.
2. In **Settings**:
   - **Build Command**: `pip install --upgrade pip && pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT`
3. Under **Variables**, add `GEMINI_API_KEY`.
4. Under **Networking**, click **Generate Domain**.

---

### Step B: Deploy Frontend on Vercel

1. Log into [Vercel.com](https://vercel.com/new) and import your GitHub repository.
2. Configure project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
3. Under **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://voicerag-backend.onrender.com` *(Replace with your actual backend URL from Step A, without trailing slash)*
4. Click **Deploy**.
5. Once complete, your site will be live at `https://your-project.vercel.app`.

---

## 🐳 Method 2: Docker Compose (VPS / Single Server)

Deploy both services together on any Linux VPS (AWS EC2, DigitalOcean Droplet, Linode, Hetzner).

### Prerequisites
```bash
# Install Docker & Docker Compose Plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install -y docker-compose-plugin
```

### Steps:
1. **Clone repository and setup environment**:
   ```bash
   git clone https://github.com/your-username/voice-rag.git
   cd voice-rag
   cp .env.example .env
   # Add your GEMINI_API_KEY to .env
   nano .env
   ```

2. **Build and start containers**:
   ```bash
   docker compose up -d --build
   ```

3. **Check status and logs**:
   ```bash
   # Check container status
   docker compose ps

   # Stream backend logs
   docker compose logs -f backend

   # Stream frontend logs
   docker compose logs -f frontend
   ```

4. Access your services:
   - **Frontend UI**: `http://<YOUR_SERVER_IP>:3000`
   - **Backend API Docs**: `http://<YOUR_SERVER_IP>:8000/docs`
   - **Health Check**: `http://<YOUR_SERVER_IP>:8000/health`

---

## 🐧 Method 3: Linux VM (Systemd + PM2 + Nginx)

For production deployments on Ubuntu 22.04 / 24.04 LTS without Docker.

### 1. Backend Service (`systemd`)

Create service file:
```bash
sudo nano /etc/systemd/system/voicerag-backend.service
```

```ini
[Unit]
Description=Voice-Enabled Multilingual RAG FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/voice-rag
EnvironmentFile=/home/ubuntu/voice-rag/.env
ExecStart=/home/ubuntu/voice-rag/venv/bin/uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable voicerag-backend
sudo systemctl start voicerag-backend
```

### 2. Frontend Service (`PM2`)
```bash
cd /home/ubuntu/voice-rag/frontend
npm install
npm run build

sudo npm install -g pm2
pm2 start npm --name "voicerag-frontend" -- start -- -p 3000
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy & SSL (HTTPS)
Create `/etc/nginx/sites-available/voicerag`:
```nginx
server {
    server_name yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (FastAPI)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }
}
```

Enable site and install free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/voicerag /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🤗 Method 4: Hugging Face Spaces

1. Create a new Space at [Hugging Face Spaces](https://huggingface.co/spaces).
2. Choose **Space SDK: Docker** -> **Blank Template**.
3. Push the repository files to the space.
4. Set **Variables and Secrets**:
   - `GEMINI_API_KEY` = your API key
5. Hugging Face will build the Docker container and provide a live public URL.

---

## 🔒 Security, HTTPS & Microphone Permissions

> [!IMPORTANT]
> **HTTPS is strictly required for audio recording in production.**
> Modern web browsers (Google Chrome, Apple Safari, Microsoft Edge, Mozilla Firefox) enforce a strict security policy: **microphone access (`navigator.mediaDevices.getUserMedia` and Web Speech API) is blocked on non-HTTPS origins**, except on `localhost`.
> 
> - Deploying via **Vercel** and **Render** automatically provides free, auto-renewing SSL certificates (`https://`).
> - If deploying to a custom domain on a VPS, always run `certbot --nginx` to enable HTTPS.

---

## 🧪 Post-Deployment Verification

### 1. Test Backend Health
```bash
curl -X GET https://your-backend-url.onrender.com/health
```
Expected response:
```json
{
  "status": "healthy",
  "dataset": "ai4bharat/MSMARCO-XI",
  "corpus_passages_chunked": 15,
  "chunking_strategy": "ParagraphBoundaryChunker",
  "target_latency_ms": 200.0
}
```

### 2. Test Multilingual Query Endpoint
```bash
curl -X POST https://your-backend-url.onrender.com/api/v1/query/text \
  -H "Content-Type: application/json" \
  -d '{"text_query": "मैनहट्टन परियोजना की सफलता का प्रभाव क्या था?", "language_code": "hi"}'
```

### 3. Test Frontend Live in Browser
1. Open `https://your-project.vercel.app` in Chrome or Edge.
2. Check that the top status bar shows **Backend Online**.
3. Click the **Microphone** icon, allow microphone permissions, and speak a question in Hindi or English.
4. Verify that:
   - Audio waveform animates during speech.
   - Grounded answer appears with citation cards and relevance scores.
   - Latency gauge displays sub-200ms execution breakdown.

---

## 🛠️ Troubleshooting & FAQ

### Q: Why does the Frontend show "Backend Offline"?
- Ensure `NEXT_PUBLIC_API_URL` is set in Vercel under **Settings** -> **Environment Variables**.
- Verify that the backend URL does NOT contain a trailing slash (e.g. use `https://voicerag-backend.onrender.com`, not `https://voicerag-backend.onrender.com/`).
- If using Render Free Tier, the backend service spins down after 15 minutes of inactivity. The first request may take 30–45 seconds to spin up.

### Q: Why does PyTorch installation take a long time during build?
- Always ensure the build command includes:
  `pip install torch --index-url https://download.pytorch.org/whl/cpu`
  This installs the lightweight CPU build (~180 MB) instead of downloading ~3.5 GB of CUDA drivers.

### Q: Why does the microphone button not activate recording on mobile?
- Verify that you are accessing the frontend over `https://` (not `http://`).
- Check browser site permissions and ensure microphone access is set to **Allow**.
