import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { sendStressChat } from '../utils/api';
import { COLORS } from '../components/theme';
import { clearAuthData } from '../utils/auth';

const initialBotMessage =
  "Hi, I'm your Stress Buddy. Tell me how you're feeling, and I'll share a short, calm tip to help you regroup.";

export default function StressChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: 'bot-0', role: 'assistant', content: initialBotMessage },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const canSend = input.trim().length > 0 && !loading;

  const scrollToEnd = () => {
    if (listRef.current) {
      listRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    const userMessage = input.trim();
    const newMessages = [
      ...messages,
      { id: `user-${Date.now()}`, role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setInput('');
    scrollToEnd();

    try {
      setLoading(true);
      const resp = await sendStressChat(
        newMessages.map(({ role, content }) => ({ role, content }))
      );
      const reply = resp?.data?.reply || "I'm here with you. Let's breathe together.";
      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, role: 'assistant', content: reply },
      ]);
      setTimeout(scrollToEnd, 100);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 401) {
        await clearAuthData();
        Alert.alert('Session Expired', 'Please log in again.');
        navigation.replace('Login');
        return;
      }
      console.warn('Stress chat error:', err?.message || err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content:
            "I hit a snag replying, but I'm still here. Let's try 4-4-6 breathing: inhale 4, hold 4, exhale 6.",
        },
      ]);
      setTimeout(scrollToEnd, 100);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text style={[styles.text, isUser ? styles.userText : styles.botText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToEnd}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type how you're feeling..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.disabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: { flex: 1 },
  listContent: {
    padding: 16,
  },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#E8ECF2',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: { color: '#fff' },
  botText: { color: '#111' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#d7d7d7',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    borderRadius: 10,
    marginRight: 10,
    minHeight: 44,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  disabled: {
    opacity: 0.5,
  },
  sendText: { color: '#fff', fontWeight: '600' },
});



