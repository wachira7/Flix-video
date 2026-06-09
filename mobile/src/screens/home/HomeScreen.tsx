import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play, Info } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import MovieCard from '../../components/content/MovieCard';
import { colors } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { RootStackParamList } from '../../types/navigation';

const { width: W, height: H } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

interface Section {
  key: string;
  label: string;
  data: Movie[];
  isTV?: boolean;
}

async function fetchSection(path: string): Promise<Movie[]> {
  const res = await fetch(`${API_URL}${path}`);
  const json = await res.json();
  return json.results ?? [];
}

// ─── Hero Carousel (7 mixed movies + TV, auto-slides) ────────────────────────
const HERO_H = H * 0.54;
const HERO_INTERVAL = 5000;

interface HeroItem extends Movie { isTV: boolean }

const HeroSlide = React.memo(function HeroSlide({ item, onPlay, onInfo }: {
  item: HeroItem;
  onPlay: () => void;
  onInfo: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const title = item.title ?? item.name ?? '';
  const year  = (item.release_date ?? item.first_air_date ?? '').slice(0, 4);

  return (
    <View style={{ width: W, height: HERO_H }}>
      {item.backdrop_path && !imgError ? (
        <Image
          source={{ uri: `${TMDB_BACKDROP}${item.backdrop_path}` }}
          style={{ width: W, height: HERO_H }}
          onError={() => setImgError(true)}
        />
      ) : (
        <LinearGradient colors={[colors.primary, colors.accent]} style={{ width: W, height: HERO_H }} />
      )}

      <LinearGradient
        colors={['rgba(17,19,24,0.15)', 'rgba(17,19,24,0.55)', colors.background]}
        locations={[0.25, 0.65, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_H * 0.7 }}
      />

      {/* TV badge */}
      {item.isTV && (
        <View style={{
          position: 'absolute', top: 14, right: 16,
          backgroundColor: colors.primary, borderRadius: 6,
          paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>TV SERIES</Text>
        </View>
      )}

      <View style={{ position: 'absolute', bottom: 20, left: 16, right: 16 }}>
        <Text style={{
          color: colors.foreground, fontSize: 24, fontWeight: '800',
          letterSpacing: -0.5, marginBottom: 5,
          textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
        }}>
          {title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {year ? <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{year}</Text> : null}
          {year && (item.vote_average ?? 0) > 0 ? (
            <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.mutedForeground }} />
          ) : null}
          {(item.vote_average ?? 0) > 0 && (
            <View style={{ backgroundColor: colors.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                ★ {(item.vote_average ?? 0).toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={onPlay} activeOpacity={0.85} style={{ flex: 1 }}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 13, gap: 7 }}
            >
              <Play size={16} color="#fff" fill="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Play</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onInfo} activeOpacity={0.85} style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            borderRadius: 12, paddingVertical: 13, gap: 7,
            borderWidth: 1.5, borderColor: colors.border,
            backgroundColor: 'rgba(30,34,41,0.72)',
          }}>
            <Info size={16} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 15 }}>More Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

function HeroCarousel({ items, onNavigate }: {
  items: HeroItem[];
  onNavigate: (item: HeroItem) => void;
}) {
  const listRef    = useRef<FlatList>(null);
  const indexRef   = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const [activeIdx, setActiveIdx] = useState(0);

  const startAuto = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % items.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      indexRef.current = next;
      setActiveIdx(next);
    }, HERO_INTERVAL);
  }, [items.length]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(intervalRef.current);
  }, [startAuto]);

  const renderHeroItem = useCallback(({ item }: { item: HeroItem }) => (
    <HeroSlide
      item={item}
      onPlay={() => onNavigate(item)}
      onInfo={() => onNavigate(item)}
    />
  ), [onNavigate]);

  const keyExtractor = useCallback((item: HeroItem) => `hero-${item.id}-${item.isTV}`, []);

  return (
    <View style={{ height: HERO_H + 24 }}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => clearInterval(intervalRef.current)}
        onScrollEndDrag={() => startAuto()}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          indexRef.current = idx;
          setActiveIdx(idx);
        }}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
        renderItem={renderHeroItem}
      />

      {/* Dot indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 }}>
        {items.map((_, i) => (
          <View
            key={i}
            style={{
              height: 3, borderRadius: 2,
              width: i === activeIdx ? 20 : 6,
              backgroundColor: i === activeIdx ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Auto-scroll Content Row ──────────────────────────────────────────────────
const CARD_W = 120 + 12; // card width + marginRight
const SCROLL_STEP = CARD_W * 2; // advance 2 cards per tick
const SCROLL_INTERVAL = 3000; // ms between ticks

const ContentRow = React.memo(function ContentRow({ section, onPressCard }: {
  section: Section;
  onPressCard: (movie: Movie, isTV: boolean) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const userScrolling = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const resumeRef = useRef<ReturnType<typeof setTimeout>>();

  const startScroll = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (userScrolling.current || !scrollRef.current) return;
      const maxOffset = section.data.length * CARD_W;
      const next = offsetRef.current + SCROLL_STEP;
      if (next >= maxOffset - CARD_W * 3) {
        scrollRef.current.scrollTo({ x: 0, animated: true });
        offsetRef.current = 0;
      } else {
        scrollRef.current.scrollTo({ x: next, animated: true });
        offsetRef.current = next;
      }
    }, SCROLL_INTERVAL);
  }, [section.data.length]);

  useEffect(() => {
    const t = setTimeout(startScroll, 1000);
    return () => { clearTimeout(t); clearInterval(intervalRef.current); clearTimeout(resumeRef.current); };
  }, [startScroll]);

  const isTV = !!section.isTV;

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} style={{ marginBottom: 28 }}>
      <Text style={{
        color: colors.foreground, fontSize: 18, fontWeight: '700',
        marginBottom: 12, marginLeft: 16, letterSpacing: -0.3,
      }}>
        {section.label}
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        scrollEventThrottle={16}
        onScroll={(e) => { offsetRef.current = e.nativeEvent.contentOffset.x; }}
        onScrollBeginDrag={() => {
          userScrolling.current = true;
          clearInterval(intervalRef.current);
          clearTimeout(resumeRef.current);
        }}
        onScrollEndDrag={() => {
          userScrolling.current = false;
          clearTimeout(resumeRef.current);
          resumeRef.current = setTimeout(startScroll, 2000);
        }}
        onMomentumScrollEnd={(e) => {
          offsetRef.current = e.nativeEvent.contentOffset.x;
        }}
      >
        {section.data.map((item, index) => (
          <MovieCard
            key={`${section.key}-${item.id}`}
            id={item.id}
            title={item.title ?? item.name ?? ''}
            posterPath={item.poster_path}
            rating={item.vote_average}
            index={index}
            onPress={() => onPressCard(item, isTV)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
});

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ width: 140, height: 20, backgroundColor: colors.secondary, borderRadius: 6, marginLeft: 16, marginBottom: 12 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{ width: 120, height: 180, backgroundColor: colors.secondary, borderRadius: 10, marginRight: 12 }} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { token } = useAuth();

  const [sections, setSections] = useState<Section[]>([]);
  const [heroItems, setHeroItems] = useState<HeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [trending, popular, tvPopular, tvTrending] = await Promise.all([
        fetchSection('/api/movies/trending'),
        fetchSection('/api/movies/popular'),
        fetchSection('/api/tv/popular'),
        fetchSection('/api/tv/trending'),
      ]);

      // Build 7-item hero mix: 4 trending movies + 3 trending TV
      const heroMix: HeroItem[] = [
        ...trending.slice(0, 4).map(m => ({ ...m, isTV: false })),
        ...tvTrending.slice(0, 3).map(t => ({ ...t, isTV: true })),
      ];
      setHeroItems(heroMix);

      setSections([
        { key: 'trending',   label: 'Trending Now',       data: trending,   isTV: false },
        { key: 'popular',    label: 'Popular Movies',      data: popular,    isTV: false },
        { key: 'tvPopular',  label: 'Popular TV Shows',    data: tvPopular,  isTV: true  },
        { key: 'tvTrend',    label: 'Trending TV',         data: tvTrending, isTV: true  },
      ]);
      setError('');
    } catch (e: any) {
      setError('Could not load content. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCardPress = useCallback((movie: Movie, isTV: boolean) => {
    if (isTV) {
      navigation.navigate('TVDetail', { tvId: movie.id, title: movie.name ?? 'TV Show' });
    } else {
      navigation.navigate('MovieDetail', { movieId: movie.id, title: movie.title ?? 'Movie' });
    }
  }, [navigation]);

  const handleHeroNavigate = useCallback((item: HeroItem) => {
    if (item.isTV) {
      navigation.navigate('TVDetail', { tvId: item.id, title: item.name ?? 'TV Show' });
    } else {
      navigation.navigate('MovieDetail', { movieId: item.id, title: item.title ?? 'Movie' });
    }
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top bar */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <LinearGradient
          colors={['rgba(17,19,24,0.9)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 56 }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 8, padding: 5 }}
          >
            <Play size={14} color="#fff" fill="#fff" />
          </LinearGradient>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>
            Flix<Text style={{ color: colors.primary }}>Video</Text>
          </Text>
        </View>
      </View>

      {loading ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: HERO_H + 40 }}>
          {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
        </ScrollView>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.ScrollView
          entering={FadeIn.duration(400)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Hero carousel */}
          {heroItems.length > 0 && (
            <HeroCarousel items={heroItems} onNavigate={handleHeroNavigate} />
          )}

          {/* Rows */}
          <View style={{ paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
            {sections.map(section => (
              <ContentRow
                key={section.key}
                section={section}
                onPressCard={handleCardPress}
              />
            ))}
          </View>
        </Animated.ScrollView>
      )}
    </View>
  );
}
