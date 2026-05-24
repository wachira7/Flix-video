import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FollowersScreen() {
  return (
    <View style={styles.container}>
      <Text>Followers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
