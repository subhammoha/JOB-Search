import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description: string;
  job_apply_link: string;
  job_posted_at_datetime_utc?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_employment_type?: string;
  job_is_remote?: boolean;
  job_num_active_applicants?: number;
}

interface JSearchResponse {
  data: JSearchJob[];
}

// Track remaining quota across requests (module-level, resets on cold start)
let rateLimitRemaining: number | null = null;

export function getJSearchRateLimitRemaining() {
  return rateLimitRemaining;
}

function formatSalary(min?: number, max?: number, currency = 'USD'): string | undefined {
  if (!min && !max) return undefined;
  const fmt = (n: number) =>
    currency === 'USD' ? `$${Math.round(n / 1000)}k` : `${Math.round(n / 1000)}k ${currency}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return undefined;
}

export async function fetchJSearch(query: string, location?: string, page = 1): Promise<UnifiedJob[]> {
  const apiKey = process.env.JSEARCH_RAPIDAPI_KEY;
  if (!apiKey) throw new Error('JSearch API key not configured');

  // Conserve quota — skip if nearly exhausted
  if (rateLimitRemaining !== null && rateLimitRemaining <= 5) {
    console.warn(`[jsearch] Quota nearly exhausted (${rateLimitRemaining} remaining). Skipping request.`);
    return [];
  }

  const searchQuery = location ? `${query} in ${location}` : query;

  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&page=${page}&num_pages=1&date_posted=all`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      next: { revalidate: 300 },
    }
  );

  // Read rate limit header
  const remaining = res.headers.get('X-RateLimit-Requests-Remaining');
  if (remaining !== null) {
    rateLimitRemaining = parseInt(remaining, 10);
  }

  if (res.status === 429) {
    console.warn('[jsearch] Rate limit hit (429)');
    rateLimitRemaining = 0;
    return [];
  }

  if (!res.ok) throw new Error(`JSearch API error: ${res.status}`);

  const data: JSearchResponse = await res.json();

  return data.data.map(job => {
    const loc = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ');
    return {
      id: generateJobId(job.job_title, job.employer_name, loc, 'jsearch'),
      title: job.job_title,
      company: job.employer_name,
      location: loc || 'Not specified',
      salary: formatSalary(job.job_min_salary, job.job_max_salary, job.job_salary_currency),
      description: job.job_description.slice(0, 500),
      applyUrl: job.job_apply_link,
      postedAt: job.job_posted_at_datetime_utc
        ? new Date(job.job_posted_at_datetime_utc)
        : new Date(),
      source: 'jsearch' as const,
      applicantCount: job.job_num_active_applicants,
      isRemote: job.job_is_remote ?? false,
      employmentType: job.job_employment_type,
      logoUrl: job.employer_logo,
    };
  });
}
