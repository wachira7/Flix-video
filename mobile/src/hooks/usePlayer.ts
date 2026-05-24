import { useState, useRef, useCallback } from 'react';
import { streamingService } from '../services/streaming.service';

export const usePlayer = (contentType: string, contentId: number) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quality, setQuality] = useState<'auto' | '1080p' | '720p' | '480p' | '360p'>('auto');
  const saveProgressRef = useRef<ReturnType<typeof setTimeout>>();

  const onProgress = useCallback(
    (currentTime: number, totalDuration: number) => {
      setProgress(currentTime);
      setDuration(totalDuration);
      clearTimeout(saveProgressRef.current);
      saveProgressRef.current = setTimeout(() => {
        streamingService.updateProgress(contentType, contentId, currentTime, totalDuration);
      }, 5000);
    },
    [contentType, contentId],
  );

  return { isPlaying, setIsPlaying, isMuted, setIsMuted, progress, duration, quality, setQuality, onProgress };
};
