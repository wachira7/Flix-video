import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Keyboard, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, X, Film, Tv } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import MovieCard from '../../components/content/MovieCard';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../types/navigation';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const CARD_W = (Dimensions.get('window').width - 52) / 3;
type NavProp = NativeStackNavigationProp<RootStackParamList>;
type MediaType = 'movie' | 'tv';

interface Result {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  media_type?: MediaType;
}

const TABS: { key: MediaType; label: string; icon: any }[] = [
  { key: 'movie', label: 'Movies', icon: Film },
  { key: 'tv',    label: 'TV Shows', icon: Tv },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<MediaType>('movie');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = tab === 'movie'
          ? `/api/search/movies?query=${encodeURIComponent(query)}`
          : `/api/search/tv?query=${encodeURIComponent(query)}`;
        const res = await fetch(`${API_URL}${endpoint}`);
        const data = await res.json();
        setResults((data.results ?? []).slice(0, 30));
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, tab]);

  const clearSearch = useCallback(() => { setQuery(''); setResults([]); setSearched(false); }, []);

  const handlePress = useCallback((item: Result) => {
    Keyboard.dismiss();
    if (tab === 'movie') {
      navigation.navigate('MovieDetail', { movieId: item.id, title: item.title ?? 'Movie' });
    } else {
      navigation.navigate('TVDetail', { tvId: item.id, title: item.name ?? 'TV Show' });
    }
  }, [tab, navigation]);

  const keyExtractor = useCallback((item: Result) => String(item.id), []);

  const renderItem = useCallback(({ item, index }: { item: Result; index: number }) => (
    <MovieCard
      id={item.id}
      title={item.title ?? item.name ?? ''}
      posterPath={item.poster_path}
      rating={item.vote_average}
      cardWidth={CARD_W}
      cardHeight={160}
      index={index}
      onPress={() => handlePress(item)}
    />
  ), [handlePress]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: '800', marginBottom: 14, letterSpacing: -0.5 }}>
          Search
        </Text>

        {/* Search input */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.secondary, borderRadius: 14,
          paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border,
        }}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Movies, TV shows..."
            placeholderTextColor={colors.mutedForeground}
            style={{ flex: 1, color: colors.foreground, fontSize: 15, paddingVertical: 13, marginLeft: 10 }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {TABS.map(t => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: active ? colors.primary : colors.secondary,
                  borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Icon size={14} color={active ? '#fff' : colors.mutedForeground} />
                <Text style={{ color: active ? '#fff' : colors.mutedForeground, fontWeight: '600', fontSize: 13 }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !query.trim() ? (
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
          <Search size={56} color={colors.border} />
          <Text style={{ color: colors.mutedForeground, fontSize: 16, marginTop: 16, fontWeight: '600' }}>
            Find your next watch
          </Text>
          <Text style={{ color: colors.border, fontSize: 14, marginTop: 6 }}>
            Search movies and TV shows
          </Text>
        </Animated.View>
      ) : results.length === 0 && searched ? (
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 16, fontWeight: '600' }}>
            No results for "{query}"
          </Text>
          <Text style={{ color: colors.border, fontSize: 14, marginTop: 6 }}>
            Try a different search term
          </Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.duration(300)} style={{ flex: 1 }}>
          <FlatList
            data={results}
            keyExtractor={keyExtractor}
            numColumns={3}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
            columnWrapperStyle={{ gap: 10, marginBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            renderItem={renderItem}
          />
        </Animated.View>
      )}
    </View>
  );
}
