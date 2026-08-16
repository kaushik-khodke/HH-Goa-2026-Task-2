# 🚀 Voice-Enabled Multilingual RAG — Complete Deployment Guide

This guide covers all recommended methods for deploying the **Voice-Enabled Multilingual RAG** system to production, ranging from free cloud hosting to containerized VPS deployments.

---

## 🏗️ Architecture Overview

The system consists of two primary services:
1. **Backend Service (`FastAPI` + Python 3.11)**
   - Port: `8000`
   - Handles BM25 + BGE-M3 Dense Hybrid Retrieval, RRF Rank Fusion, Cross-Encoder Reranking, Gemini LLM generation, and Grounding guardrails.
2. **Frontend Service (`Next.js 14` + React + TailwindCSS)**
   - Port: `3000`
   - Interactive multilingual voice UI, browser Web Speech API STT, real-time stage latency breakdowns, source passage inspection, and analytics.

---

## 🔑 Environment Variables

Before deploying, ensure you have configured your environment variables.

### Backend `.env`

Create a `.env` file in the root directory (or configure these in your cloud provider's dashboard):

```env
# Primary LLM API Key (Required for Grounded Generation)
GEMINI_API_KEY=your_gemini_api_key_here

# Speech STT API Key (Optional fallback)
SARVAM_API_KEY=your_sarvam_api_key_here

# Alternative Generation LLMs (Optional)
GROQ_API_KEY=your_groq_api_key_here
XAI_API_KEY=your_xai_api_key_here
HF_TOKEN=your_huggingface_token_here

# System Settings
TARGET_LATENCY_MS=200.0
PRIMARY_GENERATION_MODEL=gemini-3.5-flash-lite
FALLBACK_GENERATION_MODELS=gemini-3.5-flash,gemini-2.5-flash
```

### Frontend `.env.local`

```env
# Point to your deployed FastAPI backend URL (without trailing slash)
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
```

---

## 🌐 Method 1: Cloud 1-Click Deployment (Recommended)

This is the fastest, lowest-maintenance approach using free tiers.

### Step A: Deploy Backend on Render or Railway

#### Option A1: Render (Free Tier)
1. Push this repository to **GitHub**.
2. Log into [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure settings:
   - **Name**: `voicerag-backend`
   - **Environment**: `Python 3` or `Docker`
   - **If using Python**:
     - **Build Command**: `pip install --upgrade pip && pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt`
     - **Start Command**: `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT`
   - **If using Docker**:
     - **Dockerfile Path**: `Dockerfile.backend`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your actual Gemini API key
   - `PORT` = `8000`
6. Click **Create Web Service**.
7. Note down your backend URL (e.g. `https://voicerag-backend.onrender.com`).

#### Option A2: Railway
1. Log into [Railway.app](https://railway.app) and create a **New Project** -> **Deploy from GitHub repo**.
2. Set **Root Directory** to `/`.
3. Set **Start Command** to:
   ```bash
   uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT
   ```
4. Add your `GEMINI_API_KEY` in the **Variables** tab.
5. Generate a public domain under **Settings** -> **Networking**.

---

### Step B: Deploy Frontend on Vercel

1. Log into [Vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. In the project configuration:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-api-url.onrender.com` (your deployed backend URL from Step A)
5. Click **Deploy**.
6. Your live web application will be accessible at `https://your-app-name.vercel.app`.

---

## 🐳 Method 2: Docker Compose (VPS / Single Host)

Ideal for deploying both Frontend and Backend together on an Ubuntu/Debian VPS (AWS EC2, DigitalOcean, Hetzner, Linode).

### Prerequisites
- Install Docker & Docker Compose:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo apt install docker-compose-plugin -y
  ```

### Step 1: Clone Repository & Configure Environment
```bash
git clone https://github.com/your-username/voice-rag.git
cd voice-rag

# Copy environment template and fill in keys
cp .env.example .env
nano .env
```

### Step 2: Build and Run Containers
```bash
# Build images and start services in background
docker compose up -d --build
```

### Step 3: Verify Services
```bash
# Check running containers
docker compose ps

# View backend logs
docker compose logs -f backend

# View frontend logs
docker compose logs -f frontend
```

The application is now live:
- **Frontend**: `http://<SERVER_IP>:3000`
- **Backend API Docs**: `http://<SERVER_IP>:8000/docs`
- **Health Check**: `http://<SERVER_IP>:8000/health`

---

## 🤗 Method 3: Hugging Face Spaces (All-in-One AI Demo)

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Space SDK**: `Docker`.
3. Choose `Blank` Docker template.
4. Clone the space repository locally or push your files:
   - Use `Dockerfile.backend` as `Dockerfile` in the root of the Space.
5. In **Space Settings** -> **Variables and secrets**, add `GEMINI_API_KEY`.
6. Hugging Face will automatically build and host the interactive API.

---

## 🐧 Method 4: Production Linux VM (Systemd + PM2 + Nginx)

For bare-metal or self-managed VMs without Docker:

### 1. Backend Service (`systemd`)

Create a systemd service file:
```bash
sudo nano /etc/systemd/system/voicerag-backend.service
```

Paste the following:
```ini
[Unit]
Description=Voice-Enabled Multilingual RAG FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/voice-rag
Environment="PATH=/home/ubuntu/voice-rag/venv/bin"
EnvironmentFile=/home/ubuntu/voice-rag/.env
ExecStart=/home/ubuntu/voice-rag/venv/bin/uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
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

# Install PM2 globally and start Next.js
sudo npm install -g pm2
pm2 start npm --name "voicerag-frontend" -- start -- -p 3000
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy Configuration

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

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/voicerag /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Critical Production Notes

1. **HTTPS is Mandatory for Microphone Recording:**
   - Modern browsers (Chrome, Edge, Safari, Firefox) **only allow microphone access (`navigator.mediaDevices` and Web Speech API)** over `https://` or `localhost`.
   - If deploying to a custom domain, obtain a free SSL certificate with Let's Encrypt:
     ```bash
     sudo certbot --nginx -d yourdomain.com
     ```
   - Cloud providers like Vercel and Render automatically provide free HTTPS.

2. **PyTorch CPU Build Optimization:**
   - Always install the CPU-only build (`https://download.pytorch.org/whl/cpu`) on CPU cloud instances to prevent downloading 3+ GB of CUDA dependencies and avoid build timeouts.

3. **CORS Settings:**
   - The FastAPI backend includes `CORSMiddleware` with `allow_origins=["*"]`, allowing requests from your Vercel or custom domain automatically.

---

## 🧪 Post-Deployment Verification

Test the deployed backend API:

```bash
# 1. Health check
curl -X GET https://your-backend-url/health

# 2. Text query test
curl -X POST https://your-backend-url/api/v1/query/text \
  -H "Content-Type: application/json" \
  -d '{"text_query": "What is the capital of India?", "language_code": "en"}'
```

Expected output:
```json
{
  "status": "healthy",
  "dataset": "ai4bharat/MSMARCO-XI",
  "corpus_passages_chunked": 15,
  "chunking_strategy": "ParagraphBoundaryChunker",
  "target_latency_ms": 200.0
}
```
