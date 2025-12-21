import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import CustomButton from '../components/CustomButton';
import { isLoggedIn } from '../utils/auth';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  useEffect(() => {
    isLoggedIn().then(loggedIn => {
      if (loggedIn) {
        navigation.replace('Home');
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Mind Care</Text>
      <Text style={styles.subtitle}>Your personal mental wellness app</Text>

      <CustomButton
        title="Login"
        onPress={() => navigation.navigate('Login')}
        style={styles.loginButton}
      />
      <CustomButton
        title="Sign Up"
        onPress={() => navigation.navigate('Signup')}
        style={styles.signupButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f0ff',
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1864ab',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 18,
    color: '#448ad4',
    marginBottom: 40,
    fontWeight: '500',
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#1864ab',
    borderRadius: 30,
    paddingVertical: 16,
    elevation: 5,
    shadowColor: '#1864ab',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  signupButton: {
    width: '100%',
    backgroundColor: '#114480',
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#1864ab',
  },
});
