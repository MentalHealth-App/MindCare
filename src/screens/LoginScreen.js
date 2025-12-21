import React, { useState, useEffect } from 'react';
import {
  View, TextInput, Text, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../components/CustomButton';
import { login } from '../utils/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Session login: Check if already logged in
    AsyncStorage.getItem('userToken').then(token => {
      if (token) {
        navigation.replace('Home');
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password required!');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      // Store session (token) from backend if available
      if (res.data.token) {
        await AsyncStorage.setItem('userToken', res.data.token);
      } else {
        await AsyncStorage.setItem('userToken', 'loggedin');
      }
      Alert.alert('Success', res.data.message);
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Login Error', err.response?.data?.error || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Login to Mind Care</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
        textContentType="emailAddress"
        editable={!loading}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        editable={!loading}
      />

      <CustomButton
        title="Login"
        onPress={handleLogin}
        loading={loading}
      />

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.switchText}>
          Don't have an account? <Text style={styles.linkText}>Sign Up</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
        <Text style={styles.resetText}>Forgot Password?</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#eafaff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1864ab',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#a2d2ff',
    marginBottom: 18,
    fontSize: 17,
    paddingVertical: 10,
    color: '#2471a3',
  },
  switchText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 17,
    color: '#555',
  },
  linkText: {
    fontWeight: 'bold',
    color: '#3897f0',
  },
  resetText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#1864ab',
    fontWeight: '600',
  }
});
