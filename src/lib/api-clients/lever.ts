import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

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

async function fetchCompanyJobs(org: string, query: string): Promise<UnifiedJob[]> {
  const res = await fetch(`${LEVER_BASE}/${encodeURIComponent(org)}?mode=json`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

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

export async function fetchLever(query: string, companies: string[]): Promise<UnifiedJob[]> {
  const results = await Promise.allSettled(
    companies.map(company => fetchCompanyJobs(company, query))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<UnifiedJob[]>).value);
}
