import { create } from 'zustand';

type Quality = 'auto' | '1080p' | '720p' | '480p' | '360p';

interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  quality: Quality;
  progress: number;
  duration: number;
  isFullscreen: boolean;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (quality: Quality) => void;
  setProgress: (progress: number, duration: number) => void;
  setFullscreen: (fullscreen: boolean) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  isMuted: false,
  quality: 'auto',
  progress: 0,
  duration: 0,
  isFullscreen: false,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setMuted: (isMuted) => set({ isMuted }),
  setQuality: (quality) => set({ quality }),
  setProgress: (progress, duration) => set({ progress, duration }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  reset: () => set({ isPlaying: false, progress: 0, duration: 0, isFullscreen: false }),
}));
