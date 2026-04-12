import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

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

interface AshbyResponse {
  jobs?: AshbyJob[];
  jobPostings?: AshbyJob[];
}

const ASHBY_GRAPHQL = 'https://jobs.ashbyhq.com/api/non-user-graphql';

const QUERY = `
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

async function fetchCompanyJobs(orgSlug: string, query: string): Promise<UnifiedJob[]> {
  const res = await fetch(ASHBY_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      operationName: 'JobPostings',
      query: QUERY,
      variables: { organizationHostedJobsPageName: orgSlug },
    }),
    next: { revalidate: 300 },
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

export async function fetchAshby(query: string, companies: string[]): Promise<UnifiedJob[]> {
  const results = await Promise.allSettled(
    companies.map(company => fetchCompanyJobs(company, query))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<UnifiedJob[]>).value);
}
