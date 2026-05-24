import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SubscriptionPlansScreen() {
  return (
    <View style={styles.container}>
      <Text>Subscription Plans</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
