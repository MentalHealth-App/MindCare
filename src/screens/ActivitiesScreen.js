import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../components/CustomButton';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { BASE_URL } from '../utils/api';

// Fallback content when API fails or rate limit reached
const FALLBACK_CONTENT = {
  meditations: [
    {
      title: '5-Minute Breathing Exercise',
      url: 'https://www.youtube.com/embed/SEfs5TJZ6Nk',
    },
    {
      title: '10-Minute Guided Meditation',
      url: 'https://www.youtube.com/embed/inpok4MKVLM',
    },
    {
      title: 'Body Scan Meditation',
      url: 'https://www.youtube.com/embed/ihO02wUzgkc',
    },
  ],
  musics: [
    {
      title: 'Relaxing Piano Music',
      url: 'https://www.youtube.com/embed/lTRiuFIWV54',
    },
    {
      title: 'Calm Nature Sounds',
      url: 'https://www.youtube.com/embed/eKFTSSKCzWA',
    },
  ],
  quotes: [
    '"The greatest glory in living lies not in never falling, but in rising every time we fall." - Nelson Mandela',
    '"The way to get started is to quit talking and begin doing." - Walt Disney',
    '"Your time is limited, don\'t waste it living someone else\'s life." - Steve Jobs',
    '"If life were predictable it would cease to be life, and be without flavor." - Eleanor Roosevelt',
    '"Life is what happens when you\'re busy making other plans." - John Lennon',
  ],
  affirmations: [
    'I am worthy of love and respect',
    'I choose to be positive and happy',
    'I am capable of achieving my goals',
    'I deserve peace and tranquility',
    'I am strong, confident, and resilient',
    'Every day I am becoming a better version of myself',
  ],
  tips: [
    '🌅 Start your day with 5 minutes of deep breathing',
    '💧 Stay hydrated - drink at least 8 glasses of water',
    '🚶 Take a 15-minute walk in nature',
    '📱 Limit screen time before bed',
    '✍️ Journal your thoughts and feelings',
    '🧘 Practice mindfulness during daily activities',
    '😴 Maintain a consistent sleep schedule',
    '🤝 Connect with supportive friends or family',
  ],
};

