import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  userId: number;
  username: string;
  avatarUrl?: string | null;
  bio?: string;
  onPress: (userId: number) => void;
}

export default function UserCard({ userId, username, avatarUrl, bio, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(userId)}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{username[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.username}>@{username}</Text>
        {bio ? <Text style={styles.bio} numberOfLines={1}>{bio}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a1a2e' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1, marginLeft: 12 },
  username: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bio: { color: '#aaa', fontSize: 13, marginTop: 2 },
});
