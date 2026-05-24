import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  partyId: string;
  title: string;
  hostUsername: string;
  participantCount: number;
  status: 'active' | 'ended';
  onJoin: (partyId: string) => void;
}

export default function PartyCard({ partyId, title, hostUsername, participantCount, status, onJoin }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.host}>Hosted by @{hostUsername}</Text>
        <Text style={styles.count}>{participantCount} watching</Text>
      </View>
      {status === 'active' && (
        <TouchableOpacity style={styles.joinButton} onPress={() => onJoin(partyId)}>
          <Text style={styles.joinText}>Join</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12 },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  host: { color: '#aaa', fontSize: 13, marginTop: 4 },
  count: { color: '#666', fontSize: 12, marginTop: 2 },
  joinButton: { backgroundColor: '#e50914', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  joinText: { color: '#fff', fontWeight: '600' },
});
