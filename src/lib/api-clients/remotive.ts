import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

export async function fetchRemotive(query: string): Promise<UnifiedJob[]> {
  const url = new URL('https://remotive.com/api/remote-jobs');
  url.searchParams.set('search', query);
  url.searchParams.set('limit', '20');

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Remotive API error: ${res.status}`);

  const data: RemotiveResponse = await res.json();

  return data.jobs.map(job => ({
    id: generateJobId(job.title, job.company_name, 'remote', 'remotive'),
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || 'Remote',
    salary: job.salary || undefined,
    description: job.description.replace(/<[^>]+>/g, '').slice(0, 500),
    applyUrl: job.url,
    postedAt: new Date(job.publication_date),
    source: 'remotive' as const,
    isRemote: true,
    employmentType: job.job_type,
    logoUrl: job.company_logo,
  }));
}
