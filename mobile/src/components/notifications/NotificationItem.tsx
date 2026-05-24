import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  onPress: (id: number) => void;
}

export default function NotificationItem({ id, title, message, read, createdAt, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.container, !read && styles.unread]} onPress={() => onPress(id)}>
      {!read && <View style={styles.dot} />}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
        <Text style={styles.date}>{createdAt}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  unread: { backgroundColor: '#0d0d1a' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e50914', marginTop: 6, marginRight: 10 },
  content: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600' },
  message: { color: '#aaa', fontSize: 13, marginTop: 4 },
  date: { color: '#555', fontSize: 11, marginTop: 6 },
});
