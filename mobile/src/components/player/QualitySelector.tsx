import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

type Quality = 'auto' | '1080p' | '720p' | '480p' | '360p';

interface Props {
  selected: Quality;
  onSelect: (quality: Quality) => void;
}

const OPTIONS: Quality[] = ['auto', '1080p', '720p', '480p', '360p'];

export default function QualitySelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((q) => (
        <TouchableOpacity
          key={q}
          style={[styles.option, selected === q && styles.optionActive]}
          onPress={() => onSelect(q)}
        >
          <Text style={[styles.label, selected === q && styles.labelActive]}>{q}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  option: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#333' },
  optionActive: { backgroundColor: '#e50914' },
  label: { color: '#aaa', fontSize: 13 },
  labelActive: { color: '#fff', fontWeight: '600' },
});