export default function ActivitiesScreen({ route }) {
  const depression = route?.params?.depressionScore ?? 0;
  const anxiety = route?.params?.anxietyScore ?? 0;
  const stress = route?.params?.stressScore ?? 0;
  const mood = route?.params?.mood ?? 'neutral';

  const [aiReco, setAiReco] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [depression, anxiety, stress, mood]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.post(
        `${BASE_URL}/recommendations`,
        { depression, anxiety, stress, mood },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10 second timeout
        }
      );
      setAiReco(res.data);
      setUseFallback(false);
    } catch (err) {
      console.error('AI Fetch error:', err?.response?.data ?? err.message);
      const errorMessage = err?.response?.data?.error || err.message;
      setError(errorMessage);

      // Check if it's a rate limit or specific API error
      if (
        err?.response?.status === 429 ||
        errorMessage?.toLowerCase().includes('rate limit') ||
        errorMessage?.toLowerCase().includes('quota') ||
        err.code === 'ECONNABORTED'
      ) {
        setUseFallback(true);
        setAiReco(FALLBACK_CONTENT);
      } else {
        setAiReco(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalizedMessage = () => {
    if (useFallback) {
      return (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeIcon}>ℹ️</Text>
          <Text style={styles.noticeText}>
            Showing general recommendations. AI-powered personalized suggestions are temporarily unavailable.
          </Text>
        </View>
      );
    }

    if (!useFallback && aiReco) {
      let severityLevel = 'normal';
      const avgScore = (depression + anxiety + stress) / 3;
      if (avgScore > 20) severityLevel = 'high';
      else if (avgScore > 13) severityLevel = 'moderate';
      else if (avgScore > 9) severityLevel = 'mild';

      const messages = {
        high: '💙 You\'re taking a positive step by being here. These activities are specially selected to support you.',
        moderate: '🌟 These personalized recommendations can help you feel better. Take it one step at a time.',
        mild: '✨ You\'re doing well! These activities can help maintain and improve your wellbeing.',
        normal: '🎯 Great! These activities will help you maintain excellent mental health.',
      };

      return (
        <View style={[styles.noticeBox, styles.personalizedBox]}>
          <Text style={styles.personalizedText}>{messages[severityLevel]}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Personalized Activities & Recommendations</Text>

      {renderPersonalizedMessage()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d6dfa" />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      ) : !aiReco ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load Recommendations</Text>
          <Text style={styles.errorMessage}>{error || 'Please check your connection and try again.'}</Text>
          <CustomButton
            title="Retry"
            onPress={fetchRecommendations}
            style={styles.retryButton}
          />
        </View>
      ) : (
        <>
          {/* Meditation Videos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧘 Meditation & Breathing Exercises</Text>
            {aiReco.meditations?.map((link, idx) => (
              <View key={`meditation_${idx}`} style={styles.videoBox}>
                <Text style={styles.videoLabel}>{link.title}</Text>
                <WebView
                  source={{ uri: link.url }}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsFullscreenVideo
                />
              </View>
            ))}
          </View>

          {/* Music */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎵 Relaxing Music</Text>
            {aiReco.musics?.map((link, idx) => (
              <View key={`music_${idx}`} style={styles.videoBox}>
                <Text style={styles.videoLabel}>{link.title}</Text>
                <WebView
                  source={{ uri: link.url }}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsFullscreenVideo
                />
              </View>
            ))}
          </View>

          {/* Quotes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💭 Motivational Quotes</Text>
            <View style={styles.quoteContainer}>
              {aiReco.quotes?.map((q, idx) => (
                <View key={`quote_${idx}`} style={styles.quoteCard}>
                  <Text style={styles.quoteText}>{q}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Affirmations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Daily Affirmations</Text>
            <View style={styles.affirmationContainer}>
              {aiReco.affirmations?.map((a, idx) => (
                <View key={`affirmation_${idx}`} style={styles.affirmCard}>
                  <Text style={styles.affirmIcon}>💫</Text>
                  <Text style={styles.affirmText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Personalized Tips</Text>
            {aiReco.tips?.map((tip, idx) => (
              <View key={`tip_${idx}`} style={styles.tipCard}>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* External Resources */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔗 More Resources</Text>
            <CustomButton
              title="More YouTube Meditation"
              onPress={() =>
                Linking.openURL('https://www.youtube.com/results?search_query=meditation+for+mental+health')
              }
              style={styles.resourceButton}
            />
            <CustomButton
              title="More Motivation Quotes"
              onPress={() => Linking.openURL('https://www.goodreads.com/quotes/tag/motivation')}
              style={styles.resourceButton}
            />
            <CustomButton
              title="More Affirmations"
              onPress={() =>
                Linking.openURL('https://www.thegoodtrade.com/features/positive-affirmations-morning-routine/')
              }
              style={styles.resourceButton}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#044c87',
    marginVertical: 20,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  noticeBox: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff9c4',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fbc02d',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#f57f17',
    fontWeight: '500',
  },
  personalizedBox: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196F3',
  },
  personalizedText: {
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '500',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#546e7a',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 20,
    backgroundColor: '#ffebee',
    borderRadius: 15,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 30,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 15,
  },
  videoBox: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoLabel: {
    fontSize: 15,
    color: '#37474f',
    fontWeight: '600',
    marginBottom: 8,
  },
  webview: {
    height: 200,
    borderRadius: 8,
  },
  quoteContainer: {
    gap: 10,
  },
  quoteCard: {
    backgroundColor: '#f3e5f5',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0',
  },
  quoteText: {
    fontSize: 15,
    color: '#4a148c',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  affirmationContainer: {
    gap: 8,
  },
  affirmCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  affirmIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  affirmText: {
    flex: 1,
    fontSize: 15,
    color: '#1b5e20',
    fontWeight: '600',
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  tipText: {
    fontSize: 15,
    color: '#e65100',
    lineHeight: 22,
  },
  resourceButton: {
    backgroundColor: '#2196F3',
    marginVertical: 6,
  },
});