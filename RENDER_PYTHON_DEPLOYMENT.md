# Deploy Python Flask Server to Render - Step by Step

## Prerequisites:
- ✅ You already have `server.js` deployed on Render
- ✅ Your code is on GitHub (muthu-anushya/MindCare)

---

## Step 1: Create New Web Service on Render

1. Go to https://render.com
2. Log in to your account
3. Click **"New +"** button (top right)
4. Select **"Web Service"**

---

## Step 2: Connect GitHub Repository

1. Click **"Connect account"** (if not connected)
2. Authorize Render to access your GitHub
3. Find and select your repository: **`muthu-anushya/MindCare`**
4. Click **"Connect"**

---

## Step 3: Configure Python Flask Service

### Basic Settings:

**Name:**
```
mindcare-audio-analyzer
```
(or any name you like)

**Region:**
```
Singapore (or closest to you)
```

**Branch:**
```
main
```

**Root Directory:**
```
api
```
⚠️ **IMPORTANT**: Set this to `api` because your Python code is in the `api/` folder

**Runtime:**
```
Python 3
```

---

### Build & Start Commands:

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
python audio_analyzer.py
```

OR (if above doesn't work):
```bash
gunicorn audio_analyzer:app --bind 0.0.0.0:$PORT
```

**Note**: Render automatically sets `$PORT` environment variable - your code now uses it!

---

## Step 4: Environment Variables (Optional)

You usually don't need environment variables for the Python Flask server, but if you want to add any:

Click **"Advanced"** → **"Add Environment Variable"**

(Usually not needed for audio analyzer)

---

## Step 5: Plan & Deploy

**Plan:**
```
Free (if available) or Starter ($7/month)
```

**Click "Create Web Service"**

---

## Step 6: Wait for Deployment

Render will:
1. Clone your repository
2. Install Python dependencies from `requirements.txt`
3. Start your Flask server
4. Give you a URL like: `https://mindcare-audio-analyzer.onrender.com`

**This usually takes 2-5 minutes**

---

## Step 7: Update React Native App

After deployment, update `src/utils/api.js`:

### For Production (Real Device):
```javascript
export const AUDIO_ANALYZER_URL = 'https://mindcare-audio-analyzer.onrender.com';
```

### For Android Emulator (Local Testing):
```javascript
export const AUDIO_ANALYZER_URL = 'http://10.0.2.2:5001'; // Local
```

OR use production URL:
```javascript
export const AUDIO_ANALYZER_URL = 'https://mindcare-audio-analyzer.onrender.com';
```

---

## Step 8: Test the Deployment

1. Get your Render URL (e.g., `https://mindcare-audio-analyzer.onrender.com`)
2. Open in browser: `https://mindcare-audio-analyzer.onrender.com/`
3. Should see: `"Audio Analyzer is running!"`

---

## Troubleshooting:

### Error: "Module not found"
- Check `requirements.txt` has all dependencies
- Check Render logs for missing packages

### Error: "Port already in use"
- Make sure you're using `$PORT` environment variable (I've updated your code!)

### Error: "Models not found"
- Make sure `api/models/` folder is in repository
- Models should be committed to Git (if small) or use external storage

### Service keeps restarting
- Check Render logs
- Make sure start command is correct
- Check if Python version is compatible

---

## Render Dashboard:

After deployment, you can:
- View logs: Click on your service → "Logs" tab
- View metrics: "Metrics" tab
- Restart service: "Manual Deploy" → "Clear build cache & deploy"

---

## Free Tier Limitations:

- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ **First request after spin-down takes 30-60 seconds**
- ⚠️ **Perfect for testing, but consider paid plan for production**

---

## Alternative: Use Railway (No Spin-down on Free Tier)

If Render's spin-down is a problem, use **Railway.app** instead:
- Free tier doesn't spin down
- Easy deployment from GitHub
- Same setup steps

---

## Summary:

✅ **Deploy Python Flask server as separate Web Service on Render**
✅ **Root Directory: `api`**
✅ **Build Command: `pip install -r requirements.txt`**
✅ **Start Command: `python audio_analyzer.py`**
✅ **Update React Native app with Render URL**

---

**Your Python Flask server will be deployed and ready to analyze audio!** 🚀

