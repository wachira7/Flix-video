import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart, Film, Tv } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import MovieCard from '../../components/content/MovieCard';
import { colors } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { RootStackParamList } from '../../types/navigation';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const CARD_W = 110;

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type FilterType = 'all' | 'movie' | 'tv';

interface WatchlistItem {
  id: number;
  content_type: 'movie' | 'tv_show';
  content_id: number;
  added_at: string;
  title?: string;
  poster_path?: string | null;
  vote_average?: number;
}

const FILTERS: { key: FilterType; label: string; icon: any }[] = [
  { key: 'all',   label: 'All',      icon: Heart },
  { key: 'movie', label: 'Movies',   icon: Film  },
  { key: 'tv',    label: 'TV Shows', icon: Tv    },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { token } = useAuth();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadWatchlist = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/watchlist?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const raw: WatchlistItem[] = data.watchlist ?? [];

      const enriched = await Promise.all(
        raw.map(async (item) => {
          try {
            const isTV = item.content_type === 'tv_show';
            const endpoint = isTV
              ? `${API_URL}/api/tv/${item.content_id}`
              : `${API_URL}/api/movies/${item.content_id}`;
            const detailRes = await fetch(endpoint);
            const detail = await detailRes.json();
            // Backend wraps: { movie: {...} } or { tv_show: {...} }
            const d = detail.movie ?? detail.tv_show ?? detail;
            return {
              ...item,
              title: d.title ?? d.name ?? '',
              poster_path: d.poster_path ?? null,
              vote_average: d.vote_average ?? 0,
            };
          } catch {
            return item;
          }
        })
      );
      setItems(enriched);
    } catch {}
    setLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWatchlist();
    }, [loadWatchlist])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWatchlist();
    setRefreshing(false);
  }, [loadWatchlist]);

  const handlePress = useCallback((item: WatchlistItem) => {
    if (item.content_type === 'tv_show') {
      navigation.navigate('TVDetail', { tvId: item.content_id, title: item.title ?? 'TV Show' });
    } else {
      navigation.navigate('MovieDetail', { movieId: item.content_id, title: item.title ?? 'Movie' });
    }
  }, [navigation]);

  const filtered = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'movie') return item.content_type === 'movie';
    return item.content_type === 'tv_show';
  });

  const renderItem = useCallback(({ item, index }: { item: WatchlistItem; index: number }) => (
    <MovieCard
      id={item.content_id}
      title={item.title ?? ''}
      posterPath={item.poster_path ?? null}
      rating={item.vote_average}
      cardWidth={CARD_W}
      cardHeight={165}
      index={index}
      onPress={() => handlePress(item)}
    />
  ), [handlePress]);

  const keyExtractor = useCallback(
    (item: WatchlistItem) => `${item.content_type}-${item.content_id}`,
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 14 }}>
          My List
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            const Icon = f.icon;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: active ? colors.primary : colors.secondary,
                  borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Icon size={14} color={active ? '#fff' : colors.mutedForeground} />
                <Text style={{ color: active ? '#fff' : colors.mutedForeground, fontWeight: '600', fontSize: 13 }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !token ? (
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
          <Heart size={56} color={colors.border} />
          <Text style={{ color: colors.mutedForeground, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
            Sign in to see your list
          </Text>
        </Animated.View>
      ) : filtered.length === 0 ? (
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
          <Heart size={56} color={colors.border} />
          <Text style={{ color: colors.mutedForeground, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
            {filter === 'all' ? 'Your list is empty' : `No ${filter === 'movie' ? 'movies' : 'TV shows'} saved`}
          </Text>
          <Text style={{ color: colors.border, fontSize: 14, marginTop: 6 }}>
            Tap the heart on any movie or show to save it
          </Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.duration(300)} style={{ flex: 1 }}>
          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            numColumns={3}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
            columnWrapperStyle={{ gap: 10, marginBottom: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={renderItem}
          />
        </Animated.View>
      )}
    </View>
  );
}
