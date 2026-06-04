import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { colors } from '../../theme/colors';

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w342';

const FALLBACK_GRADIENTS: [string, string][] = [
  ['#9333EA', '#DB2777'],
  ['#16191F', '#282E38'],
  ['#7C3AED', '#EC4899'],
  ['#1E2229', '#111318'],
  ['#4C1D95', '#831843'],
];

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  rating?: number;
  cardWidth?: number;
  cardHeight?: number;
  onPress?: () => void;
  index?: number;
}

const MovieCard = React.memo(function MovieCard({
  title,
  posterPath,
  rating,
  cardWidth = 120,
  cardHeight = 180,
  onPress,
  index = 0,
}: MovieCardProps) {
  const [errored, setErrored] = useState(false);
  const grad = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width: cardWidth, marginRight: 12 }}>
      <View style={{ borderRadius: 10, overflow: 'hidden', width: cardWidth, height: cardHeight }}>
        {posterPath && !errored ? (
          <Image
            source={{ uri: `${TMDB_POSTER}${posterPath}` }}
            style={{ width: cardWidth, height: cardHeight }}
            onError={() => setErrored(true)}
          />
        ) : (
          <LinearGradient
            colors={grad}
            style={{ width: cardWidth, height: cardHeight }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {rating !== undefined && rating > 0 && (
          <View style={{
            position: 'absolute', top: 6, right: 6,
            backgroundColor: 'rgba(0,0,0,0.75)',
            borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
            flexDirection: 'row', alignItems: 'center', gap: 2,
          }}>
            <Star size={9} color="#FFA00A" fill="#FFA00A" />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
              {rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 12, fontWeight: '600', marginTop: 6 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
});

export default MovieCard;
