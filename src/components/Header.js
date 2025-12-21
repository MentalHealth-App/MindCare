import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Header({ title }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#85c2ff' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#114488' }
});
