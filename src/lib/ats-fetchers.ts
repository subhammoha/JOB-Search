/**
 * Browser-safe ATS fetch functions.
 * Called from useATSJobs (client component) — no Next.js server APIs allowed here.
 * AbortSignal.timeout ensures each company request gives up after 8 s.
 */

import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

// ─── Greenhouse ───────────────────────────────────────────────────────────────

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  updated_at: string;
  absolute_url: string;
  content?: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

const GREENHOUSE_BASE = 'https://boards-api.greenhouse.io/v1/boards';

export async function fetchGreenhouseCompany(boardToken: string, query: string): Promise<UnifiedJob[]> {
  const res = await fetch(
    `${GREENHOUSE_BASE}/${encodeURIComponent(boardToken)}/jobs?content=true`,
    {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) return [];

  const data: GreenhouseResponse = await res.json();
  const queryLower = query.toLowerCase();

  return data.jobs
    .filter(job =>
      job.title.toLowerCase().includes(queryLower) ||
      (job.content ?? '').toLowerCase().includes(queryLower)
    )
    .map(job => ({
      id: generateJobId(job.title, boardToken, job.location.name, 'greenhouse'),
      title: job.title,
      company: boardToken.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      location: job.location.name || 'Not specified',
      description: (job.content ?? '').replace(/<[^>]+>/g, '').slice(0, 500),
      applyUrl: job.absolute_url,
      postedAt: new Date(job.updated_at),
      source: 'greenhouse' as const,
      isRemote: job.location.name.toLowerCase().includes('remote'),
    }));
}

// ─── Lever ────────────────────────────────────────────────────────────────────

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    commitment?: string;
    location?: string;
    team?: string;
    workplaceType?: string;
  };
  descriptionPlain: string;
  hostedUrl: string;
  createdAt: number;
  workplaceType?: string;
}

const LEVER_BASE = 'https://api.lever.co/v0/postings';

export async function fetchLeverCompany(org: string, query: string): Promise<UnifiedJob[]> {
  const res = await fetch(
    `${LEVER_BASE}/${encodeURIComponent(org)}?mode=json`,
    {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) return [];

  const data: LeverPosting[] = await res.json();
  const queryLower = query.toLowerCase();
  const companyName = org.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return data
    .filter(job =>
      job.text.toLowerCase().includes(queryLower) ||
      job.descriptionPlain.toLowerCase().includes(queryLower)
    )
    .map(job => {
      const location = job.categories.location || 'Not specified';
      const isRemote =
        location.toLowerCase().includes('remote') ||
        job.workplaceType === 'remote' ||
        job.categories.workplaceType === 'remote';

      return {
        id: generateJobId(job.text, org, location, 'lever'),
        title: job.text,
        company: companyName,
        location,
        description: job.descriptionPlain.slice(0, 500),
        applyUrl: job.hostedUrl,
        postedAt: new Date(job.createdAt),
        source: 'lever' as const,
        isRemote,
        employmentType: job.categories.commitment,
      };
    });
}

// ─── Ashby ────────────────────────────────────────────────────────────────────

interface AshbyJob {
  id: string;
  title: string;
  locationName?: string;
  isRemote: boolean;
  descriptionHtml?: string;
  publishedDate: string;
  employmentType?: string;
  jobUrl: string;
}

const ASHBY_GRAPHQL = 'https://jobs.ashbyhq.com/api/non-user-graphql';

const ASHBY_QUERY = `
query JobPostings($organizationHostedJobsPageName: String!) {
  jobBoard: jobBoardWithTeams(
    organizationHostedJobsPageName: $organizationHostedJobsPageName
  ) {
    jobPostings {
      id
      title
      locationName
      isRemote
      descriptionHtml
      publishedDate
      employmentType
      jobUrl: hostedUrl
    }
  }
}
`;

export async function fetchAshbyCompany(orgSlug: string, query: string): Promise<UnifiedJob[]> {
  const res = await fetch(ASHBY_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      operationName: 'JobPostings',
      query: ASHBY_QUERY,
      variables: { organizationHostedJobsPageName: orgSlug },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const json = await res.json();
  const postings: AshbyJob[] = json?.data?.jobBoard?.jobPostings ?? [];
  const queryLower = query.toLowerCase();
  const companyName = orgSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return postings
    .filter(job =>
      job.title.toLowerCase().includes(queryLower) ||
      (job.descriptionHtml ?? '').toLowerCase().includes(queryLower)
    )
    .map(job => ({
      id: generateJobId(job.title, orgSlug, job.locationName ?? 'Remote', 'ashby'),
      title: job.title,
      company: companyName,
      location: job.locationName ?? (job.isRemote ? 'Remote' : 'Not specified'),
      description: (job.descriptionHtml ?? '').replace(/<[^>]+>/g, '').slice(0, 500),
      applyUrl: job.jobUrl,
      postedAt: new Date(job.publishedDate),
      source: 'ashby' as const,
      isRemote: job.isRemote,
      employmentType: job.employmentType ?? undefined,
    }));
}
