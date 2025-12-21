# What You Need to Deploy - Quick Summary

## You Have 3 Things to Deploy:

### 1. ✅ Node.js Server (`server.js`)
- **Port**: 8000
- **Does**: Authentication, database operations, API endpoints
- **Where**: Railway, Render, Vercel, Heroku

### 2. ✅ Python Flask Server (`api/audio_analyzer.py`) ⚠️ **You need this too!**
- **Port**: 5001
- **Does**: Audio analysis, emotion detection with ML
- **Where**: Railway, Render, Heroku, AWS

### 3. ✅ MongoDB Database
- **Does**: Stores user data, test results
- **Where**: MongoDB Atlas (Cloud - Recommended) ✅

---

## Why Both Servers?

Your React Native app calls **TWO different backends**:

1. **Node.js Server** (`server.js`) → Port 8000
   - `/signup`, `/login`, `/reset-password`
   - `/mentalhealthresults` (save/fetch test results)
   - `/voiceanalysis` (save voice analysis results)

2. **Python Flask Server** (`api/audio_analyzer.py`) → Port 5001
   - `/analyze` (analyzes audio file, returns emotion)

---

## Quick Answer:

### ❌ Wrong:
> "Just deploy server.js and MongoDB"

### ✅ Correct:
> "Deploy **server.js** (Node.js) + **audio_analyzer.py** (Python) + **MongoDB**"

---

## Deployment Options:

### Easiest Way (Recommended):

1. **MongoDB**: MongoDB Atlas (Free tier)
2. **Node.js Server**: Railway.app (Free tier)
3. **Python Flask Server**: Railway.app (Free tier)

Both servers can be deployed from same GitHub repo on Railway!

---

See `DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.

