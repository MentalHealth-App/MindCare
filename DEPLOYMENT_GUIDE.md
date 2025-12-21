# Deployment Guide for MindCare App

## What Needs to Be Deployed:

You have **3 things** that need deployment:

### 1. **Node.js Backend Server** (`server.js`) ✅
- **Port**: 8000
- **Purpose**: 
  - User authentication (signup, login, reset password)
  - Mental health test results storage
  - Voice analysis results storage
  - MongoDB connection
- **Technology**: Express.js, MongoDB (Mongoose)

### 2. **Python Flask Audio Analyzer** (`api/audio_analyzer.py`) ✅
- **Port**: 5001
- **Purpose**:
  - Audio file upload and analysis
  - ML emotion detection
  - Returns emotion, pitch, speed, mood
- **Technology**: Flask, librosa, scikit-learn, pydub

### 3. **MongoDB Database** ✅
- **Purpose**: Stores user data, test results, voice analysis
- **Options**:
  - **MongoDB Atlas** (Cloud - Recommended) ✅
  - Or self-hosted MongoDB server

---

## Deployment Architecture:

```
React Native App (Mobile Device)
        ↓
    ┌───┴───┐
    ↓       ↓
Node.js    Python Flask
Server     Server
:8000      :5001
    ↓       ↓
    └───┬───┘
        ↓
    MongoDB
```

---

## Deployment Options:

### Option 1: Separate Services (Recommended)

#### A. Node.js Server (`server.js`)
**Platform Options:**
- **Vercel** (Serverless Functions) ✅ Easy
- **Railway** ✅ Easy, supports Node.js
- **Render** ✅ Free tier available
- **Heroku** (Paid now)
- **AWS EC2 / Lightsail**
- **DigitalOcean App Platform**

#### B. Python Flask Server (`api/audio_analyzer.py`)
**Platform Options:**
- **Railway** ✅ Supports Python
- **Render** ✅ Free tier available
- **Heroku** (Paid now)
- **AWS EC2 / Elastic Beanstalk**
- **Google Cloud Run**
- **Azure App Service**
- **DigitalOcean App Platform**

#### C. MongoDB Database
**Recommended: MongoDB Atlas** ✅
- Free tier available (512MB)
- Managed service (no server management)
- Automatic backups
- Global clusters

---

### Option 2: All-in-One Server

Deploy both Node.js and Python on **same server** (VPS):
- **AWS EC2**
- **DigitalOcean Droplet**
- **Linode**
- **Vultr**

**Setup:**
- Use **PM2** to run Node.js server
- Use **Gunicorn** or **uWSGI** to run Python Flask
- Use **Nginx** as reverse proxy
- Both services on same machine, different ports

---

## Step-by-Step Deployment:

### Step 1: Deploy MongoDB (MongoDB Atlas) ✅

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster (Free tier: M0)
4. Create database user
5. Whitelist IP addresses (0.0.0.0/0 for all, or your server IPs)
6. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

**Update `.env` file:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindcare
```

---

### Step 2: Deploy Node.js Server (server.js)

#### Using Railway (Easiest):

1. Go to https://railway.app
2. Sign up with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Select your `MindCare` repository
5. Railway will detect Node.js automatically
6. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secret_key
   OPENROUTER_KEY=your_key (if used)
   PORT=8000
   ```
7. Deploy!

**Railway will give you URL like:** `https://your-app.railway.app`

#### Using Render:

1. Go to https://render.com
2. Sign up
3. **New** → **Web Service**
4. Connect GitHub repo
5. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
6. Add environment variables
7. Deploy!

---

### Step 3: Deploy Python Flask Server (api/audio_analyzer.py)

#### Using Railway:

1. In Railway dashboard, **New Service**
2. **Deploy from GitHub repo** (same repo)
3. **Root Directory**: `/api`
4. Railway will detect Python
5. Add environment variables (if any)
6. Deploy!

**Note**: Railway will auto-detect Python and install from `requirements.txt`

#### Using Render:

1. **New** → **Web Service**
2. Connect GitHub repo
3. Settings:
   - **Root Directory**: `api`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn audio_analyzer:app -b 0.0.0.0:5001`
   - **Environment**: Python 3
4. Deploy!

---

### Step 4: Update React Native App

Update `src/utils/api.js` with your deployed URLs:

```javascript
// Production URLs
export const BASE_URL = 'https://your-nodejs-server.railway.app';
export const AUDIO_ANALYZER_URL = 'https://your-python-server.railway.app';
```

**For Android Emulator:**
- Node.js: Keep `http://10.0.2.2:8000` (localhost) OR use production URL
- Python: Keep `http://10.0.2.2:5001` (localhost) OR use production URL

---

## Environment Variables Needed:

### Node.js Server (.env):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindcare
JWT_SECRET=your_jwt_secret_key_here
OPENROUTER_KEY=your_openrouter_key (optional)
PORT=8000
```

### Python Flask Server:
Usually no env vars needed, but can add:
```env
FLASK_ENV=production
PORT=5001
```

---

## Important Files for Deployment:

### Node.js Server:
- ✅ `server.js` - Main server file
- ✅ `package.json` - Dependencies
- ✅ `.env` - Environment variables (don't commit!)

### Python Flask Server:
- ✅ `api/audio_analyzer.py` - Main Flask app
- ✅ `api/models/` - ML model files (emotion_model.pkl, scaler.pkl, labels.json)
- ✅ `requirements.txt` - Python dependencies (create if missing)

---

## Create requirements.txt for Python:

Create `api/requirements.txt`:
```
flask==3.0.0
numpy==1.26.0
librosa==0.10.1
scikit-learn==1.3.2
scipy==1.11.4
pydub==0.25.1
```

---

## Summary:

### ✅ What to Deploy:
1. **Node.js Server** (`server.js`) → Railway/Render
2. **Python Flask Server** (`api/audio_analyzer.py`) → Railway/Render
3. **MongoDB** → MongoDB Atlas (Cloud)

### ❌ What NOT to Deploy:
- React Native app code (runs on user's device)
- `node_modules/` (installed on server)
- `android/` build files
- `ios/` build files
- `.env` files (use platform environment variables)

---

## Quick Deployment Checklist:

- [ ] Create MongoDB Atlas account and cluster
- [ ] Get MongoDB connection string
- [ ] Deploy Node.js server (Railway/Render)
- [ ] Deploy Python Flask server (Railway/Render)
- [ ] Update React Native app with production URLs
- [ ] Test authentication endpoints
- [ ] Test audio analysis endpoint
- [ ] Test on real device

---

**Recommendation: Use Railway for both servers - it's the easiest!**

