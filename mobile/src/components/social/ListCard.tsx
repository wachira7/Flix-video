import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  listId: number;
  name: string;
  description?: string;
  itemCount: number;
  isPublic: boolean;
  onPress: (listId: number) => void;
}

export default function ListCard({ listId, name, description, itemCount, isPublic, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(listId)}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.badge}>{isPublic ? 'Public' : 'Private'}</Text>
      </View>
      {description ? <Text style={styles.description} numberOfLines={2}>{description}</Text> : null}
      <Text style={styles.count}>{itemCount} items</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  badge: { color: '#aaa', fontSize: 11, backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  description: { color: '#aaa', fontSize: 13, marginTop: 6 },
  count: { color: '#666', fontSize: 12, marginTop: 8 },
});
