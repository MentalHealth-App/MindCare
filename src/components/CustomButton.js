import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONTS } from "./theme";

export default function CustomButton({ title, onPress, style, loading, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style, (disabled || loading) && styles.disabled]}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={styles.title}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.button,
    paddingVertical: 17,
    borderRadius: 12,
    marginVertical: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.button,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  disabled: {
    backgroundColor: COLORS.buttonDisabled,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.15,
    fontFamily: FONTS.bold,
  },
});
