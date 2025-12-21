# MindCare App

A React Native mental wellness application with AI-powered emotion detection from voice analysis.

## Features

- 🎤 **Voice Emotion Detection** - Records audio and analyzes emotions using ML models
- 🧠 **Mental Health Tracking** - Tracks mood and emotional patterns
- 📊 **Text Sentiment Analysis** - Analyzes spoken words for emotion keywords
- 🤖 **Backend ML Analysis** - Python Flask backend with librosa and scikit-learn models

## Tech Stack

### Frontend
- React Native
- Audio Recording (react-native-nitro-sound)
- Speech Recognition (@react-native-voice/voice)

### Backend API
- Python Flask
- librosa (audio analysis)
- scikit-learn (ML emotion prediction)
- pydub (audio format conversion)

## Setup

### Backend API Setup

1. Navigate to the API directory:
```bash
cd api
```

2. Install Python dependencies:
```bash
pip3 install flask librosa scikit-learn numpy pydub
```

3. Make sure you have the ML model files in `api/models/`:
   - `emotion_model.pkl`
   - `scaler.pkl`
   - `labels.json`

4. Run the Flask server:
```bash
python3 audio_analyzer.py
```

The API will run on `http://localhost:5001`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start Metro bundler:
```bash
npm start
```

3. Run on Android:
```bash
npm run android
```

## API Endpoints

### POST /analyze
Analyzes audio file and returns emotion prediction.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Audio file (mp4, m4a, wav, etc.)

**Response:**
```json
{
  "emotion": "Happy",
  "mood": "Happy",
  "pitch": 220.5,
  "speed": 125.3
}
```

## Project Structure

```
MindCareApp-main/
├── api/                    # Backend API
│   ├── audio_analyzer.py  # Flask server & ML analysis
│   ├── models/            # ML models
│   │   ├── emotion_model.pkl
│   │   ├── scaler.pkl
│   │   └── labels.json
│   └── uploads/           # Temporary audio files
├── src/                    # React Native app
│   ├── screens/           # App screens
│   ├── components/        # Reusable components
│   └── utils/             # Utilities & API calls
└── android/               # Android native code
```

## License

Private project
