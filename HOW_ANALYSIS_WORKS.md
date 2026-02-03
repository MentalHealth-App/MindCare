# How Voice Emotion Analysis Works 🎤

## Overview

The MindCare app uses a **multi-layered approach** to analyze emotions from voice recordings. Here's how it works:

---

## 🔄 Analysis Flow

```
User Records Voice
    ↓
Audio File Created (MP4/M4A)
    ↓
Upload to Python Flask Server
    ↓
Convert to WAV Format
    ↓
Extract Audio Features (Volume, Pitch, Speed, MFCC, etc.)
    ↓
Run Machine Learning Model
    ↓
Combine with Text Sentiment (if available)
    ↓
Return Emotion Result (Happy, Sad, Angry, Neutral, Fear/Anxious)
```

---

## 📊 Two-Level Analysis System

### 1. **Real-Time Analysis (Client-Side)**
   - Happens **while recording** (in the React Native app)
   - Uses volume and pitch patterns
   - Provides instant feedback

### 2. **Backend Analysis (Server-Side)**
   - Happens **after recording stops**
   - Uses Machine Learning model
   - More accurate and comprehensive
   - Analyzes audio features extracted using librosa

---

## 🎵 Real-Time Emotion Detection (Client-Side)

### Location: `VoiceDetectionScreen.js`

**Features Analyzed:**
1. **Volume (Amplitude)**
   - Average volume level
   - Volume stability (consistency)
   - Volume trends (increasing/decreasing)
   - Volume range (min-max difference)

2. **Pitch (Frequency)**
   - Average pitch (fundamental frequency)
   - Pitch stability
   - Pitch trends
   - Pitch variation (coefficient of variation)

3. **Patterns**
   - Peak frequency (sudden loud sounds)
   - Volume and pitch correlation
   - Stability scores

### Emotion Scoring System:

Each emotion gets a score based on voice characteristics:

#### **Happy 😊**
- **Volume:** Medium-high (40-70 on scale)
- **Pitch:** Medium-high (100-180 Hz)
- **Characteristics:** Stable, positive trends

#### **Sad 😢**
- **Volume:** Low-medium (15-45)
- **Pitch:** Low-medium (60-130 Hz)
- **Characteristics:** Stable, negative/flat trends, fewer peaks

#### **Angry 😠**
- **Volume:** High (60+)
- **Pitch:** High (140+ Hz)
- **Characteristics:** High variance, many peaks, rising trends

#### **Anxious 😰**
- **Volume:** Variable
- **Pitch:** High and variable
- **Characteristics:** Unstable, many fluctuations

#### **Neutral 😐**
- **Volume:** Medium (30-50)
- **Pitch:** Medium (90-150 Hz)
- **Characteristics:** Stable, balanced

---

## 🤖 Backend ML Analysis (Server-Side)

### Location: `api/audio_analyzer.py`

### Step 1: Audio Conversion
```python
AudioSegment.from_file() → Convert MP4/M4A to WAV
```

### Step 2: Feature Extraction (34 Features)

Using **librosa** library, extracts:

1. **MFCC Features (13 values)**
   - Mel-Frequency Cepstral Coefficients
   - Captures timbre and tone quality

2. **Chroma Features (12 values)**
   - Pitch class information
   - Musical characteristics

3. **Spectral Features (8 values)**
   - Zero Crossing Rate
   - Spectral Centroid
   - Spectral Rolloff
   - Spectral Bandwidth
   - Spectral Contrast
   - Spectral Flatness
   - Tempo

4. **Statistical Features (1 value)**
   - Overall audio statistics

### Step 3: Machine Learning Model

**Model Type:** Support Vector Classifier (SVC)
- Pre-trained model loaded from `models/emotion_model.pkl`
- Scaler normalization from `models/scaler.pkl`
- Emotion labels from `models/labels.json`

**Process:**
```
Feature Vector (34 values)
    ↓
Normalize using StandardScaler
    ↓
Predict using SVC model
    ↓
Get Emotion Class + Confidence Scores
```

**Available Emotions:**
- Neutral
- Happy
- Sad
- Angry
- Fear/Anxious

### Step 4: Pitch & Tempo Analysis

```python
# Pitch detection
pitches = librosa.piptrack() → Average pitch in Hz

# Tempo detection  
tempo = librosa.beat.beat_track() → Speech speed in BPM
```

---

## 📝 Text Sentiment Analysis (Optional)

### Location: `src/utils/sentimentAnalyzer.js`

