import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  duration: number;
  onPlayPause: () => void;
  onMute: () => void;
  onSeek: (time: number) => void;
}

export default function PlayerControls({ isPlaying, isMuted, onPlayPause, onMute }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onMute} style={styles.button}>
        <Text style={styles.icon}>{isMuted ? '🔇' : '🔊'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
  button: { padding: 12 },
  icon: { fontSize: 20 },
  playButton: { padding: 16, marginHorizontal: 24 },
  playIcon: { fontSize: 32 },
});
