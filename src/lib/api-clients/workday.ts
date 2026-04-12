import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

interface WorkdayJob {
  title: string;
  locationsText: string;
  postedOn: string;
  externalPath: string;
  jobReqId?: string;
  remoteType?: string;
  jobFamilyGroup?: { summary?: string };
}

interface WorkdayResponse {
  jobPostings?: WorkdayJob[];
  total?: number;
}

// Map of company slug → their Workday subdomain + path prefix
// Format: [subdomain, pathSegment]
const WORKDAY_COMPANIES: Record<string, [string, string]> = {
  amazon: ['amazon', 'amazon'],
  google: ['google', 'google'],
  microsoft: ['microsoft', 'microsoft'],
  apple: ['apple', 'apple'],
  meta: ['meta', 'meta'],
  salesforce: ['salesforce', 'salesforce'],
  oracle: ['oracle', 'oracle'],
  adobe: ['adobe', 'adobe'],
  servicenow: ['servicenow', 'servicenow'],
  workday: ['workday', 'workday'],
  uber: ['uber', 'uber'],
  lyft: ['lyft', 'lyft'],
  airbnb: ['airbnb', 'airbnb'],
  twitter: ['twitter', 'twitter'],
  linkedin: ['linkedin', 'linkedin'],
};

async function fetchCompanyJobs(
  companySlug: string,
  query: string
): Promise<UnifiedJob[]> {
  const config = WORKDAY_COMPANIES[companySlug];
  if (!config) return [];

  const [subdomain, path] = config;
  const url = `https://${subdomain}.wd1.myworkdayjobs.com/wday/cxs/${subdomain}/${path}/jobs`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 20,
        offset: 0,
        searchText: query,
      }),
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const data: WorkdayResponse = await res.json();
    const jobs = data.jobPostings ?? [];
    const companyName = companySlug.replace(/\b\w/g, c => c.toUpperCase());

    return jobs.map(job => {
      const applyUrl = `https://${subdomain}.wd1.myworkdayjobs.com${job.externalPath}`;
      return {
        id: generateJobId(job.title, companySlug, job.locationsText, 'workday'),
        title: job.title,
        company: companyName,
        location: job.locationsText || 'Not specified',
        description: job.jobFamilyGroup?.summary ?? `${job.title} at ${companyName}`,
        applyUrl,
        postedAt: job.postedOn ? new Date(job.postedOn) : new Date(),
        source: 'workday' as const,
        isRemote:
          (job.remoteType ?? '').toLowerCase().includes('remote') ||
          job.locationsText.toLowerCase().includes('remote'),
        employmentType: undefined,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchWorkday(query: string, companies: string[]): Promise<UnifiedJob[]> {
  // Only fetch companies we have Workday config for
  const validCompanies = companies.filter(c => WORKDAY_COMPANIES[c]);

  const results = await Promise.allSettled(
    validCompanies.map(company => fetchCompanyJobs(company, query))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<UnifiedJob[]>).value);
}
