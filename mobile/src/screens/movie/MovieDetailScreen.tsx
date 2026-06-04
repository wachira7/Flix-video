import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Play, Heart, Star, Clock, Calendar } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';

import MovieCard from '../../components/content/MovieCard';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../types/navigation';
import { useItemWatchlist } from '../../hooks/useWatchlist';

const { width: W, height: H } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w342';
const TMDB_PROFILE = 'https://image.tmdb.org/t/p/w185';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'MovieDetail'>;

interface Genre { id: number; name: string }
interface CastMember { id: number; name: string; character: string; profile_path: string | null }
interface Movie {
  id: number; title: string; overview: string;
  backdrop_path: string | null; poster_path: string | null;
  vote_average?: number; runtime?: number | null;
  release_date?: string; genres?: Genre[];
}
interface SimilarMovie {
  id: number; title: string; poster_path: string | null; vote_average?: number;
}

export default function MovieDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { movieId } = route.params;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { inWatchlist, toggling, toggle } = useItemWatchlist('movie', movieId);

  useEffect(() => {
    const load = async () => {
      try {
        const [movieRes, creditsRes, similarRes, videosRes] = await Promise.all([
          fetch(`${API_URL}/api/movies/${movieId}`),
          fetch(`${API_URL}/api/movies/${movieId}/credits`),
          fetch(`${API_URL}/api/movies/${movieId}/similar`),
          fetch(`${API_URL}/api/movies/${movieId}/videos`),
        ]);
        const [movieData, creditsData, similarData, videosData] = await Promise.all([
          movieRes.json(), creditsRes.json(), similarRes.json(), videosRes.json(),
        ]);
        setMovie(movieData.movie ?? movieData);
        setCast((creditsData.cast ?? []).slice(0, 12));
        setSimilar((similarData.results ?? []).slice(0, 10));
        const trailer = (videosData.videos ?? []).find(
          (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
        ) ?? (videosData.videos ?? [])[0];
        if (trailer) setTrailerKey(trailer.key);
      } catch {
        // show partial data if any call fails
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [movieId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.mutedForeground }}>Movie not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const year = movie.release_date?.slice(0, 4) ?? '';
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Backdrop */}
        <View style={{ width: W, height: H * 0.45 }}>
          {movie.backdrop_path ? (
            <Image
              source={{ uri: `${TMDB_BACKDROP}${movie.backdrop_path}` }}
              style={{ width: W, height: H * 0.45 }}
            />
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              style={{ width: W, height: H * 0.45 }}
            />
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
            backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
            padding: 8,
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        {/* Main content */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 16, marginTop: -20 }}>
          {/* Poster + meta row */}
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
            <View style={{ borderRadius: 12, overflow: 'hidden', width: 100, height: 150, elevation: 8 }}>
              {movie.poster_path ? (
                <Image source={{ uri: `${TMDB_POSTER}${movie.poster_path}` }} style={{ width: 100, height: 150 }} />
              ) : (
                <LinearGradient colors={[colors.primary, colors.accent]} style={{ width: 100, height: 150 }} />
              )}
            </View>

            <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 4 }}>
              <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 }}>
                {movie.title}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {(movie.genres ?? []).slice(0, 3).map(g => (
                  <View key={g.id} style={{
                    backgroundColor: colors.secondary, borderRadius: 6,
                    paddingHorizontal: 8, paddingVertical: 3,
                  }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '600' }}>{g.name}</Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Star size={13} color="#FFA00A" fill="#FFA00A" />
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                    {(movie.vote_average ?? 0).toFixed(1)}
                  </Text>
                </View>
                {year ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{year}</Text>
                  </View>
                ) : null}
                {runtime ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{runtime}</Text>
                  </View>
                ) : null}
              </View>
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
                borderColor: inWatchlist ? colors.accent : colors.border,
                backgroundColor: inWatchlist ? 'rgba(219,39,119,0.12)' : 'transparent',
              }}
            >
              <Heart
                size={20}
                color={inWatchlist ? colors.accent : colors.mutedForeground}
                fill={inWatchlist ? colors.accent : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {/* Overview */}
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Overview</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 22, marginBottom: 24 }}>
            {movie.overview || 'No overview available.'}
          </Text>

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
                          <Text style={{ color: colors.mutedForeground, fontSize: 20, fontWeight: '700' }}>
                            {member.name[0]}
                          </Text>
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
                {similar.map((m, i) => (
                  <MovieCard
                    key={m.id}
                    id={m.id}
                    title={m.title}
                    posterPath={m.poster_path}
                    rating={m.vote_average}
                    index={i}
                    onPress={() => navigation.replace('MovieDetail', { movieId: m.id, title: m.title })}
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
