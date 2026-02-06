# MindCare App

A React Native mental wellness application with AI-powered emotion detection from voice analysis.

## Features

- 🎤 **Voice Emotion Detection** – Records audio and analyzes emotions using ML models
- 🧠 **Mental Health Tracking** – Tracks mood and emotional patterns
- 📊 **Text Sentiment Analysis** – Analyzes spoken words for emotion keywords
- 🤖 **Backend ML Analysis** – Python Flask backend with librosa and scikit-learn models

## Tech Stack

- **Frontend:** React Native, react-native-nitro-sound, @react-native-voice/voice
- **Backend API (Node):** Express, MongoDB (Mongoose), JWT
- **Backend API (Python):** Flask, librosa, scikit-learn, pydub

---

## How to Run on Windows

### Prerequisites (install on your PC)

1. **Node.js** (v20 or higher)  
   - Download: https://nodejs.org/  
   - Confirm: `node -v` and `npm -v` in Command Prompt or PowerShell.

2. **Python 3** (for the audio analysis API)  
   - Download: https://www.python.org/downloads/  
   - During install, check **“Add Python to PATH”**.  
   - Confirm: `python --version` and `pip --version`.

3. **Android Studio** (for Android emulator and SDK)  
   - Download: https://developer.android.com/studio  
   - Install Android SDK and at least one emulator (e.g. Pixel 5, API 33).  
   - Set `ANDROID_HOME` (e.g. `C:\Users\<You>\AppData\Local\Android\Sdk`) and add `platform-tools` to PATH.

4. **JDK 17**  
   - Android Studio often installs a bundled JDK; otherwise install OpenJDK 17 and set `JAVA_HOME`.

5. **MongoDB**  
   - Use MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas  
   - Create a cluster and get a connection string, or install MongoDB locally and use `mongodb://localhost:27017`.

---

### 1. Clone and install

```cmd
git clone https://github.com/MentalHealth-App/MindCare.git
cd MindCare
npm install
```

### 2. Environment variables

In the **project root** (same folder as `package.json`), create a file named `.env` with:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=8000
OPENROUTER_KEY=your_openrouter_api_key_if_used
```

- Replace `your_mongodb_connection_string` with your Atlas URI (or `mongodb://localhost:27017` if local).
- Replace `OPENROUTER_KEY` if the app uses OpenRouter; otherwise you can leave it empty or omit.

See `.env.example` in the repo for a template.

### 3. Backend API (Node – auth & data)

Runs on port **8000**. Uses the same `.env` in the project root.

```cmd
node server.js
```

Leave this terminal open. You should see the server listening on port 8000.

### 4. Python audio analysis API

Runs on port **5001**. Install dependencies and start the Flask app:

```cmd
cd api
pip install -r requirements.txt
python audio_analyzer.py
```

Leave this terminal open. The API will run at `http://localhost:5001`.

### 5. Start Metro (React Native bundler)

Open a **new** terminal in the project root:

```cmd
cd MindCare
npm start
```

Leave Metro running.

### 6. Run the app on Android

Open **another** terminal in the project root:

```cmd
cd MindCare
npm run android
```

- If an Android emulator is running, the app will install and launch there.
- For a **physical device**: enable USB debugging, connect the device, then run `npm run android` again.

**Using a physical device on the same Wi‑Fi:**  
In `src/utils/api.js`, set `LOCAL_IP` to your Windows PC’s local IP (e.g. from `ipconfig`), so the device can reach `http://<LOCAL_IP>:8000` and `http://<LOCAL_IP>:5001`.

---

## Summary – Windows run order

| Step | Command / action |
|------|------------------|
| 1 | `npm install` in project root |
| 2 | Create `.env` in project root (see above) |
| 3 | Terminal 1: `node server.js` (Node API on 8000) |
| 4 | Terminal 2: `cd api` → `pip install -r requirements.txt` → `python audio_analyzer.py` (Python API on 5001) |
| 5 | Terminal 3: `npm start` (Metro) |
| 6 | Terminal 4: `npm run android` (build and run app) |

---

## API endpoints (reference)

- **Node (port 8000):** `/signup`, `/login`, `/reset-password`, `/mentalhealthresults`, etc.
- **Python (port 5001):** `POST /analyze` – upload audio file (multipart/form-data), returns emotion/mood and audio features.

---

## Project structure

```
MindCare/
├── api/                 # Python audio analysis API
│   ├── audio_analyzer.py
│   ├── models/          # ML models (emotion_model.pkl, scaler.pkl, labels.json)
│   └── requirements.txt
├── src/
│   ├── screens/         # App screens
│   ├── components/      # Reusable UI
│   └── utils/           # api.js, auth.js, sentimentAnalyzer.js
├── server.js            # Node/Express backend (auth, MongoDB)
├── index.js             # React Native entry
├── App.js
└── .env                 # Not in git – create from .env.example
```

## License

Private project.
