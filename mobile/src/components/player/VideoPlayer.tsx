import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  uri: string;
  isPlaying: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnd?: () => void;
}

export default function VideoPlayer({ uri, isPlaying, onProgress, onEnd }: Props) {
  return (
    <View style={styles.container} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
