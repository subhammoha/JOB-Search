import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

export async function fetchArbeitnow(query: string, _location?: string): Promise<UnifiedJob[]> {
  const url = new URL('https://www.arbeitnow.com/api/job-board-api');
  // Arbeitnow doesn't support keyword search via API params — we filter client-side

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Arbeitnow API error: ${res.status}`);

  const data: ArbeitnowResponse = await res.json();
  const queryLower = query.toLowerCase();

  return data.data
    .filter(job =>
      job.title.toLowerCase().includes(queryLower) ||
      job.description.toLowerCase().includes(queryLower) ||
      job.tags.some(t => t.toLowerCase().includes(queryLower))
    )
    .slice(0, 20)
    .map(job => ({
      id: generateJobId(job.title, job.company_name, job.location, 'arbeitnow'),
      title: job.title,
      company: job.company_name,
      location: job.location || (job.remote ? 'Remote' : 'Not specified'),
      description: job.description.slice(0, 500),
      applyUrl: job.url,
      postedAt: new Date(job.created_at * 1000),
      source: 'arbeitnow' as const,
      isRemote: job.remote,
      employmentType: job.job_types?.[0],
    }));
}
