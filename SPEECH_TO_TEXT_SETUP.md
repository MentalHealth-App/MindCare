# Speech-to-Text & Word-Based Emotion Detection Setup Guide

This guide explains how to set up word-based emotion detection using speech-to-text functionality.

## ✅ What's Already Done

1. **Speech-to-Text Package Installed**: `@react-native-voice/voice` has been installed
2. **Sentiment Analyzer Created**: `src/utils/sentimentAnalyzer.js` analyzes text for emotions
3. **Integration Complete**: The app now combines audio features + text sentiment for better emotion detection

## 📋 Additional Setup Required

### For Android:

1. **Add permissions to `android/app/src/main/AndroidManifest.xml`** (if not already present):
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

2. **Rebuild the app**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### For iOS:

1. **Add microphone permission to `ios/MindCareApp/Info.plist`**:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to record and analyze your voice for emotion detection</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app needs speech recognition to transcribe your words for emotion detection</string>
```

2. **Install pods**:
```bash
cd ios
pod install
cd ..
npm run ios
```

## 🎯 How It Works

### Emotion Detection Process:

1. **Audio Recording**: Records voice using `react-native-nitro-sound`
2. **Speech-to-Text**: Transcribes speech in real-time using `@react-native-voice/voice`
3. **Text Sentiment Analysis**: Analyzes transcribed words for emotion keywords (happy, sad, angry, etc.)
4. **Combined Detection**: 
   - **Audio Features**: Pitch, volume, tempo patterns
   - **Text Sentiment**: Word-based emotion detection
   - **Final Result**: Combines both for accurate emotion prediction

### Example:

- **You say**: "I'm so happy today!"
- **Text Sentiment**: Detects "happy" keyword → Happy emotion (high confidence)
- **Audio Features**: Medium-high pitch, stable volume
- **Combined Result**: Happy emotion (confirmed by both text and audio)

## 🔧 Troubleshooting

### Speech Recognition Not Working:

1. **Check Permissions**: Ensure microphone permission is granted
2. **Check Language**: Default is English (`en-US`). Change in `Voice.start('en-US')` if needed
3. **Check Internet**: Speech recognition may require internet connection
4. **Check Console Logs**: Look for "Speech recognition started" messages

### Always Showing "Calm" or "Happy":

1. **Check Audio Recording**: Verify microphone is capturing sound (check volume meter)
2. **Check Text Transcription**: See if words are being transcribed (check console logs)
3. **Speak Clearly**: Speak loudly and clearly for better detection
4. **Use Emotion Words**: Try saying words like "happy", "sad", "angry" for better text-based detection

### Audio Not Recording:

1. **Permissions**: Grant microphone permission
2. **Check Device**: Ensure microphone is not blocked or damaged
3. **Check Volume**: Speak at normal volume
4. **Restart App**: Close and reopen the app

## 📊 Emotion Keywords Detected

The sentiment analyzer looks for these keywords:

- **Happy**: happy, joy, excited, great, wonderful, love, awesome, etc.
- **Sad**: sad, depressed, upset, unhappy, miserable, hopeless, cry, etc.
- **Angry**: angry, mad, furious, annoyed, frustrated, hate, etc.
- **Anxious**: anxious, worried, nervous, afraid, scared, panic, stressed, etc.
- **Calm**: calm, peaceful, relaxed, serene, tranquil, etc.
- **Neutral**: okay, fine, normal, regular, etc.

## 🎤 Testing

1. **Start Recording**: Tap "Start Recording"
2. **Speak**: Say something with emotion words (e.g., "I'm feeling very happy today!")
3. **Watch Live Analysis**: See real-time emotion detection
4. **Check Transcription**: See transcribed text appear in the UI
5. **Stop Recording**: Tap "Stop Recording"
6. **View Results**: See combined audio + text emotion detection

## 📝 Notes

- Speech recognition works best in quiet environments
- English language is supported by default
- Text sentiment is weighted more heavily when confidence is high (>0.6)
- Audio features still provide emotion detection even if speech recognition fails

