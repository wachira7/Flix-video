import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  username: string;
  avatarUrl?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  commentCount?: number;
}

export default function ReviewCard({ username, rating, comment, createdAt, commentCount }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>@{username}</Text>
        <Text style={styles.rating}>{'★'.repeat(Math.round(rating))} {rating}/10</Text>
      </View>
      <Text style={styles.comment}>{comment}</Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{createdAt}</Text>
        {commentCount !== undefined && (
          <Text style={styles.comments}>{commentCount} comments</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  username: { color: '#fff', fontWeight: '600', fontSize: 14 },
  rating: { color: '#f5c518', fontSize: 13 },
  comment: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  date: { color: '#666', fontSize: 12 },
  comments: { color: '#aaa', fontSize: 12 },
});
