import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_IP = '192.168.0.10'; // Change to your computer's LAN IP
// const LOCAL_IP = '192.168.0.11"; // Alternative IP for different network setup

export const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : `http://${LOCAL_IP}:8000`;

// Python Flask server for audio analysis
export const AUDIO_ANALYZER_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001'
    : `http://${LOCAL_IP}:5001`;

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