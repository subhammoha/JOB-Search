'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { UnifiedJob } from '@/types/job';
import { fetchGreenhouseCompany, fetchLeverCompany, fetchAshbyCompany } from '@/lib/ats-fetchers';
import { parseATSSlugs, mergeATSTargets, ATSTarget } from '@/lib/ats-url-parser';
import atsCompaniesData from '@/data/ats-companies.json';

interface ATSCompanies {
  greenhouse: string[];
  lever: string[];
  ashby: string[];
}

const atsCompanies = atsCompaniesData as ATSCompanies;

// Seed list — always queried regardless of server results
const SEED_TARGETS: ATSTarget[] = [
  ...atsCompanies.greenhouse.map(slug => ({ ats: 'greenhouse' as const, slug })),
  ...atsCompanies.lever.map(slug => ({ ats: 'lever' as const, slug })),
  ...atsCompanies.ashby.map(slug => ({ ats: 'ashby' as const, slug })),
];

function fetchATSCompany(ats: string, slug: string, query: string): Promise<UnifiedJob[]> {
  switch (ats) {
    case 'greenhouse': return fetchGreenhouseCompany(slug, query);
    case 'lever': return fetchLeverCompany(slug, query);
    case 'ashby': return fetchAshbyCompany(slug, query);
    default: return Promise.resolve([]);
  }
}

export interface UseATSJobsResult {
  jobs: UnifiedJob[];
  isLoading: boolean;
  pendingCount: number;
  totalCount: number;
}

/**
 * Fetches jobs from Greenhouse, Lever, and Ashby directly in the browser.
 * - Queries all seed companies from ats-companies.json
 * - Auto-discovers additional company slugs from server job apply URLs
 * - Results stream in progressively as each company responds
 * - Browser HTTP connection pooling throttles naturally (no server timeout)
 */
export function useATSJobs(query: string, serverJobs: UnifiedJob[], enabled: boolean): UseATSJobsResult {
  // Discover ATS company slugs from job board result URLs
  const discovered = useMemo(() => parseATSSlugs(serverJobs), [serverJobs]);

  // Merge seed + discovered, deduplicated by ats+slug
  const targets = useMemo(() => mergeATSTargets(SEED_TARGETS, discovered), [discovered]);

  const results = useQueries({
    queries: targets.map(t => ({
      queryKey: ['ats', t.ats, t.slug, query],
      queryFn: () => fetchATSCompany(t.ats, t.slug, query),
      enabled: enabled && !!query,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  const jobs = useMemo<UnifiedJob[]>(() => {
    const all: UnifiedJob[] = [];
    for (const r of results) {
      if (r.status === 'success' && r.data) {
        all.push(...r.data);
      }
    }
    return all;
  }, [results]);

  let pendingCount = 0;
  for (const r of results) {
    if (r.isPending || r.isFetching) pendingCount++;
  }

  return {
    jobs,
    isLoading: pendingCount > 0,
    pendingCount,
    totalCount: targets.length,
  };
}
