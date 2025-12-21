import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
import MentalHealthTestScreen from "./src/screens/MentalHealthTestScreen";
import VoiceDetectionScreen from "./src/screens/VoiceDetectionScreen";
import ResultAnalysisScreen from "./src/screens/ResultAnalysisScreen";
import ActivitiesScreen from "./src/screens/ActivitiesScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import { COLORS } from "./src/components/theme";

const Stack = createStackNavigator();
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTitleStyle: { color: "#fff", fontFamily: "Inter_700Bold" },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="MentalHealthTest" component={MentalHealthTestScreen} />
        <Stack.Screen name="VoiceDetection" component={VoiceDetectionScreen} />
        <Stack.Screen name="ResultAnalysis" component={ResultAnalysisScreen} />
        <Stack.Screen name="Activities" component={ActivitiesScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
