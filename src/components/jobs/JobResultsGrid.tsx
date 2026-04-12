'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UnifiedJob, FilterState, JobSource } from '@/types/job';
import { EnrichmentMap } from '@/types/enrich';
import { JobCard } from './JobCard';
import { JobCardSkeleton } from './JobCardSkeleton';
import { SearchFilters } from '@/components/search/SearchFilters';
import { useBookmarks } from '@/hooks/useBookmarks';
import { AlertCircle, RefreshCw, SearchX } from 'lucide-react';
import { HIGH_APPLICANT_THRESHOLD } from '@/lib/constants';

interface JobsApiResponse {
  jobs: (Omit<UnifiedJob, 'postedAt'> & { postedAt: string })[];
  meta: {
    total: number;
    failedSources: string[];
    successfulSources: string[];
    rateLimitWarning: boolean;
  };
}

const ALL_SOURCES: JobSource[] = [
  'jsearch', 'adzuna', 'themuse', 'arbeitnow', 'remotive',
  'greenhouse', 'lever', 'ashby', 'workday',
];

const DEFAULT_FILTERS: FilterState = {
  sources: ALL_SOURCES,
  hideConsultancies: false,
  onlyH1bSponsors: false,
  hideHighApplicants: false,
  remoteFilter: 'all',
  datePosted: 'any',
};

interface Props {
  q: string;
  location?: string;
}

export function JobResultsGrid({ q, location }: Props) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [enrichmentMap, setEnrichmentMap] = useState<EnrichmentMap>({});
  const { toggle, isBookmarked } = useBookmarks();

  // Fetch jobs
  const { data, isLoading, isError, refetch } = useQuery<JobsApiResponse>({
    queryKey: ['jobs', q, location],
    queryFn: async () => {
      const params = new URLSearchParams({ q });
      if (location) params.set('location', location);
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
    enabled: !!q,
  });

  const jobs: UnifiedJob[] = useMemo(() => {
    if (!data?.jobs) return [];
    return data.jobs.map(j => ({ ...j, postedAt: new Date(j.postedAt) }));
  }, [data]);

  // Fetch enrichment after jobs load
  const enrichMutation = useMutation({
    mutationFn: async (companies: { name: string; description?: string }[]) => {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies }),
      });
      if (!res.ok) throw new Error('Enrichment failed');
      return res.json() as Promise<EnrichmentMap>;
    },
    onSuccess: (result) => {
      setEnrichmentMap(prev => ({ ...prev, ...result }));
    },
  });

  useEffect(() => {
    if (jobs.length === 0) return;
    // Batch unique companies (deduplicated)
    const seen = new Set<string>();
    const companies: { name: string; description?: string }[] = [];
    for (const job of jobs) {
      if (!seen.has(job.company)) {
        seen.add(job.company);
        companies.push({ name: job.company, description: job.description });
      }
    }
    // Enrich in batches of 50
    for (let i = 0; i < companies.length; i += 50) {
      enrichMutation.mutate(companies.slice(i, i + 50));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  // Apply client-side filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (!filters.sources.includes(job.source)) return false;

      if (filters.remoteFilter === 'remote' && !job.isRemote) return false;
      if (filters.remoteFilter === 'onsite' && job.isRemote) return false;

      if (filters.datePosted !== 'any') {
        const ms = Date.now() - new Date(job.postedAt).getTime();
        const maxMs = { '24h': 86400000, 'week': 604800000, 'month': 2592000000 }[filters.datePosted];
        if (ms > maxMs) return false;
      }

      const enrich = enrichmentMap[job.company];
      if (enrich) {
        if (filters.hideConsultancies && enrich.consultancy?.isConsultancy) return false;
        if (filters.onlyH1bSponsors && enrich.h1b.sponsors !== true) return false;
      }

      if (filters.hideHighApplicants && job.applicantCount && job.applicantCount >= HIGH_APPLICANT_THRESHOLD) return false;

      return true;
    });
  }, [jobs, filters, enrichmentMap]);

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-52 shrink-0">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-32" />
            ))}
          </div>
        </div>
        <div className="flex-1 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <div>
          <p className="font-semibold text-gray-800">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-1">Could not fetch job listings. Please try again.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const failedSources = data?.meta?.failedSources ?? [];
  const rateLimitWarning = data?.meta?.rateLimitWarning ?? false;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Filter sidebar */}
      <div className="lg:w-52 shrink-0">
        <div className="sticky top-20">
          <SearchFilters
            filters={filters}
            onChange={setFilters}
            totalJobs={jobs.length}
            filteredJobs={filteredJobs.length}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0">
        {/* JSearch rate limit warning */}
        {rateLimitWarning && (
          <div className="mb-3 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            JSearch monthly quota is nearly exhausted. LinkedIn/Indeed results may be limited. Direct ATS sources (Greenhouse, Lever, etc.) still fully active.
          </div>
        )}

        {/* Failed sources warning */}
        {failedSources.length > 0 && (
          <div className="mb-4 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Some sources unavailable: {failedSources.join(', ')}. Results shown from {data?.meta?.successfulSources?.join(', ') ?? 'available sources'}.
          </div>
        )}

        {/* Result count */}
        {jobs.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredJobs.length === jobs.length
              ? `${jobs.length} jobs found`
              : `${filteredJobs.length} of ${jobs.length} jobs (filters applied)`}
          </p>
        )}

        {/* Empty state */}
        {filteredJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <SearchX className="w-10 h-10 text-gray-300" />
            <div>
              <p className="font-semibold text-gray-700">No jobs found</p>
              <p className="text-sm text-gray-500 mt-1">
                {jobs.length > 0
                  ? 'Try adjusting your filters.'
                  : `No results for "${q}"${location ? ` in ${location}` : ''}. Try broader keywords.`}
              </p>
            </div>
          </div>
        )}

        {/* Job grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              enrichment={enrichmentMap[job.company]}
              enrichmentLoading={enrichMutation.isPending && !enrichmentMap[job.company]}
              isBookmarked={isBookmarked(job.id)}
              onBookmarkToggle={toggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
