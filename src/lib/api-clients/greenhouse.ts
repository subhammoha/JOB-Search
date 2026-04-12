import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  updated_at: string;
  absolute_url: string;
  content?: string;
  metadata?: unknown[];
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

const GREENHOUSE_BASE = 'https://boards-api.greenhouse.io/v1/boards';

async function fetchCompanyJobs(boardToken: string, query: string): Promise<UnifiedJob[]> {
  const res = await fetch(`${GREENHOUSE_BASE}/${encodeURIComponent(boardToken)}/jobs?content=true`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

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

export async function fetchGreenhouse(query: string, companies: string[]): Promise<UnifiedJob[]> {
  const results = await Promise.allSettled(
    companies.map(company => fetchCompanyJobs(company, query))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<UnifiedJob[]>).value);
}
