import React from 'react';
import { View } from 'react-native';
import CustomButton from '../components/CustomButton';

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <CustomButton title="Take Test" onPress={() => navigation.navigate('MentalHealthTest')} />
      <CustomButton title="History/Reports" onPress={() => navigation.navigate('History')} />
      <CustomButton title="Chatbot" onPress={() => {navigation.navigate('VoiceDetection')}} />
      <CustomButton title="Activities" onPress={() => navigation.navigate('Activities')} />
    </View>
  );
}
