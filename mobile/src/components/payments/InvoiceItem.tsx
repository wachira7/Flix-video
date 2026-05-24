import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  createdAt: string;
  onView?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
};

export default function InvoiceItem({ invoiceNumber, amount, currency, status, createdAt, onView }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.number}>{invoiceNumber}</Text>
        <Text style={styles.date}>{createdAt}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{currency} {amount.toFixed(2)}</Text>
        <Text style={[styles.status, { color: STATUS_COLORS[status] }]}>{status}</Text>
      </View>
      {onView && (
        <TouchableOpacity onPress={onView} style={styles.viewButton}>
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222' },
  info: { flex: 1 },
  number: { color: '#fff', fontSize: 14, fontWeight: '500' },
  date: { color: '#666', fontSize: 12, marginTop: 2 },
  right: { alignItems: 'flex-end', marginRight: 12 },
  amount: { color: '#fff', fontSize: 14, fontWeight: '600' },
  status: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  viewButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#444' },
  viewText: { color: '#aaa', fontSize: 13 },
});
