'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useSavedSearches } from '@/hooks/useSavedSearches';

interface SaveSearchButtonProps {
  q: string;
  location?: string;
}

export function SaveSearchButton({ q, location }: SaveSearchButtonProps) {
  const { save, remove, isSaved, searches } = useSavedSearches();
  const saved = isSaved(q, location);

  const handleClick = () => {
    if (saved) {
      const entry = searches.find(s => s.q === q && s.location === (location || undefined));
      if (entry) remove(entry.id);
    } else {
      save(q, location);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={saved ? 'Remove saved search' : 'Save this search'}
      aria-label={saved ? 'Remove saved search' : 'Save this search'}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
        saved
          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
      }`}
    >
      {saved
        ? <><BookmarkCheck className="w-4 h-4" /><span className="hidden sm:inline">Saved</span></>
        : <><Bookmark className="w-4 h-4" /><span className="hidden sm:inline">Save search</span></>
      }
    </button>
  );
}