**If speech-to-text works** (Voice module):
1. Transcribe audio to text
2. Analyze keywords for sentiment:
   - **Happy words:** happy, excited, great, wonderful, amazing
   - **Sad words:** sad, depressed, down, upset, miserable, hopeless
   - **Angry words:** angry, furious, annoyed, frustrated, mad
   - **Anxious words:** anxious, worried, nervous, afraid, scared

3. Calculate sentiment scores
4. Convert to mood

**Note:** Currently, Voice module has linking issues, so text analysis may not always work.

---

## 🔀 Final Emotion Determination

### Priority Order:

1. **Text Sentiment** (if available and confident)
   - Higher priority when text is clear

2. **Backend ML Result**
   - Most accurate analysis
   - Uses trained model

3. **Real-Time Detection**
   - Fallback or supplementary
   - Shows during recording

### Combining Results:

```javascript
if (textSentiment && textSentiment.confidence > 0.7) {
    finalEmotion = textSentiment.mood;
} else {
    finalEmotion = audioAnalysis.emotion;
}
```

---

## 🎯 Key Audio Features Explained

### **Pitch (Fundamental Frequency)**
- **Low Pitch (80-120 Hz):** Sad, depressed, tired
- **Medium Pitch (120-180 Hz):** Normal, neutral
- **High Pitch (180-250 Hz):** Happy, excited, anxious

### **Volume (Amplitude)**
- **Low Volume:** Sad, shy, quiet
- **Medium Volume:** Normal, calm
- **High Volume:** Angry, excited, happy

### **Speed (Tempo)**
- **Slow:** Sad, depressed, calm
- **Medium:** Normal
- **Fast:** Happy, anxious, excited

### **Stability**
- **Stable:** Calm, neutral, confident
- **Variable:** Anxious, nervous, emotional

---

## 🔬 Technical Details

### Libraries Used:

**Backend (Python):**
- `librosa` - Audio analysis
- `scikit-learn` - Machine Learning
- `pydub` - Audio format conversion
- `numpy` - Numerical computations
- `scipy` - Scientific computing

**Frontend (React Native):**
- `react-native-nitro-sound` - Audio recording
- `@react-native-voice/voice` - Speech-to-text (optional)
- Custom sentiment analyzer - Text analysis

### Model Training:
- The ML model was trained on audio samples with known emotions
- Uses 34 features extracted from audio
- Support Vector Classifier (SVC) algorithm
- StandardScaler for feature normalization

---

## 📈 Accuracy Considerations

### Strengths:
✅ **ML Model:** Trained on real data, good accuracy for clear audio
✅ **Multiple Features:** 34 features provide comprehensive analysis
✅ **Pitch Analysis:** Reliable indicator of emotion

### Limitations:
⚠️ **Background Noise:** Can affect accuracy
⚠️ **Recording Quality:** Poor mic quality reduces accuracy
⚠️ **Short Recordings:** Need at least 1-2 seconds of clear speech
⚠️ **Language:** Model trained on English, may vary for other languages
⚠️ **Individual Differences:** Voice characteristics vary by person

---

## 🎭 Emotion Mapping

| Detected Emotion | Displayed Mood | Characteristics |
|-----------------|----------------|-----------------|
| Neutral | Neutral | Balanced, calm voice |
| Happy | Happy | Higher pitch, positive energy |
| Sad | Sad | Lower pitch, slower, quieter |
| Angry | Angry | High volume, high pitch, intensity |
| Fear | Anxious | Variable, higher pitch, nervous |

---

## 💡 Best Practices for Accurate Analysis

1. **Speak Clearly:** Enunciate words
2. **Quiet Environment:** Minimize background noise
3. **Adequate Length:** Record for at least 5 seconds
4. **Natural Expression:** Don't force emotions
5. **Good Microphone:** Use device's built-in mic (not external)
6. **Stable Recording:** Hold device steady

---

## 🔄 Improvement Opportunities

1. **Better Text Sentiment:** Fix Voice module linking for better transcription
2. **More Training Data:** Expand ML model with more diverse samples
3. **Context Awareness:** Consider user history and patterns
4. **Hybrid Approach:** Better combination of real-time + ML results
5. **Individual Calibration:** Adjust for each user's baseline voice

---

## 📚 References

- **Librosa Documentation:** https://librosa.org/
- **Scikit-learn SVC:** https://scikit-learn.org/stable/modules/svm.html
- **Audio Emotion Recognition:** Research on pitch, volume, and spectral features
- **MFCC Features:** Mel-frequency cepstral coefficients for speech analysis

---

**This multi-layered approach ensures robust emotion detection by combining real-time analysis, machine learning, and optional text sentiment!** 🎯

