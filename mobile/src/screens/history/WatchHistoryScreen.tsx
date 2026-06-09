import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Trash2, Clock, Film, Tv } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { RootStackParamList } from '../../types/navigation';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w185';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface HistoryItem {
  contentId: string;
  contentType: 'movie' | 'tv';
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
  // enriched
  title?: string;
  poster_path?: string | null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function progressPercent(item: HistoryItem) {
  if (!item.durationSeconds || item.durationSeconds === 0) return 0;
  return Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100));
}

export default function WatchHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { token } = useAuth();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/watch-history?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const raw: HistoryItem[] = data.history ?? [];

      // Enrich with poster/title
      const enriched = await Promise.all(
        raw.map(async (item) => {
          try {
            const endpoint = item.contentType === 'movie'
              ? `/api/movies/${item.contentId}`
              : `/api/tv/${item.contentId}`;
            const dr = await fetch(`${API_URL}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const detail = await dr.json();
            const d = detail.movie ?? detail.tv_show ?? detail;
            return {
              ...item,
              title: d.title ?? d.name ?? '',
              poster_path: d.poster_path ?? null,
            };
          } catch {
            return item;
          }
        })
      );
      setItems(enriched);
    } catch {}
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistory().finally(() => setLoading(false));
    }, [loadHistory])
  );

  const removeItem = useCallback((item: HistoryItem) => {
    Alert.alert('Remove', `Remove "${item.title || 'this item'}" from history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/users/watch-history/${item.contentType}/${item.contentId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setItems(prev => prev.filter(
              i => !(i.contentId === item.contentId && i.contentType === item.contentType)
            ));
          } catch {
            Alert.alert('Error', 'Could not remove item.');
          }
        },
      },
    ]);
  }, [token]);

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    Alert.alert('Clear History', 'Delete your entire watch history? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/users/watch-history`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setItems([]);
          } catch {
            Alert.alert('Error', 'Could not clear history.');
          }
        },
      },
    ]);
  }, [items.length, token]);

  const handlePress = useCallback((item: HistoryItem) => {
    if (item.contentType === 'movie') {
      navigation.navigate('MovieDetail', { movieId: Number(item.contentId), title: item.title ?? 'Movie' });
    } else {
      navigation.navigate('TVDetail', { tvId: Number(item.contentId), title: item.title ?? 'TV Show' });
    }
  }, [navigation]);

  const renderItem = useCallback(({ item, index }: { item: HistoryItem; index: number }) => {
    const pct = progressPercent(item);
    const TypeIcon = item.contentType === 'movie' ? Film : Tv;
    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 40)}>
        <TouchableOpacity
          onPress={() => handlePress(item)}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}
        >
          {/* Poster */}
          <View style={{ width: 52, height: 76, borderRadius: 8, overflow: 'hidden', marginRight: 14, backgroundColor: colors.secondary }}>
            {item.poster_path ? (
              <Image source={{ uri: `${TMDB_POSTER}${item.poster_path}` }} style={{ width: 52, height: 76 }} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <TypeIcon size={20} color={colors.mutedForeground} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
              {item.title || `${item.contentType === 'movie' ? 'Movie' : 'Show'} #${item.contentId}`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TypeIcon size={12} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                {item.contentType === 'movie' ? 'Movie' : 'TV Show'}
              </Text>
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border }} />
              <Clock size={12} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{formatDate(item.updatedAt)}</Text>
            </View>
            {/* Progress bar */}
            <View style={{ height: 3, backgroundColor: colors.secondary, borderRadius: 2 }}>
              <View style={{
                height: 3, borderRadius: 2,
                width: `${pct}%` as any,
                backgroundColor: item.completed ? '#22C55E' : colors.primary,
              }} />
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 3 }}>
              {item.completed ? 'Completed' : `${pct}% watched`}
            </Text>
          </View>

          {/* Delete */}
          <TouchableOpacity
            onPress={() => removeItem(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginLeft: 10, padding: 4 }}
          >
            <Trash2 size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handlePress, removeItem]);

  const keyExtractor = useCallback((item: HistoryItem) => `${item.contentType}-${item.contentId}`, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={{
        paddingTop: insets.top + 10, paddingBottom: 14,
        paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: colors.secondary, borderRadius: 20, padding: 8 }}
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, flex: 1 }}>
          Watch History
        </Text>
        {items.length > 0 && (
          <TouchableOpacity
            onPress={clearAll}
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: colors.destructive, fontSize: 13, fontWeight: '600' }}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={items.length === 0 ? { flex: 1 } : { paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Clock size={48} color={colors.border} />
              <Text style={{ color: colors.mutedForeground, fontSize: 16, fontWeight: '600' }}>No watch history</Text>
              <Text style={{ color: colors.border, fontSize: 14 }}>Content you watch will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
