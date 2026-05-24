import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MovieDetailScreen() {
  return (
    <View style={styles.container}>
      <Text>Movie Detail</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
