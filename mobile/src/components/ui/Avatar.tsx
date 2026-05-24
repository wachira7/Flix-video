import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
}

export default function Avatar({ uri, name, size = 40 }: Props) {
  const radius = size / 2;
  const fontSize = size * 0.4;

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: radius }]} />;
  }

  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initial, { fontSize }]}>{name[0]?.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {},
  placeholder: { backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: 'bold' },
});
