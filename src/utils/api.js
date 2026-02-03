import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production URLs (Deployed on Render)
const PRODUCTION_NODE_URL = 'https://mindcare-w3vj.onrender.com';
const PRODUCTION_PYTHON_URL = 'https://mindcare-audio-analyzer.onrender.com';

// Local development URLs (for testing on emulator/device)
const LOCAL_IP = '192.168.0.10'; // Change to your computer's LAN IP
const LOCAL_NODE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : `http://${LOCAL_IP}:8000`;
const LOCAL_PYTHON_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : `http://${LOCAL_IP}:5001`;

// Use production URLs (set to false for local development)
const USE_PRODUCTION = false;

export const BASE_URL = USE_PRODUCTION ? PRODUCTION_NODE_URL : LOCAL_NODE_URL;
export const AUDIO_ANALYZER_URL = USE_PRODUCTION ? PRODUCTION_PYTHON_URL : LOCAL_PYTHON_URL;

export const signUp = async (email, password) => {
  return axios.post(`${BASE_URL}/signup`, { email, password });
};

export const login = async (email, password) => {
  return axios.post(`${BASE_URL}/login`, { email, password });
};

export const resetPassword = async (email, newPassword) => {
  return axios.post(`${BASE_URL}/reset-password`, { email, newPassword });
};

// New API helper for Mental Health test history
export const saveResult = async (payload) => {
  return axios.post(`${BASE_URL}/mentalhealthresults`, payload);
};

export const fetchHistory = async (userEmail) => {
  return axios.get(`${BASE_URL}/mentalhealthresults/${userEmail}`);
};

// Voice Analysis APIs
export const analyzeAudio = async (audioFilePath) => {
  try {
    const formData = new FormData();
    
    // Prepare file object for upload
    const file = {
      uri: Platform.OS === 'android' ? `file://${audioFilePath}` : audioFilePath,
      type: 'audio/mp4',
      name: 'voice_recording.mp4',
    };
    
    formData.append('file', file);

    const response = await axios.post(`${AUDIO_ANALYZER_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds
    });

    return response;
  } catch (error) {
    console.error('Audio analysis API error:', error);
    throw error;
  }
};

// Save voice analysis to Node.js backend
export const saveVoiceAnalysis = async (payload) => {
  const token = await AsyncStorage.getItem('userToken');
  return axios.post(`${BASE_URL}/voice-analysis`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Fetch voice analysis history
export const fetchVoiceHistory = async (userEmail) => {
  const token = await AsyncStorage.getItem('userToken');
  return axios.get(`${BASE_URL}/voice-analysis/${userEmail}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Get recommendations
export const getRecommendations = async (depression, anxiety, stress, mood) => {
  const token = await AsyncStorage.getItem('userToken');
  return axios.post(`${BASE_URL}/recommendations`, 
    { depression, anxiety, stress, mood },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Stress-buddy chat (LLM via backend proxy)
export const sendStressChat = async (messages) => {
  const token = await AsyncStorage.getItem('userToken');
  return axios.post(
    `${BASE_URL}/stress-chat`,
    { messages },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};