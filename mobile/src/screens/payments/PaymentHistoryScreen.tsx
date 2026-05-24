import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PaymentHistoryScreen() {
  return (
    <View style={styles.container}>
      <Text>Payment History</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
