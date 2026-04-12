'use client';

import { useQueries } from '@tanstack/react-query';
import { UnifiedJob } from '@/types/job';
import { fetchGreenhouseCompany, fetchLeverCompany, fetchAshbyCompany } from '@/lib/ats-fetchers';
import atsCompanies from '@/data/ats-companies.json';

interface ATSCompanies {
  greenhouse: string[];
  lever: string[];
  ashby: string[];
}

const ats = atsCompanies as ATSCompanies;

export interface UseATSJobsResult {
  jobs: UnifiedJob[];
  isLoading: boolean;
  pendingCount: number;
  totalCount: number;
}

export function useATSJobs(query: string, enabled: boolean): UseATSJobsResult {
  const queries = [
    ...ats.greenhouse.map(company => ({
      queryKey: ['ats', 'greenhouse', company, query],
      queryFn: () => fetchGreenhouseCompany(company, query),
      enabled: enabled && !!query,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
    ...ats.lever.map(company => ({
      queryKey: ['ats', 'lever', company, query],
      queryFn: () => fetchLeverCompany(company, query),
      enabled: enabled && !!query,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
    ...ats.ashby.map(company => ({
      queryKey: ['ats', 'ashby', company, query],
      queryFn: () => fetchAshbyCompany(company, query),
      enabled: enabled && !!query,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  ];

  const results = useQueries({ queries });

  const jobs: UnifiedJob[] = [];
  let pendingCount = 0;

  for (const result of results) {
    if (result.status === 'success' && result.data) {
      jobs.push(...result.data);
    }
    if (result.isPending || result.isFetching) {
      pendingCount++;
    }
  }

  return {
    jobs,
    isLoading: pendingCount > 0,
    pendingCount,
    totalCount: queries.length,
  };
}
