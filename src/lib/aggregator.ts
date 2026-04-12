import { UnifiedJob, SearchParams, DIRECT_ATS_SOURCES } from '@/types/job';
import { fetchArbeitnow } from './api-clients/arbeitnow';
import { fetchRemotive } from './api-clients/remotive';
import { fetchAdzuna } from './api-clients/adzuna';
import { fetchTheMuse } from './api-clients/themuse';
import { fetchJSearch } from './api-clients/jsearch';
import { getEnabledSources } from './constants';
import stringSimilarity from 'string-similarity';

export interface AggregationResult {
  jobs: UnifiedJob[];
  failedSources: string[];
  successfulSources: string[];
  rateLimitWarning: boolean;
}

export async function aggregateJobs(params: SearchParams): Promise<AggregationResult> {
  const { q, location, page = 1 } = params;
  const enabledSources = getEnabledSources();

  type Fetcher = () => Promise<UnifiedJob[]>;

  // Greenhouse, Lever, and Ashby are fetched client-side via useATSJobs (browser fetch,
  // no server timeout). Only API-key-required sources remain here.
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
  let rateLimitWarning = false;

  results.forEach((result, i) => {
    const sourceName = activeFetchers[i][0];
    if (result.status === 'fulfilled') {
      // Check if JSearch returned empty due to rate limit
      if (sourceName === 'jsearch' && result.value.length === 0) {
        rateLimitWarning = true;
      } else {
        successfulSources.push(sourceName);
      }
      allJobs.push(...result.value);
    } else {
      failedSources.push(sourceName);
      console.error(`[aggregator] ${sourceName} failed:`, result.reason);
    }
  });

  const jobs = deduplicateJobs(allJobs);

  return { jobs, failedSources, successfulSources, rateLimitWarning };
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(senior|sr\.?|junior|jr\.?|lead|staff|principal|remote|hybrid|mid|associate|entry.level)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deduplicateJobs(jobs: UnifiedJob[]): UnifiedJob[] {
  const kept: UnifiedJob[] = [];

  for (const job of jobs) {
    const normalizedTitle = normalizeTitle(job.title);
    const companyLower = job.company.toLowerCase();

    const existingIdx = kept.findIndex(existing =>
      existing.company.toLowerCase() === companyLower &&
      stringSimilarity.compareTwoStrings(
        normalizeTitle(existing.title),
        normalizedTitle
      ) >= 0.8
    );

    if (existingIdx === -1) {
      // No duplicate — add it
      kept.push(job);
    } else {
      // Duplicate found — prefer direct ATS source over job board
      const existing = kept[existingIdx];
      const jobIsDirect = DIRECT_ATS_SOURCES.includes(job.source);
      const existingIsDirect = DIRECT_ATS_SOURCES.includes(existing.source);

      if (jobIsDirect && !existingIsDirect) {
        // Replace job board version with direct ATS version (better apply link)
        kept[existingIdx] = {
          ...existing,
          applyUrl: job.applyUrl,
          source: job.source,
          // Keep applicantCount from job board if available
          applicantCount: existing.applicantCount ?? job.applicantCount,
          // Keep salary if job board had it
          salary: existing.salary ?? job.salary,
        };
      }
      // If existing is already direct ATS or job has more data, keep existing
    }
  }

  // Sort by most recently posted
  return kept.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
}
