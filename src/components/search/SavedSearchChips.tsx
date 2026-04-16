'use client';

import { BookmarkCheck, X } from 'lucide-react';
import { useSavedSearches } from '@/hooks/useSavedSearches';

export function SavedSearchChips() {
  const { searches, remove } = useSavedSearches();

  if (searches.length === 0) return null;

  return (
    <div className="mt-4 w-full max-w-3xl">
      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
        <BookmarkCheck className="w-3 h-3" />
        Saved searches
      </p>
      <div className="flex flex-wrap gap-2">
        {searches.map(s => (
          <div key={s.id} className="flex items-center gap-1 pl-3 pr-1 py-1 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-700">
            <a
              href={`/search?q=${encodeURIComponent(s.q)}${s.location ? `&location=${encodeURIComponent(s.location)}` : ''}`}
              className="hover:underline leading-none"
            >
              {s.q}{s.location ? ` · ${s.location}` : ''}
            </a>
            <button
              onClick={() => remove(s.id)}
              className="ml-0.5 p-0.5 rounded-full text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-colors"
              aria-label={`Remove saved search: ${s.q}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
