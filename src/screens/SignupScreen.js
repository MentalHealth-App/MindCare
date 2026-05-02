import React, { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../components/CustomButton';
import { signUp } from '../utils/api';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Validation', 'All fields are required.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation', 'Please enter a valid email.');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await signUp(email, password);
      const token = await AsyncStorage.setItem('userEmail', email);
      console.log(token);
      Alert.alert('Success', res.data.message);
      navigation.replace('Login');
    } catch (err) {
      Alert.alert('Signup Error', err.response?.data?.error || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Create your account</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
        editable={!loading}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        editable={!loading}
      />
      <TextInput
        placeholder="Confirm Password"
        style={styles.input}
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
        editable={!loading}
      />

      <CustomButton
        title="Sign Up"
        onPress={handleSignup}
        loading={loading}
      />

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.switchText}>
          Already have an account? <Text style={styles.linkText}>Login</Text>
        </Text>
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
});
