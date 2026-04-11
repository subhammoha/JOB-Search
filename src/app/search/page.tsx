import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { JobResultsGrid } from '@/components/jobs/JobResultsGrid';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; location?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, location } = await searchParams;

  if (!q?.trim()) redirect('/');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Compact search bar at top */}
      <div className="mb-8">
        <SearchBar defaultQuery={q} defaultLocation={location} compact />
      </div>

      <Suspense fallback={null}>
        <JobResultsGrid q={q.trim()} location={location?.trim()} />
      </Suspense>
    </div>
  );
}

export function generateMetadata({ searchParams }: SearchPageProps) {
  return searchParams.then(({ q, location }) => ({
    title: q
      ? `${q}${location ? ` in ${location}` : ''} — JobSearch`
      : 'Search Results — JobSearch',
  }));
}
