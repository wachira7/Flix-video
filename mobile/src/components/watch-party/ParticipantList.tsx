import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface Participant {
  userId: number;
  username: string;
  avatarUrl?: string | null;
}

interface Props {
  participants: Participant[];
}

export default function ParticipantList({ participants }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {participants.map((p) => (
        <View key={p.userId} style={styles.item}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{p.username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{p.username}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  item: { alignItems: 'center', width: 52 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  name: { color: '#aaa', fontSize: 11, marginTop: 4 },
});
