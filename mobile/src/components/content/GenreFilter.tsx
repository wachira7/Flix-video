import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Genre {
  id: number;
  name: string;
}

interface Props {
  genres: Genre[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function GenreFilter({ genres, selectedId, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={[styles.chip, selectedId === null && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.label, selectedId === null && styles.labelActive]}>All</Text>
      </TouchableOpacity>
      {genres.map((genre) => (
        <TouchableOpacity
          key={genre.id}
          style={[styles.chip, selectedId === genre.id && styles.chipActive]}
          onPress={() => onSelect(genre.id)}
        >
          <Text style={[styles.label, selectedId === genre.id && styles.labelActive]}>{genre.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#333' },
  chipActive: { backgroundColor: '#e50914', borderColor: '#e50914' },
  label: { color: '#aaa', fontSize: 13, fontWeight: '500' },
  labelActive: { color: '#fff' },
});
