import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

export function useItemWatchlist(contentType: 'movie' | 'tv', contentId: number) {
  const { token } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [checking, setChecking] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    setChecking(true);
    fetch(`${API_URL}/api/watchlist/check/${contentType}/${contentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setInWatchlist(d.in_watchlist ?? false))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [contentType, contentId, token]);

  const toggle = useCallback(async () => {
    if (!token || toggling) return;
    setToggling(true);
    const method = inWatchlist ? 'DELETE' : 'POST';
    try {
      await fetch(`${API_URL}/api/watchlist/${contentType}/${contentId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      setInWatchlist(v => !v);
    } catch {}
    setToggling(false);
  }, [token, toggling, inWatchlist, contentType, contentId]);

  return { inWatchlist, checking, toggling, toggle };
}
