import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import CustomButton from '../components/CustomButton';
import { resetPassword } from '../utils/api';

export default function ResetPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = async () => {
    if (!email || !newPassword) {
      Alert.alert('Validation', 'Email and new password are required.');
      return;
    }
    try {
      const res = await resetPassword(email, newPassword);
      Alert.alert('Success', res.data.message, [
        { text: 'Login', onPress: () => navigation.navigate('Signup') }
      ]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Unknown error';
      if (msg.includes('User not found')) {
        Alert.alert('User not found', 'Please create an account.', [
          { text: 'Create Account', onPress: () => navigation.navigate('Signup') }
        ]);
      } else {
        Alert.alert('Reset Password Error', msg);
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderBottomWidth: 1, marginBottom: 16 }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="New Password"
        value={newPassword}
        secureTextEntry
        onChangeText={setNewPassword}
        style={{ borderBottomWidth: 1, marginBottom: 16 }}
      />
      <CustomButton title="Reset Password" onPress={handleResetPassword} style={{ backgroundColor: '#5599ff' }} />
    </View>
  );
}
