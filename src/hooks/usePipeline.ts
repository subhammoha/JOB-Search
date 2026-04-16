'use client';

import { useState, useEffect, useCallback } from 'react';
import { UnifiedJob } from '@/types/job';

export type PipelineStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export interface PipelineEntry {
  job: UnifiedJob;
  status: PipelineStatus;
  addedAt: string;    // ISO date
  updatedAt: string;
  notes: string;
}

const STORAGE_KEY = 'jsa-pipeline';
const LEGACY_BOOKMARKS_KEY = 'jsa-bookmarks';

type PipelineStore = Record<string, PipelineEntry>;

function load(): PipelineStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Migrate legacy bookmarks on first load
    const legacy = localStorage.getItem(LEGACY_BOOKMARKS_KEY);
    if (legacy) {
      const jobs: Record<string, UnifiedJob> = JSON.parse(legacy);
      const migrated: PipelineStore = {};
      for (const [id, job] of Object.entries(jobs)) {
        migrated[id] = {
          job,
          status: 'saved',
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: '',
        };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // ignore
  }
  return {};
}

function save(store: PipelineStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function usePipeline() {
  const [pipeline, setPipeline] = useState<PipelineStore>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPipeline(load());
    setLoaded(true);
  }, []);

  const add = useCallback((job: UnifiedJob) => {
    setPipeline(prev => {
      if (prev[job.id]) return prev;
      const updated = {
        ...prev,
        [job.id]: {
          job,
          status: 'saved' as PipelineStatus,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: '',
        },
      };
      save(updated);
      return updated;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setPipeline(prev => {
      const updated = { ...prev };
      delete updated[id];
      save(updated);
      return updated;
    });
  }, []);

  const toggle = useCallback((job: UnifiedJob) => {
    setPipeline(prev => {
      const updated = { ...prev };
      if (updated[job.id]) {
        delete updated[job.id];
      } else {
        updated[job.id] = {
          job,
          status: 'saved',
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: '',
        };
      }
      save(updated);
      return updated;
    });
  }, []);

  const updateStatus = useCallback((id: string, status: PipelineStatus) => {
    setPipeline(prev => {
      if (!prev[id]) return prev;
      const updated = {
        ...prev,
        [id]: { ...prev[id], status, updatedAt: new Date().toISOString() },
      };
      save(updated);
      return updated;
    });
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setPipeline(prev => {
      if (!prev[id]) return prev;
      const updated = {
        ...prev,
        [id]: { ...prev[id], notes, updatedAt: new Date().toISOString() },
      };
      save(updated);
      return updated;
    });
  }, []);

  const isInPipeline = useCallback((id: string) => !!pipeline[id], [pipeline]);
  const getStatus = useCallback((id: string) => pipeline[id]?.status ?? null, [pipeline]);
  const getAll = useCallback(() => Object.values(pipeline), [pipeline]);

  const exportCSV = useCallback(() => {
    const entries = Object.values(pipeline);
    if (entries.length === 0) return;
    const headers = ['Title', 'Company', 'Location', 'Salary', 'Status', 'Apply URL', 'Added', 'Notes'];
    const rows = entries.map(e => [
      e.job.title, e.job.company, e.job.location, e.job.salary ?? '',
      e.status, e.job.applyUrl,
      new Date(e.addedAt).toLocaleDateString(), e.notes,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job-pipeline.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [pipeline]);

  return { pipeline, loaded, add, remove, toggle, updateStatus, updateNotes, isInPipeline, getStatus, getAll, exportCSV };
}
