import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  count: number;
}

export default function NotificationBadge({ count }: Props) {
  if (count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#e50914', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  text: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
