'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SavedSearch {
  id: string;
  q: string;
  location?: string;
  savedAt: string;
}

const STORAGE_KEY = 'jsa-saved-searches';
const MAX_SAVED = 10;

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSearches(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persist = (next: SavedSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const save = useCallback((q: string, location?: string) => {
    setSearches(prev => {
      // Don't save duplicates
      if (prev.some(s => s.q === q && s.location === (location || undefined))) return prev;
      const next = [
        { id: crypto.randomUUID(), q, location: location || undefined, savedAt: new Date().toISOString() },
        ...prev,
      ].slice(0, MAX_SAVED);
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSearches(prev => {
      const next = prev.filter(s => s.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const isSaved = useCallback((q: string, location?: string) => {
    return searches.some(s => s.q === q && s.location === (location || undefined));
  }, [searches]);

  return { searches, save, remove, isSaved };
}
