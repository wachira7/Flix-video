import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  rating: number;
  maxRating?: number;
  onRate?: (rating: number) => void;
  size?: number;
}

export default function StarRating({ rating, maxRating = 10, onRate, size = 24 }: Props) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate?.(star)} disabled={!onRate}>
          <Text style={[styles.star, { fontSize: size }]}>{star <= rating ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row' },
  star: { color: '#f5c518', marginRight: 2 },
});
