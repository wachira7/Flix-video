import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage?: number;
  onPress: (id: number) => void;
}

export default function MovieCard({ id, title, posterPath, voteAverage, onPress }: Props) {
  const imageUri = posterPath
    ? `https://image.tmdb.org/t/p/w342${posterPath}`
    : null;

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(id)} activeOpacity={0.8}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.placeholder]}>
          <Text style={styles.placeholderText}>{title[0]}</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      {voteAverage !== undefined && (
        <Text style={styles.rating}>{voteAverage.toFixed(1)}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { width: 120, marginRight: 12 },
  poster: { width: 120, height: 180, borderRadius: 8, backgroundColor: '#1a1a2e' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  title: { color: '#fff', fontSize: 12, marginTop: 6, fontWeight: '500' },
  rating: { color: '#f5c518', fontSize: 11, marginTop: 2 },
});
