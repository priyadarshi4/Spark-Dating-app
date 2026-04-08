// hooks/useGeolocation.js
import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const request = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return { location, error, loading, request };
}

// hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// hooks/useLocalStorage.js
import { useState } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  return [storedValue, setValue];
}

// hooks/useMatchStats.js
import { useQuery } from 'react-query';
import { matchAPI } from '../services/api';

export function useMatchStats() {
  return useQuery('match-stats', () => matchAPI.getStats().then(r => r.data.data), {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// hooks/useInfiniteScroll.js
import { useEffect, useRef } from 'react';

export function useInfiniteScroll(onLoadMore, hasMore) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  return ref;
}
