import { UnifiedJob, SearchParams } from '@/types/job';
import { fetchArbeitnow } from './api-clients/arbeitnow';
import { fetchRemotive } from './api-clients/remotive';
import { fetchAdzuna } from './api-clients/adzuna';
import { fetchTheMuse } from './api-clients/themuse';
import { fetchJSearch } from './api-clients/jsearch';
import { deduplicateJobKey } from './utils';
import { getEnabledSources } from './constants';

export interface AggregationResult {
  jobs: UnifiedJob[];
  failedSources: string[];
  successfulSources: string[];
}

export async function aggregateJobs(params: SearchParams): Promise<AggregationResult> {
  const { q, location, page = 1 } = params;
  const enabledSources = getEnabledSources();

  type Fetcher = () => Promise<UnifiedJob[]>;

  const sourceFetchers: Record<string, Fetcher> = {
    arbeitnow: () => fetchArbeitnow(q, location),
    remotive: () => fetchRemotive(q),
    adzuna: () => fetchAdzuna(q, location, page),
    themuse: () => fetchTheMuse(q),
    jsearch: () => fetchJSearch(q, location, page),
  };

  const activeFetchers = Object.entries(sourceFetchers)
    .filter(([name]) => enabledSources.includes(name));

  const results = await Promise.allSettled(
    activeFetchers.map(([, fetcher]) => fetcher())
  );

  const failedSources: string[] = [];
  const successfulSources: string[] = [];
  const allJobs: UnifiedJob[] = [];

  results.forEach((result, i) => {
    const sourceName = activeFetchers[i][0];
    if (result.status === 'fulfilled') {
      successfulSources.push(sourceName);
      allJobs.push(...result.value);
    } else {
      failedSources.push(sourceName);
      console.error(`[aggregator] ${sourceName} failed:`, result.reason);
    }
  });

  const jobs = deduplicateJobs(allJobs);

  return { jobs, failedSources, successfulSources };
}

function deduplicateJobs(jobs: UnifiedJob[]): UnifiedJob[] {
  const seen = new Map<string, UnifiedJob>();

  for (const job of jobs) {
    const key = deduplicateJobKey(job.title, job.company, job.location);
    if (!seen.has(key)) {
      seen.set(key, job);
    } else {
      // Keep the one with more data (applicant count, salary, etc.)
      const existing = seen.get(key)!;
      if (
        (!existing.applicantCount && job.applicantCount) ||
        (!existing.salary && job.salary)
      ) {
        seen.set(key, { ...existing, ...job, id: existing.id });
      }
    }
  }

  // Sort by most recently posted
  return Array.from(seen.values()).sort(
    (a, b) => b.postedAt.getTime() - a.postedAt.getTime()
  );
}
