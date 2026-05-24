import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Method = 'stripe' | 'mpesa' | 'crypto';

interface Props {
  selected: Method;
  onSelect: (method: Method) => void;
}

const METHODS: { id: Method; label: string; icon: string }[] = [
  { id: 'stripe', label: 'Card / Stripe', icon: '💳' },
  { id: 'mpesa', label: 'M-Pesa', icon: '📱' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
];

export default function PaymentMethod({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {METHODS.map((m) => (
        <TouchableOpacity
          key={m.id}
          style={[styles.option, selected === m.id && styles.optionActive]}
          onPress={() => onSelect(m.id)}
        >
          <Text style={styles.icon}>{m.icon}</Text>
          <Text style={[styles.label, selected === m.id && styles.labelActive]}>{m.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333', backgroundColor: '#1a1a2e' },
  optionActive: { borderColor: '#e50914' },
  icon: { fontSize: 22, marginRight: 12 },
  label: { color: '#aaa', fontSize: 16 },
  labelActive: { color: '#fff', fontWeight: '600' },
});
