import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  isFollowing: boolean;
  onPress: () => void;
  loading?: boolean;
}

export default function FollowButton({ isFollowing, onPress, loading }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, isFollowing ? styles.following : styles.follow]}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={[styles.label, isFollowing && styles.labelFollowing]}>
        {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  follow: { backgroundColor: '#e50914', borderColor: '#e50914' },
  following: { backgroundColor: 'transparent', borderColor: '#666' },
  label: { color: '#fff', fontWeight: '600', fontSize: 14 },
  labelFollowing: { color: '#aaa' },
});
