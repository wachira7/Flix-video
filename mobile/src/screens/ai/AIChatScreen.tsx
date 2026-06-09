import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Send, Sparkles, Bot } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../theme/colors';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'Recommend me a thriller like Inception',
  'Best sci-fi TV shows of 2024?',
  'Movies similar to The Dark Knight',
  'Top-rated anime series to watch',
];

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => genId());
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/ai/status`)
      .then(r => r.json())
      .then(d => setAiAvailable((d.ai_providers?.available_count ?? 0) > 0))
      .catch(() => setAiAvailable(false));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: trimmed, session_id: sessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to get a response');
      }

      const aiMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }

    setSending(false);
  }, [sending, token, sessionId]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    return (
      <Animated.View
        entering={FadeInDown.duration(300).delay(index === 0 ? 0 : 0)}
        style={{
          flexDirection: 'row',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        {!isUser && (
          <View style={{
            width: 30, height: 30, borderRadius: 15,
            backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
            marginRight: 8, marginTop: 2,
          }}>
            <Bot size={14} color="#fff" />
          </View>
        )}
        <View style={{
          maxWidth: '75%',
          backgroundColor: isUser ? colors.primary : colors.card,
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}>
          <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>
            {item.content}
          </Text>
        </View>
      </Animated.View>
    );
  }, []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 10, paddingBottom: 14,
        paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: colors.secondary, borderRadius: 20, padding: 8 }}
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>
            AI Assistant
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {aiAvailable === null ? 'Checking...' : aiAvailable ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={{
          backgroundColor: aiAvailable ? 'rgba(34,197,94,0.15)' : colors.secondary,
          borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
        }}>
          <Sparkles size={14} color={aiAvailable ? '#22C55E' : colors.mutedForeground} />
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: 'rgba(147,51,234,0.15)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              }}>
                <Sparkles size={28} color={colors.primary} />
              </View>
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>
                Ask me anything
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: 'center', marginTop: 6 }}>
                Get personalised movie and TV recommendations, discover new content, and more.
              </Text>
            </View>

            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
              Suggestions
            </Text>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => sendMessage(s)}
                style={{
                  backgroundColor: colors.card, borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 12,
                  marginBottom: 8, borderWidth: 1, borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 14 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      />

      {/* Typing indicator */}
      {sending && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}>
          <View style={{
            width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={14} color="#fff" />
          </View>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          </View>
        </View>
      )}

      {/* Input */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        paddingHorizontal: 16, paddingTop: 10,
        paddingBottom: insets.bottom + 10,
        borderTopWidth: 1, borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about movies or TV shows..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={500}
          style={{
            flex: 1, backgroundColor: colors.card, borderRadius: 20,
            paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
            color: colors.foreground, fontSize: 14,
            maxHeight: 100, borderWidth: 1, borderColor: colors.border,
          }}
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || sending || aiAvailable === false}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: input.trim() && !sending && aiAvailable !== false
              ? colors.primary : colors.secondary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={18} color={input.trim() && !sending ? '#fff' : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
