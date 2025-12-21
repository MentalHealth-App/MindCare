# Fix Render Deployment Error

## Problem:
Render can't find `requirements.txt` file.

## Solution:

The issue is that when you set **Root Directory** to `api`, Render changes into that directory, but the build command might not be finding the file correctly.

### Option 1: Use Full Path in Build Command (Recommended)

In Render dashboard, update your **Build Command** to:

```bash
cd api && pip install -r requirements.txt
```

This explicitly changes to the `api` directory first, then runs pip install.

---

### Option 2: Check Root Directory Setting

Make sure in Render:
- **Root Directory**: `api` (without trailing slash)
- **Build Command**: `pip install -r requirements.txt`

If Root Directory is set correctly, the build should work.

---

### Option 3: Verify requirements.txt is Committed

Make sure `api/requirements.txt` is committed to GitHub:

```bash
git add api/requirements.txt
git commit -m "Add requirements.txt for Python deployment"
git push
```

Then trigger a new deployment on Render.

---

## Correct Render Settings:

**Name:** `mindcare-audio-analyzer`

**Root Directory:** `api`

**Runtime:** `Python 3`

**Build Command:**
```bash
cd api && pip install -r requirements.txt
```

**Start Command:**
```bash
python audio_analyzer.py
```

**OR (if above doesn't work):**
```bash
gunicorn audio_analyzer:app --bind 0.0.0.0:$PORT
```

---

## After Fixing:

1. Update the Build Command in Render dashboard
2. Click "Save Changes"
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Wait for deployment

---

**The key is making sure the build command runs from the `api/` directory!**

