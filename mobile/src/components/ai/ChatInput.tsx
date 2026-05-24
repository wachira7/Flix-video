import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Ask me anything..."
        placeholderTextColor="#666"
        multiline
        maxLength={1000}
        editable={!disabled}
      />
      <TouchableOpacity style={[styles.sendButton, disabled && styles.disabled]} onPress={handleSend} disabled={disabled}>
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#222' },
  input: { flex: 1, color: '#fff', backgroundColor: '#1a1a2e', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120, fontSize: 15 },
  sendButton: { marginLeft: 8, backgroundColor: '#e50914', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  disabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '600' },
});
