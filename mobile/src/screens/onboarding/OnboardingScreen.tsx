import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Play, Heart, Search, Zap, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../types/navigation';

const { width: W, height: H } = Dimensions.get('window');
export const ONBOARDING_KEY = 'flixvideo_onboarding_done';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface Slide {
  key: string;
  icon: any;
  iconBg: [string, string];
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    key: 'discover',
    icon: Zap,
    iconBg: ['#9333EA', '#DB2777'],
    title: 'Discover What\'s\nTrending',
    subtitle: 'Browse thousands of movies and TV shows. Stay on top of what everyone is watching right now.',
  },
  {
    key: 'search',
    icon: Search,
    iconBg: ['#7C3AED', '#9333EA'],
    title: 'Find Anything\nInstantly',
    subtitle: 'Search across movies and TV shows in seconds. Find exactly what you\'re in the mood for.',
  },
  {
    key: 'save',
    icon: Heart,
    iconBg: ['#DB2777', '#9333EA'],
    title: 'Build Your\nWatchlist',
    subtitle: 'Save movies and shows you want to watch. Your personal list is always synced across devices.',
  },
  {
    key: 'trailers',
    icon: Play,
    iconBg: ['#9333EA', '#DB2777'],
    title: 'Watch Trailers\nAnytime',
    subtitle: 'Preview any movie or show before you commit. Tap play on any title to watch the official trailer.',
  },
];

function SlideItem({ slide }: { slide: Slide }) {
  const Icon = slide.icon;
  return (
    <View style={{ width: W, alignItems: 'center', paddingHorizontal: 32 }}>
      {/* Icon bubble */}
      <Animated.View entering={ZoomIn.duration(500).springify()} style={{ marginBottom: 48 }}>
        <LinearGradient
          colors={slide.iconBg}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            width: 140, height: 140, borderRadius: 70,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={64} color="#fff" fill={slide.key === 'save' || slide.key === 'trailers' ? '#fff' : undefined} />
        </LinearGradient>

        {/* Glow ring */}
        <View style={{
          position: 'absolute', top: -8, left: -8, right: -8, bottom: -8,
          borderRadius: 80, borderWidth: 1,
          borderColor: 'rgba(147,51,234,0.3)',
        }} />
        <View style={{
          position: 'absolute', top: -20, left: -20, right: -20, bottom: -20,
          borderRadius: 90, borderWidth: 1,
          borderColor: 'rgba(147,51,234,0.12)',
        }} />
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.duration(400).delay(100)}
        style={{
          color: colors.foreground, fontSize: 34, fontWeight: '800',
          textAlign: 'center', letterSpacing: -0.8, lineHeight: 42, marginBottom: 18,
        }}
      >
        {slide.title}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.duration(400).delay(200)}
        style={{
          color: colors.mutedForeground, fontSize: 16,
          textAlign: 'center', lineHeight: 26,
        }}
      >
        {slide.subtitle}
      </Animated.Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const listRef = useRef<FlatList>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Auth');
  };

  const next = () => {
    if (activeIdx < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIdx + 1, animated: true });
      setActiveIdx(activeIdx + 1);
    } else {
      finish();
    }
  };

  const isLast = activeIdx === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Skip */}
      <TouchableOpacity
        onPress={finish}
        style={{ position: 'absolute', top: insets.top + 16, right: 20, zIndex: 10 }}
      >
        <Text style={{ color: colors.mutedForeground, fontSize: 14, fontWeight: '600' }}>Skip</Text>
      </TouchableOpacity>

      {/* Logo */}
      <View style={{ paddingTop: insets.top + 12, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 8, padding: 5 }}
          >
            <Zap size={14} color="#fff" fill="#fff" />
          </LinearGradient>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>
            Flix<Text style={{ color: colors.primary }}>Video</Text>
          </Text>
        </View>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          setActiveIdx(idx);
        }}
        renderItem={({ item }) => <SlideItem slide={item} />}
        contentContainerStyle={{ alignItems: 'center', paddingTop: H * 0.1 }}
        style={{ flex: 1 }}
      />

      {/* Bottom */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                height: 4, borderRadius: 2,
                width: i === activeIdx ? 24 : 6,
                backgroundColor: i === activeIdx ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity onPress={next} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              borderRadius: 16, paddingVertical: 16, gap: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {isLast ? 'Get Started' : 'Continue'}
            </Text>
            {!isLast && <ChevronRight size={20} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
