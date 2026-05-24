import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  planId: number;
  name: string;
  price: number;
  billingInterval: 'month' | 'year';
  features: string[];
  isCurrentPlan?: boolean;
  onSelect: (planId: number) => void;
}

export default function PlanCard({ planId, name, price, billingInterval, features, isCurrentPlan, onSelect }: Props) {
  return (
    <View style={[styles.container, isCurrentPlan && styles.active]}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.price}>
        ${price}<Text style={styles.interval}>/{billingInterval}</Text>
      </Text>
      <View style={styles.features}>
        {features.map((f, i) => (
          <Text key={i} style={styles.feature}>✓ {f}</Text>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.button, isCurrentPlan && styles.currentButton]}
        onPress={() => onSelect(planId)}
        disabled={isCurrentPlan}
      >
        <Text style={styles.buttonText}>{isCurrentPlan ? 'Current Plan' : 'Select'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  active: { borderColor: '#e50914' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  price: { color: '#e50914', fontSize: 28, fontWeight: '800', marginBottom: 16 },
  interval: { color: '#aaa', fontSize: 14, fontWeight: '400' },
  features: { marginBottom: 20 },
  feature: { color: '#ccc', fontSize: 14, marginBottom: 6 },
  button: { backgroundColor: '#e50914', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  currentButton: { backgroundColor: '#333' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
