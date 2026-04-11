import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

interface TheMuseJob {
  id: number;
  name: string;
  company: { name: string; id: number };
  locations: { name: string }[];
  levels: { name: string; short_name: string }[];
  refs: { landing_page: string };
  contents: string;
  publication_date: string;
  type?: string;
}

interface TheMuseResponse {
  results: TheMuseJob[];
}

export async function fetchTheMuse(query: string, page = 0): Promise<UnifiedJob[]> {
  const apiKey = process.env.THEMUSE_API_KEY;

  const url = new URL('https://www.themuse.com/api/public/jobs');
  if (apiKey) url.searchParams.set('api_key', apiKey);
  url.searchParams.set('page', page.toString());
  // The Muse doesn't have full-text search — filter client-side
  // It has category filters but keyword search is limited

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`TheMuse API error: ${res.status}`);

  const data: TheMuseResponse = await res.json();
  const queryLower = query.toLowerCase();

  return data.results
    .filter(job =>
      job.name.toLowerCase().includes(queryLower) ||
      job.contents.toLowerCase().includes(queryLower)
    )
    .map(job => {
      const location = job.locations?.[0]?.name || 'Not specified';
      return {
        id: generateJobId(job.name, job.company.name, location, 'themuse'),
        title: job.name,
        company: job.company.name,
        location,
        description: job.contents.replace(/<[^>]+>/g, '').slice(0, 500),
        applyUrl: job.refs.landing_page,
        postedAt: new Date(job.publication_date),
        source: 'themuse' as const,
        isRemote: location.toLowerCase().includes('remote') || job.name.toLowerCase().includes('remote'),
        employmentType: job.type || job.levels?.[0]?.name,
      };
    });
}
