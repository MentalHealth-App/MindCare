# Fix: "No module named 'pkg_resources'" Error

## Problem:
The app shows error: **"Could not analyze audio: No module named 'pkg_resources'"**

This happens because `pkg_resources` is part of `setuptools`, which wasn't explicitly included in `requirements.txt`.

## Solution Applied:

Added `setuptools>=65.5.0` to `api/requirements.txt`

## Next Steps:

1. **Go to Render Dashboard**
   - Navigate to your Python service: `mindcare-audio-analyzer`

2. **Trigger New Deployment**
   - Click "Manual Deploy" → "Clear build cache & deploy"
   - OR wait for auto-deploy (if enabled)

3. **Wait for Deployment**
   - Build will install the new dependency
   - Service will restart automatically

4. **Test Again**
   - Open your app
   - Record audio
   - Analysis should work now!

---

## Updated requirements.txt:

```txt
flask==3.0.0
numpy==1.26.0
librosa==0.10.1
scikit-learn==1.3.2
scipy==1.11.4
pydub==0.25.1
werkzeug==3.0.1
setuptools>=65.5.0  # ← Added this
```

---

**Changes have been pushed to GitHub. Render will automatically redeploy, or you can manually trigger a deployment.**

