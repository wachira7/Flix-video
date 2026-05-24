import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface Comment {
  id: number;
  username: string;
  comment: string;
  createdAt: string;
  replies?: Comment[];
}

interface Props {
  comments: Comment[];
}

function CommentItem({ item, depth = 0 }: { item: Comment; depth?: number }) {
  return (
    <View style={[styles.comment, { marginLeft: depth * 16 }]}>
      <Text style={styles.username}>@{item.username}</Text>
      <Text style={styles.text}>{item.comment}</Text>
      <Text style={styles.date}>{item.createdAt}</Text>
      {item.replies?.map((reply) => (
        <CommentItem key={reply.id} item={reply} depth={depth + 1} />
      ))}
    </View>
  );
}

export default function CommentThread({ comments }: Props) {
  return (
    <FlatList
      data={comments}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <CommentItem item={item} />}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  comment: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  username: { color: '#fff', fontWeight: '600', fontSize: 13 },
  text: { color: '#ccc', fontSize: 14, marginTop: 4 },
  date: { color: '#666', fontSize: 11, marginTop: 4 },
});
