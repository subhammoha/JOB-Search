import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  description: string;
  redirect_url: string;
  created: string;
  contract_time?: string;
  contract_type?: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  if (min && max) return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
  if (min) return `From $${Math.round(min / 1000)}k`;
  return undefined;
}

export async function fetchAdzuna(query: string, location?: string, page = 1): Promise<UnifiedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) throw new Error('Adzuna credentials not configured');

  const country = 'us';
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('what', query);
  if (location) url.searchParams.set('where', location);
  url.searchParams.set('results_per_page', '20');
  url.searchParams.set('content-type', 'application/json');

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`);

  const data: AdzunaResponse = await res.json();

  return data.results.map(job => ({
    id: generateJobId(job.title, job.company.display_name, job.location.display_name, 'adzuna'),
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    salary: formatSalary(job.salary_min, job.salary_max),
    description: job.description.slice(0, 500),
    applyUrl: job.redirect_url,
    postedAt: new Date(job.created),
    source: 'adzuna' as const,
    isRemote: job.title.toLowerCase().includes('remote') || job.location.display_name.toLowerCase().includes('remote'),
    employmentType: job.contract_time || job.contract_type,
  }));
}
