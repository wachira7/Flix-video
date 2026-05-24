import React from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface Props {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({ conversations, onSelect, onDelete }: Props) {
  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => onSelect(item.id)}>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.date}>{item.updatedAt}</Text>
          </View>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.delete}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '500' },
  date: { color: '#666', fontSize: 12, marginTop: 2 },
  delete: { padding: 8 },
  deleteText: { color: '#666', fontSize: 16 },
});
