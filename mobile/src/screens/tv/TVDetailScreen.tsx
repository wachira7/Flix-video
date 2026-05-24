import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TVDetailScreen() {
  return (
    <View style={styles.container}>
      <Text>TV Detail</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
