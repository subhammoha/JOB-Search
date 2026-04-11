'use client';

import { useBookmarks } from '@/hooks/useBookmarks';
import { JobCard } from '@/components/jobs/JobCard';
import { Bookmark, Download, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function BookmarksView() {
  const { bookmarks, toggle, isBookmarked, exportCSV, loaded } = useBookmarks();
  const jobs = Object.values(bookmarks);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to search
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-blue-600" />
            Saved Jobs
            {jobs.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-1">({jobs.length})</span>
            )}
          </h1>
        </div>
        {jobs.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <Bookmark className="w-12 h-12 text-gray-200" />
          <div>
            <p className="font-semibold text-gray-700">No saved jobs yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Use the bookmark icon on any job card to save it here.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Search Jobs
          </Link>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isBookmarked={isBookmarked(job.id)}
                onBookmarkToggle={toggle}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                if (confirm('Remove all saved jobs?')) {
                  jobs.forEach(j => toggle(j));
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
        </>
      )}
    </div>
  );
}
