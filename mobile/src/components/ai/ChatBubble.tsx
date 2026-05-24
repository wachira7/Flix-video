import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export default function ChatBubble({ message, isUser, timestamp }: Props) {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.message}>{message}</Text>
      </View>
      {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4, maxWidth: '80%' },
  userContainer: { alignSelf: 'flex-end' },
  aiContainer: { alignSelf: 'flex-start' },
  bubble: { padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: '#e50914', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#1a1a2e', borderBottomLeftRadius: 4 },
  message: { color: '#fff', fontSize: 14, lineHeight: 20 },
  timestamp: { color: '#666', fontSize: 11, marginTop: 4 },
});
