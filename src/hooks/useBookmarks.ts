'use client';

import { useState, useEffect, useCallback } from 'react';
import { UnifiedJob } from '@/types/job';

const STORAGE_KEY = 'jsa-bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Record<string, UnifiedJob>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const save = useCallback((updated: Record<string, UnifiedJob>) => {
    setBookmarks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback((job: UnifiedJob) => {
    setBookmarks(prev => {
      const updated = { ...prev };
      if (updated[job.id]) {
        delete updated[job.id];
      } else {
        updated[job.id] = job;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => !!bookmarks[id], [bookmarks]);

  const exportCSV = useCallback(() => {
    const jobs = Object.values(bookmarks);
    if (jobs.length === 0) return;

    const headers = ['Title', 'Company', 'Location', 'Salary', 'Apply URL', 'Posted At', 'Source'];
    const rows = jobs.map(j => [
      j.title, j.company, j.location, j.salary ?? '', j.applyUrl,
      new Date(j.postedAt).toLocaleDateString(), j.source,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saved-jobs.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [bookmarks]);

  return { bookmarks, toggle, isBookmarked, exportCSV, loaded, save };
}
