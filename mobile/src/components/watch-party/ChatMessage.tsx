import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  username: string;
  message: string;
  isOwn: boolean;
  timestamp?: string;
}

export default function ChatMessage({ username, message, isOwn, timestamp }: Props) {
  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      {!isOwn && <Text style={styles.username}>@{username}</Text>}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={styles.message}>{message}</Text>
      </View>
      {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4, maxWidth: '75%', alignSelf: 'flex-start' },
  ownContainer: { alignSelf: 'flex-end' },
  username: { color: '#aaa', fontSize: 11, marginBottom: 2, marginLeft: 8 },
  bubble: { padding: 10, borderRadius: 14 },
  ownBubble: { backgroundColor: '#e50914', borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: '#2a2a3e', borderBottomLeftRadius: 2 },
  message: { color: '#fff', fontSize: 14 },
  timestamp: { color: '#555', fontSize: 10, marginTop: 2 },
});
