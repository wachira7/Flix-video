import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreatePartyScreen() {
  return (
    <View style={styles.container}>
      <Text>Create Party</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
