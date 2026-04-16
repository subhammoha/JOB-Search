'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UnifiedJob, FilterState, JobSource, DIRECT_ATS_SOURCES } from '@/types/job';
import { EnrichmentMap } from '@/types/enrich';
import { JobCard } from './JobCard';
import { JobCardSkeleton } from './JobCardSkeleton';
import { SearchFilters } from '@/components/search/SearchFilters';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useATSJobs } from '@/hooks/useATSJobs';
import { AlertCircle, RefreshCw, SearchX, Loader2 } from 'lucide-react';
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
  'greenhouse', 'lever', 'ashby',
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

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(senior|sr\.?|junior|jr\.?|lead|staff|principal|remote|hybrid|mid|associate|entry[\s-]level)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Merge server jobs + browser-fetched ATS jobs, deduplicating on (company, normalized title). */
function mergeAndDeduplicate(serverJobs: UnifiedJob[], atsJobs: UnifiedJob[]): UnifiedJob[] {
  const result: UnifiedJob[] = [...serverJobs];
  const keyFor = (job: UnifiedJob) =>
    `${job.company.toLowerCase()}|${normalizeTitle(job.title)}`;

  for (const atsJob of atsJobs) {
    const key = keyFor(atsJob);
    const existingIdx = result.findIndex(j => keyFor(j) === key);

    if (existingIdx === -1) {
      result.push(atsJob);
    } else if (DIRECT_ATS_SOURCES.includes(atsJob.source)) {
      // Replace job-board posting with direct ATS version for a better apply link
      result[existingIdx] = {
        ...result[existingIdx],
        applyUrl: atsJob.applyUrl,
        source: atsJob.source,
      };
    }
  }

  return result.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
}

export function JobResultsGrid({ q, location }: Props) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [enrichmentMap, setEnrichmentMap] = useState<EnrichmentMap>({});
  const { toggle, isBookmarked } = useBookmarks();
  const enrichedRef = useRef(new Set<string>());

  // Reset enrichment tracking whenever the search query changes
  useEffect(() => {
    enrichedRef.current = new Set<string>();
  }, [q]);

  // 1. Server-side sources: jsearch, adzuna, themuse, arbeitnow, remotive
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

  const serverJobs: UnifiedJob[] = useMemo(() => {
    if (!data?.jobs) return [];
    return data.jobs.map(j => ({ ...j, postedAt: new Date(j.postedAt) }));
  }, [data]);

  // 2. Browser-side ATS sources: greenhouse, lever, ashby — fires after server responds
  // Passes serverJobs so the hook can auto-discover additional company slugs from apply URLs
  const { jobs: atsJobs, isLoading: atsLoading, pendingCount, totalCount } = useATSJobs(
    q,
    serverJobs,
    !isLoading && !isError && !!data,
  );

  // 3. Merge + dedup as ATS results stream in progressively
  const allJobs = useMemo(
    () => mergeAndDeduplicate(serverJobs, atsJobs),
    [serverJobs, atsJobs],
  );

  // 4. Enrichment
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

  // Enrich new companies progressively as jobs stream in (server first, then ATS)
  useEffect(() => {
    if (allJobs.length === 0) return;
    const newCompanies: { name: string; description?: string }[] = [];
    for (const job of allJobs) {
      if (!enrichedRef.current.has(job.company)) {
        enrichedRef.current.add(job.company);
        newCompanies.push({ name: job.company, description: job.description });
      }
    }
    if (newCompanies.length === 0) return;
    for (let i = 0; i < newCompanies.length; i += 50) {
      enrichMutation.mutate(newCompanies.slice(i, i + 50));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allJobs]);

  // 5. Client-side filters
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
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
  }, [allJobs, filters, enrichmentMap]);

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
            totalJobs={allJobs.length}
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
            JSearch monthly quota is nearly exhausted. LinkedIn/Indeed results may be limited. Direct ATS sources (Greenhouse, Lever, Ashby) still fully active.
          </div>
        )}

        {/* Failed sources warning */}
        {failedSources.length > 0 && (
          <div className="mb-4 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Some sources unavailable: {failedSources.join(', ')}. Results shown from {data?.meta?.successfulSources?.join(', ') ?? 'available sources'}.
          </div>
        )}

        {/* ATS loading progress */}
        {atsLoading && serverJobs.length > 0 && (
          <div className="mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
            Loading direct company listings… ({totalCount - pendingCount}/{totalCount} sources checked)
          </div>
        )}

        {/* Result count */}
        {allJobs.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredJobs.length === allJobs.length
              ? `${allJobs.length} jobs found`
              : `${filteredJobs.length} of ${allJobs.length} jobs (filters applied)`}
            {atsLoading && <span className="text-blue-500"> · loading more…</span>}
          </p>
        )}

        {/* Empty state */}
        {filteredJobs.length === 0 && !atsLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <SearchX className="w-10 h-10 text-gray-300" />
            <div>
              <p className="font-semibold text-gray-700">No jobs found</p>
              <p className="text-sm text-gray-500 mt-1">
                {allJobs.length > 0
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
