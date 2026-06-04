import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Play, Heart, Star, Tv, Calendar, Film } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';

import MovieCard from '../../components/content/MovieCard';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../types/navigation';
import { useItemWatchlist } from '../../hooks/useWatchlist';

const { width: W, height: H } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const TMDB_POSTER   = 'https://image.tmdb.org/t/p/w342';
const TMDB_PROFILE  = 'https://image.tmdb.org/t/p/w185';

type NavProp   = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'TVDetail'>;

interface Genre       { id: number; name: string }
interface CastMember  { id: number; name: string; character: string; profile_path: string | null }
interface Season      { id: number; season_number: number; name: string; episode_count: number; poster_path: string | null }
interface SimilarShow { id: number; name: string; poster_path: string | null; vote_average?: number }

interface TVShow {
  id: number;
  name: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average?: number;
  first_air_date?: string;
  last_air_date?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  status?: string;
  genres?: Genre[];
  seasons?: Season[];
}

export default function TVDetailScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteType>();
  const { tvId }   = route.params;

  const [show,       setShow]       = useState<TVShow | null>(null);
  const [cast,       setCast]       = useState<CastMember[]>([]);
  const [similar,    setSimilar]    = useState<SimilarShow[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const { inWatchlist: inList, toggling, toggle } = useItemWatchlist('tv', tvId);

  useEffect(() => {
    const load = async () => {
      try {
        const [showRes, creditsRes, similarRes, videosRes] = await Promise.all([
          fetch(`${API_URL}/api/tv/${tvId}`),
          fetch(`${API_URL}/api/tv/${tvId}/credits`),
          fetch(`${API_URL}/api/tv/${tvId}/similar`),
          fetch(`${API_URL}/api/tv/${tvId}/videos`),
        ]);
        const [showData, creditsData, similarData, videosData] = await Promise.all([
          showRes.json(), creditsRes.json(), similarRes.json(), videosRes.json(),
        ]);
        setShow(showData.tv_show ?? showData);
        setCast((creditsData.cast ?? []).slice(0, 12));
        setSimilar((similarData.results ?? []).slice(0, 10));
        const trailer = (videosData.videos ?? []).find(
          (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
        ) ?? (videosData.videos ?? [])[0];
        if (trailer) setTrailerKey(trailer.key);
      } catch {
        // show partial data on failure
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tvId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!show) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.mutedForeground }}>Show not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const year    = show.first_air_date?.slice(0, 4) ?? '';
  const runtime = show.episode_run_time?.[0] ? `${show.episode_run_time[0]}m / ep` : null;
  const seasons = (show.seasons ?? []).filter(s => s.season_number > 0); // exclude "Specials"

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Backdrop */}
        <View style={{ width: W, height: H * 0.45 }}>
          {show.backdrop_path ? (
            <Image
              source={{ uri: `${TMDB_BACKDROP}${show.backdrop_path}` }}
              style={{ width: W, height: H * 0.45 }}
            />
          ) : (
            <LinearGradient colors={[colors.primary, colors.accent]} style={{ width: W, height: H * 0.45 }} />
          )}
          <LinearGradient
            colors={['rgba(17,19,24,0.1)', 'rgba(17,19,24,0.5)', colors.background]}
            locations={[0.4, 0.75, 1]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.3 }}
          />
        </View>

        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            position: 'absolute', top: insets.top + 10, left: 16,
            backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: 8,
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        {/* TV badge */}
        <View style={{
          position: 'absolute', top: insets.top + 14, right: 16,
          backgroundColor: colors.primary, borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 4,
          flexDirection: 'row', alignItems: 'center', gap: 4,
        }}>
          <Tv size={12} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>TV Series</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 16, marginTop: -20 }}>
          {/* Poster + meta row */}
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
            <View style={{ borderRadius: 12, overflow: 'hidden', width: 100, height: 150, elevation: 8 }}>
              {show.poster_path ? (
                <Image source={{ uri: `${TMDB_POSTER}${show.poster_path}` }} style={{ width: 100, height: 150 }} />
              ) : (
                <LinearGradient colors={[colors.primary, colors.accent]} style={{ width: 100, height: 150 }} />
              )}
            </View>

            <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 4 }}>
              <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 }}>
                {show.name}
              </Text>

              {/* Genre chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {(show.genres ?? []).slice(0, 3).map(g => (
                  <View key={g.id} style={{
                    backgroundColor: colors.secondary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                  }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '600' }}>{g.name}</Text>
                  </View>
                ))}
              </View>

              {/* Stats row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                {(show.vote_average ?? 0) > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Star size={13} color="#FFA00A" fill="#FFA00A" />
                    <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                      {(show.vote_average ?? 0).toFixed(1)}
                    </Text>
                  </View>
                )}
                {year ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{year}</Text>
                  </View>
                ) : null}
                {show.number_of_seasons ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Film size={12} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                      {show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Status badge */}
              {show.status && (
                <View style={{
                  marginTop: 8, alignSelf: 'flex-start',
                  backgroundColor: show.status === 'Returning Series'
                    ? 'rgba(70,211,105,0.15)' : 'rgba(138,154,181,0.15)',
                  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: show.status === 'Returning Series' ? colors.success : colors.mutedForeground,
                  }}>
                    {show.status}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={0.85}
              onPress={() => trailerKey
                ? WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${trailerKey}`)
                : null
              }
            >
              <LinearGradient
                colors={trailerKey ? [colors.primary, colors.accent] : [colors.secondary, colors.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14, gap: 8 }}
              >
                <Play size={18} color="#fff" fill="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  {trailerKey ? 'Play Trailer' : 'No Trailer'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggle}
              disabled={toggling}
              activeOpacity={0.85}
              style={{
                paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, borderWidth: 1.5,
                borderColor: inList ? colors.accent : colors.border,
                backgroundColor: inList ? 'rgba(219,39,119,0.12)' : 'transparent',
              }}
            >
              <Heart size={20} color={inList ? colors.accent : colors.mutedForeground} fill={inList ? colors.accent : 'transparent'} />
            </TouchableOpacity>
          </View>

          {/* Overview */}
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Overview</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 22, marginBottom: 24 }}>
            {show.overview || 'No overview available.'}
          </Text>

          {/* Seasons */}
          {seasons.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Seasons</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {seasons.map(season => (
                  <View key={season.id} style={{ width: 110, marginRight: 12, alignItems: 'center' }}>
                    <View style={{ width: 110, height: 160, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.secondary }}>
                      {season.poster_path ? (
                        <Image source={{ uri: `${TMDB_POSTER}${season.poster_path}` }} style={{ width: 110, height: 160 }} />
                      ) : (
                        <LinearGradient colors={[colors.primary, colors.accent]} style={{ width: 110, height: 160 }} />
                      )}
                    </View>
                    <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginTop: 6 }}>
                      {season.name}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                      {season.episode_count} eps
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Cast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {cast.map(member => (
                  <View key={member.id} style={{ width: 72, marginRight: 12, alignItems: 'center' }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden', marginBottom: 6, backgroundColor: colors.secondary }}>
                      {member.profile_path ? (
                        <Image source={{ uri: `${TMDB_PROFILE}${member.profile_path}` }} style={{ width: 60, height: 60 }} />
                      ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: colors.mutedForeground, fontSize: 20, fontWeight: '700' }}>{member.name[0]}</Text>
                        </View>
                      )}
                    </View>
                    <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
                      {member.name}
                    </Text>
                    <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 10, textAlign: 'center' }}>
                      {member.character}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Similar */}
          {similar.length > 0 && (
            <View style={{ marginBottom: 24 + insets.bottom }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>More Like This</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similar.map((s, i) => (
                  <MovieCard
                    key={s.id}
                    id={s.id}
                    title={s.name}
                    posterPath={s.poster_path}
                    rating={s.vote_average}
                    index={i}
                    onPress={() => navigation.replace('TVDetail', { tvId: s.id, title: s.name })}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
