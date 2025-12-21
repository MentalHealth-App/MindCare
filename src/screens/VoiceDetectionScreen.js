import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import AudioRecorderPlayer from 'react-native-nitro-sound';
import Voice from '@react-native-voice/voice';
import { analyzeAudio } from '../utils/api';
import { analyzeTextSentiment, sentimentToMood } from '../utils/sentimentAnalyzer';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    try {
      // Check if already granted
      const checkResult = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
      console.log('🎤 Microphone permission check:', checkResult);
      
      if (checkResult) {
        return true;
      }
      
      // Request permission
      const audioGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'MindCareApp needs access to your microphone to record voice for emotion detection.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      console.log('🎤 Microphone permission result:', audioGranted);
      
      if (audioGranted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Microphone permission granted');
        return true;
      } else {
        console.error('❌ Microphone permission denied');
        return false;
      }
    } catch (err) {
      console.error('❌ Error requesting microphone permission:', err);
      return false;
    }
  }
  return true;
}

export default function VoiceDetectionScreen() {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [mood, setMood] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPath, setAudioPath] = useState(null);
  
  // Real-time analysis states
  const [liveVolume, setLiveVolume] = useState(0);
  const [livePitch, setLivePitch] = useState(0);
  const [realtimeEmotion, setRealtimeEmotion] = useState('Listening...');
  const [transcribedText, setTranscribedText] = useState('');
  const [textSentiment, setTextSentiment] = useState(null);

  const audioRecorderPlayer = useRef(AudioRecorderPlayer).current;
  const recordingInterval = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const volumeAnim = useRef(new Animated.Value(0)).current;

  // Track volume history for pattern analysis
  const volumeHistory = useRef([]);
  const pitchHistory = useRef([]);
  
  // Speech recognition state
  const speechRecognitionActive = useRef(false);

  // Advanced real-time emotion detection using multi-factor analysis (audio + text)
  const detectRealtimeEmotion = (volume, pitch, recordTime, volumeHistory, pitchHistory, textSentimentData = null) => {
    // Need at least 2 seconds of data for reliable detection
    if (recordTime < 2 || volumeHistory.length < 15) {
      return 'Listening... 🎤';
    }
    
    // ===== CALCULATE VOLUME FEATURES =====
    const avgVolume = volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length;
    
    // Check if we have real volume data (not just placeholder values)
    const hasRealAudioData = avgVolume > 5; // If average volume is very low, likely no real metering
    
    if (!hasRealAudioData) {
      // No real audio volume data available - cannot detect emotion from audio
      // This is normal if react-native-nitro-sound doesn't support metering
      // Show recording status instead of error
      
      // Only use text sentiment if available
      if (textSentimentData && textSentimentData.emotion && textSentimentData.confidence > 0.3) {
        const emotionMap = {
          'Happy': 'Happy 😊',
          'Sad': 'Sad 😢',
          'Angry': 'Angry 😠',
          'Anxious': 'Anxious 😰',
          'Calm': 'Calm 😌',
          'Neutral': 'Neutral 😐',
        };
        return emotionMap[textSentimentData.emotion] || 'Neutral 😐';
      }
      
      // No real-time audio data available - show recording status
      // Backend will analyze after recording stops
      if (recordTime < 3) {
        return 'Listening... 🎤';
    } else {
        return 'Analyzing... 🎵'; // Will analyze via backend after recording
      }
    }
    const maxVolume = Math.max(...volumeHistory);
    const minVolume = Math.min(...volumeHistory);
    const volumeRange = maxVolume - minVolume;
    const volumeStdDev = Math.sqrt(
      volumeHistory.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumeHistory.length
    );
    const volumeCoeffVar = avgVolume > 0 ? (volumeStdDev / avgVolume) * 100 : 0; // Coefficient of variation
    
    // Analyze volume trends (rising/falling/stable)
    const recentVolumes = volumeHistory.slice(-10);
    const earlyVolumes = volumeHistory.slice(0, Math.min(10, Math.floor(volumeHistory.length / 2)));
    const recentAvg = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const earlyAvg = earlyVolumes.reduce((a, b) => a + b, 0) / earlyVolumes.length;
    const volumeTrend = recentAvg - earlyAvg; // Positive = rising, Negative = falling
    
    // Calculate volume stability score (0-1, higher = more stable)
    const volumeStabilityScore = Math.max(0, 1 - (volumeCoeffVar / 50)); // 50% CV = 0 stability
    
    // Detect volume peaks (sudden increases)
    let peakCount = 0;
    for (let i = 1; i < volumeHistory.length - 1; i++) {
      if (volumeHistory[i] > volumeHistory[i-1] + 15 && volumeHistory[i] > volumeHistory[i+1] + 15) {
        peakCount++;
      }
    }
    const peakFrequency = peakCount / (recordTime || 1);

    // ===== CALCULATE PITCH FEATURES =====
    const avgPitch = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
    const maxPitch = Math.max(...pitchHistory);
    const minPitch = Math.min(...pitchHistory);
    const pitchRange = maxPitch - minPitch;
    const pitchStdDev = Math.sqrt(
      pitchHistory.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) / pitchHistory.length
    );
    const pitchCoeffVar = avgPitch > 0 ? (pitchStdDev / avgPitch) * 100 : 0;
    
    // Analyze pitch trends
    const recentPitches = pitchHistory.slice(-10);
    const earlyPitches = pitchHistory.slice(0, Math.min(10, Math.floor(pitchHistory.length / 2)));
    const recentPitchAvg = recentPitches.reduce((a, b) => a + b, 0) / recentPitches.length;
    const earlyPitchAvg = earlyPitches.reduce((a, b) => a + b, 0) / earlyPitches.length;
    const pitchTrend = recentPitchAvg - earlyPitchAvg;
    
    const pitchStabilityScore = Math.max(0, 1 - (pitchCoeffVar / 30));

    // ===== EMOTION SCORING SYSTEM =====
    // Each emotion gets a score based on how well it matches the voice characteristics
    const emotions = {
      'Happy 😊': 0,
      'Sad 😢': 0,
      'Angry 😠': 0,
      'Anxious 😰': 0,
      'Excited 🤩': 0,
      'Neutral 😐': 0,
      'Calm 😌': 0,
    };

    // Happy: Medium-high volume (40-70), stable, medium-high pitch (100-180), positive trends
    emotions['Happy 😊'] += 
      (avgVolume >= 40 && avgVolume <= 70 ? 3 : Math.max(0, 3 - Math.abs(avgVolume - 55) / 10)) +
      (volumeStabilityScore > 0.6 ? 2 : volumeStabilityScore * 2) +
      (avgPitch >= 100 && avgPitch <= 180 ? 2 : Math.max(0, 2 - Math.abs(avgPitch - 140) / 40)) +
      (volumeTrend > -5 ? 1 : 0) +
      (pitchStabilityScore > 0.5 ? 1 : 0);

    // Sad: Low-medium volume (15-45), stable, low-medium pitch (60-130), negative or flat trends
    emotions['Sad 😢'] +=
      (avgVolume >= 15 && avgVolume <= 45 ? 3 : Math.max(0, 3 - Math.abs(avgVolume - 30) / 10)) +
      (volumeStabilityScore > 0.5 ? 2 : 0) +
      (avgPitch >= 60 && avgPitch <= 130 ? 3 : Math.max(0, 3 - Math.abs(avgPitch - 95) / 35)) +
      (volumeTrend <= 5 ? 1 : 0) +
      (pitchTrend <= 10 ? 1 : 0) -
      (peakFrequency > 2 ? 1 : 0); // Penalize for too many peaks

    // Angry: High volume (60+), high variance, high pitch (140+), many peaks, rising trends
    emotions['Angry 😠'] +=
      (avgVolume >= 60 ? 3 : Math.max(0, avgVolume / 20)) +
      (volumeCoeffVar > 25 ? 3 : volumeCoeffVar / 10) +
      (avgPitch >= 140 ? 2 : Math.max(0, (avgPitch - 100) / 40)) +
      (peakFrequency > 1.5 ? 2 : peakFrequency) +
      (volumeRange > 30 ? 2 : volumeRange / 15) +
      (volumeTrend > 0 ? 1 : 0) +
      (pitchTrend > 0 ? 1 : 0);

    // Anxious/Fear: Medium volume (25-60), high variance, medium-high pitch, high pitch variance
    emotions['Anxious 😰'] +=
      (avgVolume >= 25 && avgVolume <= 60 ? 2 : Math.max(0, 2 - Math.abs(avgVolume - 42.5) / 20)) +
      (volumeCoeffVar > 30 ? 3 : volumeCoeffVar / 12) +
      (pitchCoeffVar > 20 ? 3 : pitchCoeffVar / 8) +
      (volumeRange > 25 ? 2 : volumeRange / 12.5) +
      (pitchRange > 40 ? 2 : pitchRange / 20) +
      (peakFrequency > 1 && peakFrequency < 3 ? 1 : 0);

    // Excited: Very high volume (70+), stable, high pitch (130+), positive trends
    emotions['Excited 🤩'] +=
      (avgVolume >= 70 ? 3 : Math.max(0, (avgVolume - 50) / 10)) +
      (volumeStabilityScore > 0.6 ? 2 : 0) +
      (avgPitch >= 130 ? 2 : Math.max(0, (avgPitch - 100) / 30)) +
      (volumeTrend > 0 ? 1.5 : 0) +
      (pitchTrend > 5 ? 1 : 0) +
      (avgVolume > 75 && volumeStabilityScore > 0.7 ? 1 : 0);

    // Neutral: Medium volume (30-55), stable, medium pitch (90-150), minimal trends
    emotions['Neutral 😐'] +=
      (avgVolume >= 30 && avgVolume <= 55 ? 3 : Math.max(0, 3 - Math.abs(avgVolume - 42.5) / 15)) +
      (volumeStabilityScore > 0.65 ? 2.5 : volumeStabilityScore * 2.5) +
      (avgPitch >= 90 && avgPitch <= 150 ? 2 : Math.max(0, 2 - Math.abs(avgPitch - 120) / 30)) +
      (pitchStabilityScore > 0.6 ? 1.5 : 0) +
      (Math.abs(volumeTrend) < 10 ? 1 : 0) +
      (Math.abs(pitchTrend) < 15 ? 1 : 0) +
      (peakFrequency < 1 ? 1 : 0);

    // Calm: Low volume (<35), stable, low-medium pitch (<140), minimal variation
    emotions['Calm 😌'] +=
      (avgVolume < 35 ? 3 : Math.max(0, 3 - (avgVolume - 35) / 10)) +
      (volumeStabilityScore > 0.7 ? 2.5 : 0) +
      (avgPitch < 140 ? 2 : Math.max(0, 2 - (avgPitch - 140) / 50)) +
      (volumeCoeffVar < 20 ? 1.5 : 0) +
      (pitchCoeffVar < 15 ? 1 : 0) +
      (peakFrequency < 0.5 ? 1 : 0) +
      (volumeRange < 20 ? 1 : 0);

    // ===== PRIORITIZE TEXT SENTIMENT IF AVAILABLE =====
    // If we have text sentiment with ANY confidence, prioritize it heavily!
    if (textSentimentData && textSentimentData.emotion && textSentimentData.confidence > 0.1) {
      const sentimentEmotion = textSentimentData.emotion;
      const sentimentWeight = textSentimentData.confidence * 10; // VERY strong weight for text sentiment
      
      // Map text sentiment to emotion keys
      const emotionMap = {
        'Happy': 'Happy 😊',
        'Sad': 'Sad 😢',
        'Angry': 'Angry 😠',
        'Anxious': 'Anxious 😰',
        'Calm': 'Calm 😌',
        'Neutral': 'Neutral 😐',
      };
      
      const mappedEmotion = emotionMap[sentimentEmotion];
      if (mappedEmotion && emotions[mappedEmotion] !== undefined) {
        // HEAVILY boost the text-based emotion
        emotions[mappedEmotion] += sentimentWeight;
        
        // If text sentiment has reasonable confidence, DOUBLE all its scores
        if (textSentimentData.confidence > 0.3) {
          emotions[mappedEmotion] += 10; // Extra heavy boost
          
          // Reduce other emotion scores to make text sentiment dominant
          Object.keys(emotions).forEach((emotion) => {
            if (emotion !== mappedEmotion) {
              emotions[emotion] = emotions[emotion] * 0.5; // Halve other emotions
            }
          });
        }
        
        console.log(`📝📝📝 TEXT SENTIMENT: ${sentimentEmotion} (+${sentimentWeight.toFixed(1)}) confidence: ${textSentimentData.confidence.toFixed(2)}`);
      }
    }

    // ===== FIND HIGHEST SCORING EMOTION =====
    let maxScore = 0;
    let detectedEmotion = 'Neutral 😐';
    
    for (const [emotion, score] of Object.entries(emotions)) {
      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion;
      }
    }

    // Debug logging (every 3 seconds)
    if (recordTime % 3 === 0) {
      console.log('🎭 Advanced Emotion Detection:', {
        detected: detectedEmotion,
        scores: emotions,
        textSentiment: textSentimentData,
        features: {
          avgVol: avgVolume.toFixed(1),
          volStability: volumeStabilityScore.toFixed(2),
          avgPitch: avgPitch.toFixed(1),
          pitchStability: pitchStabilityScore.toFixed(2),
          peaks: peakFrequency.toFixed(2),
          volTrend: volumeTrend.toFixed(1),
          pitchTrend: pitchTrend.toFixed(1),
        }
      });
    }

    // Return the detected emotion
    return detectedEmotion;
  };

  useEffect(() => {
    if (recording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [recording]);

  // Animate volume indicator
  useEffect(() => {
    Animated.timing(volumeAnim, {
      toValue: liveVolume / 100,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [liveVolume]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize Voice recognition (with null safety)
  useEffect(() => {
    // Check if Voice module is available
    if (!Voice) {
      console.warn('⚠️ Voice module not available - speech recognition disabled');
      return;
    }

    try {
      // Set up voice recognition handlers
      Voice.onSpeechStart = () => {
        console.log('✅✅✅ Speech recognition STARTED successfully!');
        speechRecognitionActive.current = true;
      };

      Voice.onSpeechRecognized = (e) => {
        console.log('📢 Speech recognized event:', e);
      };

      Voice.onSpeechEnd = () => {
        console.log('🔚 Speech recognition ended');
        speechRecognitionActive.current = false;
      };

      Voice.onSpeechError = (e) => {
        console.error('❌ Speech recognition error event:', e);
        speechRecognitionActive.current = false;
      };

      Voice.onSpeechResults = (e) => {
        console.log('📋 Speech results event received:', e);
        if (e && e.value && e.value.length > 0) {
          const transcript = e.value[0];
          console.log('✅✅✅ Transcribed text (FINAL):', transcript);
          setTranscribedText(transcript);
          
          // Analyze sentiment from transcribed text
          const sentiment = analyzeTextSentiment(transcript);
          setTextSentiment(sentiment);
          console.log('📝 Text sentiment (final):', sentiment);
        } else {
          console.warn('⚠️ Speech results event received but no text found:', e);
        }
      };

      Voice.onSpeechPartialResults = (e) => {
        console.log('🔄 Speech partial results event:', e);
        if (e && e.value && e.value.length > 0) {
          const partialText = e.value[0];
          console.log('🔄 Transcribed text (PARTIAL):', partialText);
          setTranscribedText(partialText);
          
          // Update sentiment based on partial results
          const sentiment = analyzeTextSentiment(partialText);
          setTextSentiment(sentiment);
          console.log('📝 Text sentiment (partial):', sentiment);
        } else {
          console.warn('⚠️ Partial results event received but no text found:', e);
        }
      };

      console.log('✅ Voice recognition handlers set up');
    } catch (error) {
      console.error('❌ Error setting up Voice handlers:', error);
    }

    return () => {
      // Cleanup - only if Voice module is properly initialized
      try {
        if (Voice && typeof Voice === 'object' && Voice.destroy && typeof Voice.destroy === 'function') {
          Voice.destroy().then(() => {
            if (Voice && typeof Voice === 'object' && Voice.removeAllListeners && typeof Voice.removeAllListeners === 'function') {
              Voice.removeAllListeners();
            }
          }).catch((e) => {
            // Voice module cleanup failed - silently ignore
          });
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  const startRecording = async () => {
    const hasPerm = await requestPermissions();
    if (!hasPerm) {
      Alert.alert('Permission Denied', 'Cannot record audio without microphone permission');
      return;
    }

    try {
      // Clear previous results
      setPitch(null);
      setSpeed(null);
      setEmotion(null);
      setMood(null);
      setRecordingTime(0);
      setAudioPath(null);
      setLiveVolume(0);
      setLivePitch(0);
      setRealtimeEmotion('Listening...');
      setTranscribedText('');
      setTextSentiment(null);
      setRecording(true);

      // Reset volume and pitch history
      volumeHistory.current = [];
      pitchHistory.current = [];

      // Start speech recognition for text transcription (optional - app works without it)
      // IMPORTANT: Set to false first, only set to true if Voice actually starts successfully
      speechRecognitionActive.current = false;
      
      try {
        // Check if Voice module is actually available
        if (Voice && typeof Voice === 'object' && typeof Voice.start === 'function') {
          console.log('🎤 Attempting to start Voice recognition...');
          try {
            await Voice.start('en-US');
            console.log('✅✅✅ Speech recognition started successfully!');
            speechRecognitionActive.current = true; // Only set true if start() succeeded
          } catch (startError) {
            // Voice.start() failed even though method exists
            console.warn('⚠️ Voice.start() failed:', startError.message || startError);
            speechRecognitionActive.current = false;
          }
        } else {
          console.warn('⚠️ Voice module not properly linked (Voice is null or start() not available) - continuing with audio-only detection');
          console.warn('   → Voice module:', Voice);
          console.warn('   → Voice.start type:', typeof Voice?.start);
          speechRecognitionActive.current = false;
        }
      } catch (voiceError) {
        // Voice module not working - this is OK, app will use audio-only detection
        console.warn('⚠️ Speech recognition unavailable (using audio-only mode):', voiceError.message || 'Voice module not linked');
        console.warn('   → Error details:', voiceError);
        speechRecognitionActive.current = false;
      }

      // Start recording - configure to use microphone source
      let result;
      try {
        // IMPORTANT: Try to configure audio source to use microphone
        // react-native-nitro-sound may need explicit microphone configuration
        
        // First, try with explicit microphone configuration (if library supports it)
        // Check if library has setAudioSource or similar method
        if (audioRecorderPlayer.setAudioSource) {
          try {
            // Use CAMCORDER (microphone) as audio source
            await audioRecorderPlayer.setAudioSource(5); // CAMCORDER = microphone
            console.log('✅ Audio source set to microphone');
          } catch (sourceError) {
            console.warn('⚠️ Could not set audio source (may use default):', sourceError.message);
          }
        }
        
        // Start recording - the library should use microphone by default
        // But we'll log to verify what's happening
        console.log('🎤 Starting audio recording with microphone...');
        result = await audioRecorderPlayer.startRecorder();
        console.log('✅ Recording started. File path:', result);
        console.log('⚠️ IMPORTANT: Make sure you speak clearly into the microphone during recording!');
      } catch (startError) {
        console.error('❌ Failed to start recording:', startError);
        Alert.alert('Recording Error', 'Could not start recording. Please check microphone permissions.');
        throw startError;
      }
      
      // Enable metering for volume detection (if method exists)
      try {
        if (audioRecorderPlayer.setSubscriptionDuration) {
          await audioRecorderPlayer.setSubscriptionDuration(250); // Update every 250ms
          console.log('✅ Subscription duration set to 250ms');
        }
        
        // Try to enable metering if method exists (library-specific)
        if (audioRecorderPlayer.setMeteringEnabled) {
          await audioRecorderPlayer.setMeteringEnabled(true);
          console.log('✅ Metering enabled via setMeteringEnabled');
        }
      } catch (meteringError) {
        console.warn('⚠️ Could not configure metering (this may be normal):', meteringError.message);
        console.warn('   → Metering may not be supported by react-native-nitro-sound on this platform');
        console.warn('   → Real-time emotion detection will rely on backend analysis only');
      }
      console.log('📁 Audio recording path:', result);

      // Real-time audio monitoring
      audioRecorderPlayer.addRecordBackListener((e) => {
        try {
          // Log all available properties for debugging (first time only)
          if (volumeHistory.current.length === 0) {
            console.log('📋 Audio event properties:', Object.keys(e));
            console.log('📋 Full audio event:', JSON.stringify(e, null, 2));
          }
          
          // Try multiple possible property names for metering
          const meteringValue = e?.currentMetering ?? e?.metering ?? e?.decibels ?? e?.db ?? 
                                e?.currentMeteringValue ?? e?.audioLevel ?? 
                                e?.soundLevel ?? e?.amplitude ?? 0;
          let normalizedVolume = 0;
          
          // Handle different metering formats - IMPORTANT: Better normalization
          // Note: react-native-nitro-sound typically provides dB values (-160 to 0)
          if (volumeHistory.current.length < 5) { // Only log first few times
            console.log('🔊 Raw metering value:', meteringValue, 'Type:', typeof meteringValue, 'Event keys:', Object.keys(e));
          }
          
          // IMPORTANT: Do NOT use fake/random volume values - only use real metering data
          // If metering is 0 or undefined, we cannot detect volume - return early
          if ((meteringValue === 0 || meteringValue === undefined || meteringValue === null) && e?.currentPosition) {
            // No real metering data available - use a low default to show we're recording but can't detect volume
            normalizedVolume = 1; // Minimal value to indicate recording but no volume data
            if (volumeHistory.current.length < 5) {
              console.warn('⚠️ No metering data available - volume detection disabled. Audio may still be recording.');
            }
          } else if (meteringValue < 0) {
            // dB scale (-160 to 0), convert to 0-100
            const dbValue = meteringValue;
            // More aggressive normalization - speech is typically -40dB to 0dB
            if (dbValue > -40) {
              // Active speech: -40dB to 0dB maps to 40-100
              normalizedVolume = Math.min(Math.max(((dbValue + 40) / 40) * 60 + 40, 40), 100);
            } else if (dbValue > -70) {
              // Moderate speech: -70dB to -40dB maps to 20-40
              normalizedVolume = Math.min(Math.max(((dbValue + 70) / 30) * 20 + 20, 20), 40);
            } else {
              // Quiet/background: -160dB to -70dB maps to 0-20
              normalizedVolume = Math.min(Math.max(((dbValue + 160) / 90) * 20, 0), 20);
            }
          } else if (meteringValue > 1 && meteringValue <= 100) {
            // Already 0-100 scale
            normalizedVolume = Math.min(Math.max(meteringValue, 0), 100);
          } else if (meteringValue > 100) {
            // Some other scale, divide by 10 as fallback
            normalizedVolume = Math.min(Math.max(meteringValue / 10, 0), 100);
          } else if (meteringValue > 0) {
            // 0-1 scale, convert to 0-100
            normalizedVolume = Math.min(Math.max(meteringValue * 100, 0), 100);
          }
          
          // Boost any detected audio activity - if there's ANY signal, it's likely speech
          if (normalizedVolume > 5) {
            // Scale up detected audio to realistic speech levels
            normalizedVolume = Math.min(normalizedVolume * 1.5, 100);
          }
          
          // Only log volume occasionally to reduce console spam
          if (volumeHistory.current.length % 10 === 0) {
            console.log('📊 Normalized volume:', normalizedVolume.toFixed(1), 'Metering available:', meteringValue !== 0 && meteringValue !== undefined);
          }
          
          // If we're recording but have no real volume data (metering = 0), warn user once
          if (normalizedVolume <= 1 && volumeHistory.current.length === 10) {
            console.warn('⚠️⚠️⚠️ WARNING: Audio recording active but volume metering not available. Microphone may not be capturing audio properly, or metering is disabled.');
          }
            
          // Enhanced pitch estimation based on volume patterns and speech characteristics
            // Research shows: Happy/Excited = higher pitch (150-250Hz), Sad = lower pitch (80-150Hz)
            const volumeChange = volumeHistory.current.length > 1 
              ? normalizedVolume - volumeHistory.current[volumeHistory.current.length - 2]
              : 0;
            
            // Base pitch varies with volume: louder speech often has higher pitch
            // Male voice: 85-180Hz, Female voice: 165-255Hz, average conversational: 120-180Hz
            let basePitch = 110 + (normalizedVolume * 0.7);
            
            // Adjust based on volume change rate (rapid changes suggest emotional speech)
            const volumeChangeRate = Math.abs(volumeChange);
            if (volumeChangeRate > 10) {
              // Rapid volume changes suggest higher energy = higher pitch
              basePitch += volumeChangeRate * 0.4;
            }
            
            // Add some natural variation based on volume stability
            const recentVolumes = volumeHistory.current.slice(-5);
            if (recentVolumes.length > 1) {
              const volumeVariation = Math.max(...recentVolumes) - Math.min(...recentVolumes);
              // High variation = more emotional = pitch changes
              basePitch += (volumeVariation > 20 ? 15 : -5);
            }
            
            // Constrain to realistic human voice range (60-300Hz)
            const estimatedPitch = Math.min(Math.max(basePitch, 60), 300);
            
            // Store in history (keep last 60 samples for better pattern analysis)
            // At ~10 samples per second, this gives us ~6 seconds of data
            volumeHistory.current.push(normalizedVolume);
            if (volumeHistory.current.length > 60) {
              volumeHistory.current.shift();
            }
            
            pitchHistory.current.push(estimatedPitch);
            if (pitchHistory.current.length > 60) {
              pitchHistory.current.shift();
            }
          
          setLiveVolume(normalizedVolume);
            setLivePitch(estimatedPitch);
            
            // Update real-time emotion with improved detection
            // Use currentPosition from event or fallback to history length (approximate seconds)
            const recordTime = e.currentPosition 
              ? Math.floor(e.currentPosition / 1000) 
              : Math.floor(volumeHistory.current.length / 10); // Approximate: ~10 samples per second
            // Get current text sentiment if available
            const currentTextSentiment = textSentiment || null;
            
            const emotion = detectRealtimeEmotion(
              normalizedVolume, 
              estimatedPitch, 
              recordTime,
              [...volumeHistory.current],
              [...pitchHistory.current],
              currentTextSentiment // Pass text sentiment for combined detection
            );
            
            console.log('🎭 Detected emotion:', emotion, 'Volume:', normalizedVolume.toFixed(1), 'Text:', transcribedText || 'none'); // DEBUG
          setRealtimeEmotion(emotion);
        } catch (error) {
          console.error('Error in record listener:', error);
        }
        return;
      });
    } catch (err) {
      console.error('Recording start error:', err);
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Stop speech recognition first (if it was active and Voice module is working)
      // IMPORTANT: Only call Voice methods if Voice module is actually available
      if (Voice && typeof Voice === 'object' && typeof Voice.stop === 'function' && speechRecognitionActive.current) {
        try {
          await Voice.stop();
          await Voice.cancel();
          console.log('✅ Speech recognition stopped successfully');
          speechRecognitionActive.current = false;
        } catch (voiceError) {
          // Voice module internal error - Voice exists but methods fail
          console.warn('⚠️ Voice.stop() failed (Voice module internal error):', voiceError.message || voiceError);
          speechRecognitionActive.current = false;
        }
      } else {
        // Voice module not available or not active - skip silently
        if (speechRecognitionActive.current) {
          console.log('⚠️ Voice module not available, skipping Voice.stop()');
        }
        speechRecognitionActive.current = false;
      }

      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      setAudioPath(result);

      // Clear history
      volumeHistory.current = [];
      pitchHistory.current = [];

      console.log('🎙️ Recording stopped. File:', result);
      console.log('📝 Final transcribed text:', transcribedText || '(none - Voice module not working)');
      if (textSentiment) {
        console.log('📊 Final text sentiment:', textSentiment);
      } else {
        console.log('⚠️ No text sentiment available - Voice module not linked');
      }

      // Verify audio file was created (note: file:// URIs can't be checked with fetch on Android)
      if (result) {
        console.log('✅ Audio file path exists:', result);
        // File path exists - audio should be recorded
        // Note: Cannot use fetch() for file:// URIs on Android - file will be verified by backend
        console.log('✅ Audio file path confirmed - file will be verified when uploaded to backend');
      } else {
        console.error('❌ No audio file path returned!');
        Alert.alert('Error', 'No audio file was created. Please check microphone permissions.');
        setRealtimeEmotion('Listening...');
        return;
      }

      if (result && recordingTime >= 1) {
        uploadToBackend(result);
      } else {
        Alert.alert('Recording Too Short', 'Please record for at least 1 second');
        setRealtimeEmotion('Listening...');
      }
    } catch (err) {
      console.error('Recording stop error:', err);
      Alert.alert('Error', 'Failed to stop recording: ' + err.message);
      setRecording(false);
      volumeHistory.current = [];
      pitchHistory.current = [];
      
      // Stop voice recognition even if audio stop fails (only if Voice is available and was active)
      // Only try to stop if it was actually started successfully
      if (speechRecognitionActive.current && Voice && typeof Voice === 'object' && typeof Voice.stop === 'function') {
        try {
          await Voice.stop();
        } catch (e) {
          // Voice module not working - silently ignore
        }
      }
      speechRecognitionActive.current = false;
    }
  };

  const uploadToBackend = async (audioFilePath) => {
    setAnalyzing(true);
    try {
      console.log('📤 Uploading audio file to backend:', audioFilePath);
      console.log('📝 Transcribed text (if available):', transcribedText || '(none - Voice module not working)');
      console.log('📊 Text sentiment (if available):', textSentiment || '(none - Voice module not working)');
      
      // Combine audio analysis with text sentiment
      const audioResponse = await analyzeAudio(audioFilePath);
      const audioData = audioResponse.data;

      console.log('Audio analysis result:', audioData);
      
      // PRIORITIZE TEXT SENTIMENT - User wants word-based detection to be primary
      let finalMood = 'Neutral';
      let finalEmotion = 'Neutral';
      let detectionSource = 'audio';
      
      // If we have transcribed text and sentiment, use it as PRIMARY source
      if (transcribedText && transcribedText.trim().length > 0 && textSentiment) {
        const textMood = sentimentToMood(textSentiment.emotion);
        console.log(`📝 Text analysis: "${transcribedText}"`);
        console.log(`📊 Text sentiment: ${textSentiment.emotion} (confidence: ${textSentiment.confidence.toFixed(2)})`);
        console.log(`📊 Text scores:`, textSentiment.scores);
        
        // Use text sentiment if we have ANY keywords detected (even low confidence)
        if (textSentiment.totalKeywords > 0) {
          finalMood = textMood;
          finalEmotion = textSentiment.emotion;
          detectionSource = 'text';
          console.log(`✅ Using TEXT-based detection: ${finalMood}`);
        } else {
          // No keywords found in text, fall back to audio
          finalMood = audioData.mood || 'Neutral';
          finalEmotion = audioData.emotion || 'Neutral';
          detectionSource = 'audio (no text keywords)';
          console.log(`⚠️ No keywords in text, using audio: ${finalMood}`);
        }
      } else {
        // No text available, use audio analysis
        finalMood = audioData.mood || 'Neutral';
        finalEmotion = audioData.emotion || 'Neutral';
        detectionSource = 'audio (no transcription)';
        console.log(`⚠️ No text transcription available, using audio: ${finalMood}`);
        if (transcribedText === '' || !transcribedText) {
          console.log(`⚠️ Voice-to-text did not work. Transcribed text is empty.`);
        }
      }

      setPitch(audioData.pitch);
      setSpeed(audioData.speed);
      setEmotion(finalEmotion);
      setMood(finalMood);

      // Log detection sources
      console.log(`🎯 FINAL DETECTION:`);
      console.log(`   Source: ${detectionSource}`);
      console.log(`   Audio result: ${audioData.mood} (${audioData.emotion})`);
      console.log(`   Text result: ${textSentiment?.emotion || 'N/A'} (confidence: ${textSentiment?.confidence?.toFixed(2) || 'N/A'})`);
      console.log(`   Transcribed text: "${transcribedText || '(none)'}"`);
      console.log(`   FINAL MOOD: ${finalMood}`);
      console.log(`   FINAL EMOTION: ${finalEmotion}`);

      Alert.alert(
        'Analysis Complete', 
        `Mood: ${finalMood}\n\n${transcribedText ? `You said: "${transcribedText}"` : 'Voice-to-text unavailable'}\n\nDetection: ${detectionSource}`
      );
    } catch (error) {
      console.error('Audio analysis error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      Alert.alert('Analysis Failed', `Could not analyze audio: ${errorMsg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const playRecording = async () => {
    if (!audioPath) {
      Alert.alert('No Recording', 'Please record audio first');
      return;
    }

    try {
      // Stop any currently playing audio first
      try {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      } catch (e) {
        // Ignore if nothing was playing
      }

      setPlaying(true);
      setPlaybackTime(0);
      setAudioDuration(0);

      // Normalize file path for platform compatibility
      let filePath = audioPath;
      
      console.log('Attempting to play audio from:', filePath);
      console.log('Original audioPath:', audioPath);
      console.log('Platform:', Platform.OS);

      // Start playback - try the path as provided first
      let msg;
      try {
        msg = await audioRecorderPlayer.startPlayer(filePath);
        console.log('Playback started successfully:', msg);
      } catch (pathError) {
        console.log('First attempt failed, trying alternative path formats...');
        
        // Try different path formats
        const pathVariants = [];
        
        // If it has file://, try without it
        if (filePath.startsWith('file://')) {
          pathVariants.push(filePath.replace('file://', ''));
        }
        
        // If it doesn't have file://, try with it (especially for Android)
        if (!filePath.startsWith('file://') && Platform.OS === 'android') {
          pathVariants.push(`file://${filePath}`);
        }
        
        // Try each variant
        let success = false;
        for (const variant of pathVariants) {
          try {
            console.log('Trying path variant:', variant);
            msg = await audioRecorderPlayer.startPlayer(variant);
            console.log('Playback started with variant:', variant, msg);
            filePath = variant;
            success = true;
            break;
          } catch (e) {
            console.log('Variant failed:', variant, e.message);
          }
        }
        
        if (!success) {
          throw pathError; // Throw original error if all attempts failed
        }
      }
      
      // Set volume to maximum (0.0 to 1.0) - ensure audio is audible
      try {
        await audioRecorderPlayer.setVolume(1.0);
        console.log('Volume set to maximum (1.0)');
      } catch (volError) {
        console.warn('Could not set volume:', volError);
        // Continue even if volume setting fails
      }

      // Set up playback listener
      audioRecorderPlayer.addPlayBackListener((e) => {
        try {
          if (e.currentPosition !== undefined && e.duration !== undefined) {
            const currentPos = Math.floor(e.currentPosition / 1000);
            const duration = Math.floor(e.duration / 1000);
            
            setPlaybackTime(currentPos);
            setAudioDuration(duration);

            // Auto-stop when finished (with small tolerance)
            if (e.currentPosition >= e.duration - 100) {
            stopPlayback();
          }
          }
        } catch (listenerError) {
          console.error('Error in playback listener:', listenerError);
        }
        return;
      });
    } catch (err) {
      console.error('Playback error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      Alert.alert(
        'Playback Error', 
        `Could not play recording: ${err.message || 'Unknown error'}\n\nFile: ${audioPath}`
      );
      setPlaying(false);
    }
  };

  const stopPlayback = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setPlaying(false);
      setPlaybackTime(0);
      console.log('Playback stopped');
    } catch (err) {
      console.error('Stop playback error:', err);
      setPlaying(false);
      // Try to remove listener even if stop fails
      try {
        audioRecorderPlayer.removePlayBackListener();
      } catch (e) {
        // Ignore
      }
    }
  };

  const getMoodColor = (detectedMood) => {
    const colors = {
      Happy: '#4CAF50',
      Sad: '#2196F3',
      Angry: '#F44336',
      Anxious: '#FF9800',
      Neutral: '#9E9E9E',
      Surprised: '#9C27B0',
      Uncomfortable: '#795548',
    };
    return colors[detectedMood] || '#9E9E9E';
  };

  const getMoodEmoji = (detectedMood) => {
    const emojis = {
      Happy: '😊',
      Sad: '😢',
      Angry: '😠',
      Anxious: '😰',
      Neutral: '😐',
      Surprised: '😲',
      Uncomfortable: '😣',
    };
    return emojis[detectedMood] || '😐';
  };

  const getPitchLevel = (pitchValue) => {
    if (!pitchValue) return 'Normal';
    if (pitchValue < 100) return 'Very Low';
    if (pitchValue < 150) return 'Low';
    if (pitchValue < 200) return 'Normal';
    if (pitchValue < 250) return 'High';
    return 'Very High';
  };

  const getSpeedLevel = (speedValue) => {
    if (!speedValue) return 'Normal';
    if (speedValue < 80) return 'Slow';
    if (speedValue < 120) return 'Normal';
    if (speedValue < 160) return 'Fast';
    return 'Very Fast';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎤 Voice Analyzer</Text>
        <Text style={styles.subtitle}>
          Real-time emotion detection from your voice
        </Text>

        {/* Real-time Analysis Display (during recording) */}
        {recording && (
          <View style={styles.realtimeContainer}>
            <Text style={styles.realtimeTitle}>Live Analysis</Text>
            
            {/* Real-time Emotion */}
            <View style={styles.realtimeEmotionBox}>
              <Text style={styles.realtimeEmotionText}>{realtimeEmotion}</Text>
            </View>

            {/* Volume Meter */}
            <View style={styles.meterContainer}>
              <Text style={styles.meterLabel}>Voice Level</Text>
              <View style={styles.meterBar}>
                <Animated.View
                  style={[
                    styles.meterFill,
                    {
                      width: volumeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: 
                        liveVolume > 70 ? '#F44336' :
                        liveVolume > 40 ? '#FF9800' : '#4CAF50',
                    },
                  ]}
                />
              </View>
              <Text style={styles.meterValue}>{Math.round(liveVolume)}%</Text>
            </View>

            {/* Pitch Indicator */}
            <View style={styles.pitchIndicator}>
              <Text style={styles.pitchLabel}>Pitch: </Text>
              <Text style={styles.pitchValue}>{Math.round(livePitch)} Hz</Text>
            </View>
            
            {/* Transcribed Text */}
            {transcribedText && (
              <View style={styles.transcriptionBox}>
                <Text style={styles.transcriptionLabel}>📝 What you're saying:</Text>
                <Text style={styles.transcriptionText}>{transcribedText}</Text>
              </View>
            )}
          </View>
        )}

        {/* Recording Button */}
        <View style={styles.recordingSection}>
          <Animated.View style={[styles.recordButton, { transform: [{ scale: pulseAnim }] }]}>
            <CustomButton
              title={recording ? 'Stop Recording' : 'Start Recording'}
              onPress={recording ? stopRecording : startRecording}
              style={[
                styles.mainButton,
                recording ? styles.recordingButton : styles.startButton,
              ]}
            />
          </Animated.View>

          {recording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording: {formatTime(recordingTime)}</Text>
            </View>
          )}
        </View>

        {/* Playback Controls */}
        {audioPath && !recording && (
          <View style={styles.playbackSection}>
            <Text style={styles.playbackTitle}>📼 Recorded Audio</Text>
            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={[styles.playButton, playing && styles.playButtonActive]}
                onPress={playing ? stopPlayback : playRecording}
              >
                <Text style={styles.playButtonText}>
                  {playing ? '⏸️ Pause' : '▶️ Play Recording'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {playing && audioDuration > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressTime}>
                  {formatTime(playbackTime)} / {formatTime(audioDuration)}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${(playbackTime / audioDuration) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Analyzing Indicator */}
        {analyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.analyzingText}>Analyzing your voice...</Text>
          </View>
        )}

        {/* Results Section */}
        {!analyzing && (pitch || speed || mood) && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>📊 Analysis Results</Text>

            {/* Transcribed Text Result */}
            {transcribedText && (
              <View style={styles.transcriptionResultCard}>
                <Text style={styles.transcriptionResultTitle}>📝 Transcribed Text</Text>
                <Text style={styles.transcriptionResultText}>{transcribedText}</Text>
                {textSentiment && (
                  <Text style={styles.sentimentInfo}>
                    Text sentiment: {textSentiment.emotion} ({(textSentiment.confidence * 100).toFixed(0)}% confidence)
                  </Text>
                )}
              </View>
            )}

            {/* Mood Result - Primary */}
            {mood && (
              <View style={[styles.moodCard, { borderColor: getMoodColor(mood) }]}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text>
                <Text style={styles.moodLabel}>Detected Mood</Text>
                <Text style={[styles.moodValue, { color: getMoodColor(mood) }]}>{mood}</Text>
                {emotion && <Text style={styles.emotionSubtext}>Emotion: {emotion}</Text>}
              </View>
            )}

            {/* Pitch Analysis */}
            {typeof pitch === 'number' && (
              <View style={styles.analysisCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>🎵</Text>
                  <Text style={styles.cardTitle}>Pitch Analysis</Text>
                </View>
                <Text style={styles.cardValue}>{Math.round(pitch)} Hz</Text>
                <Text style={styles.cardLevel}>{getPitchLevel(pitch)}</Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((pitch / 300) * 100, 100)}%`, backgroundColor: '#2196F3' },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Speed/Tempo Analysis */}
            {typeof speed === 'number' && !isNaN(speed) && (
              <View style={styles.analysisCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>⚡</Text>
                  <Text style={styles.cardTitle}>Speech Tempo</Text>
                </View>
                <Text style={styles.cardValue}>{speed.toFixed(1)} BPM</Text>
                <Text style={styles.cardLevel}>{getSpeedLevel(speed)}</Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((speed / 200) * 100, 100)}%`, backgroundColor: '#4CAF50' },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Emotion Interpretation */}
            <View style={styles.interpretationCard}>
              <Text style={styles.interpretationTitle}>🧠 What This Means</Text>
              <Text style={styles.interpretationText}>
                {mood === 'Happy' && '✨ Your voice shows positive energy and enthusiasm. Keep up the great mood!'}
                {mood === 'Sad' && '💙 Your voice reflects some heaviness. It\'s okay to feel this way. Remember: feelings are temporary, and you don\'t have to face them alone.'}
                {mood === 'Angry' && '🔥 Your voice shows intensity. Take a few deep breaths and find a healthy outlet.'}
                {mood === 'Anxious' && '🌊 Your voice suggests some tension. Try some breathing exercises or meditation.'}
                {mood === 'Neutral' && '⚖️ Your voice is calm and balanced. A good baseline emotional state.'}
                {mood === 'Surprised' && '⭐ Your voice shows excitement or unexpectedness. Something caught your attention!'}
                {mood === 'Uncomfortable' && '🤗 Your voice reflects some discomfort. Take time for self-care.'}
              </Text>
              
              {/* Action Button for Sad Mood */}
              {mood === 'Sad' && (
                <View style={styles.actionButtonContainer}>
                  <CustomButton
                    title="💙 Get Support & Activities"
                    onPress={() => navigation.navigate('Activities', {
                      depressionScore: 15, // Moderate sadness level
                      anxietyScore: 10,
                      stressScore: 12,
                      mood: 'Sad'
                    })}
                    style={styles.supportButton}
                  />
                  <Text style={styles.supportSubtext}>
                    Access personalized meditations, music, affirmations, and helpful tips
              </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>💡 Tips for Best Results:</Text>
          <Text style={styles.instructionText}>• Speak naturally for at least 5 seconds</Text>
          <Text style={styles.instructionText}>• Find a quiet environment</Text>
          <Text style={styles.instructionText}>• Express yourself authentically</Text>
          <Text style={styles.instructionText}>• Watch the real-time indicators</Text>
          <Text style={styles.instructionText}>• Play back your recording to review</Text>
        </View>

        {/* Technical Info */}
        {audioPath && (
          <Text style={styles.technicalNote}>
            📁 {audioPath.split('/').pop()}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#546e7a',
    textAlign: 'center',
    marginBottom: 25,
  },
  realtimeContainer: {
    backgroundColor: '#1a237e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  realtimeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  realtimeEmotionBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  realtimeEmotionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  meterContainer: {
    marginBottom: 15,
  },
  meterLabel: {
    fontSize: 14,
    color: '#b3e5fc',
    marginBottom: 8,
    fontWeight: '600',
  },
  meterBar: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 10,
  },
  meterValue: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  pitchIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
  },
  pitchLabel: {
    fontSize: 16,
    color: '#b3e5fc',
    fontWeight: '600',
  },
  pitchValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  recordButton: {
    width: '100%',
    alignItems: 'center',
  },
  mainButton: {
    paddingVertical: 16,
    borderRadius: 50,
    minWidth: 200,
  },
  startButton: {
    backgroundColor: '#2196F3',
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
  },
  playbackSection: {
    backgroundColor: '#e8eaf6',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  playbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 15,
    textAlign: 'center',
  },
  playbackControls: {
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#5c6bc0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playButtonActive: {
    backgroundColor: '#3949ab',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressTime: {
    fontSize: 14,
    color: '#3f51b5',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(63, 81, 181, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3f51b5',
    borderRadius: 3,
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    marginBottom: 20,
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1565c0',
    fontWeight: '500',
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 15,
    textAlign: 'center',
  },
  moodCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  moodEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  moodLabel: {
    fontSize: 14,
    color: '#78909c',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  moodValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emotionSubtext: {
    fontSize: 14,
    color: '#90a4ae',
    fontStyle: 'italic',
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474f',
  },
  cardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 5,
  },
  cardLevel: {
    fontSize: 16,
    color: '#546e7a',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#eceff1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  interpretationCard: {
    backgroundColor: '#f1f8e9',
    borderRadius: 15,
    padding: 20,
    marginTop: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#8bc34a',
  },
  interpretationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#558b2f',
    marginBottom: 10,
  },
  interpretationText: {
    fontSize: 15,
    color: '#689f38',
    lineHeight: 22,
    marginBottom: 10,
  },
  actionButtonContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#c5e1a5',
  },
  supportButton: {
    backgroundColor: '#5e9fd1',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#5e9fd1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  supportSubtext: {
    fontSize: 12,
    color: '#558b2f',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  instructionsContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#ef6c00',
    marginBottom: 6,
    lineHeight: 20,
  },
  technicalNote: {
    fontSize: 12,
    color: '#90a4ae',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  transcriptionBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  transcriptionLabel: {
    fontSize: 12,
    color: '#b3e5fc',
    fontWeight: '600',
    marginBottom: 5,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
  },
  transcriptionResultCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  transcriptionResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 10,
  },
  transcriptionResultText: {
    fontSize: 15,
    color: '#37474f',
    lineHeight: 22,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sentimentInfo: {
    fontSize: 12,
    color: '#78909c',
    fontStyle: 'italic',
  },
});