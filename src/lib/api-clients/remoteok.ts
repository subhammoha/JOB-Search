import { UnifiedJob } from '@/types/job';
import { generateJobId } from '@/lib/utils';

interface RemoteOKJob {
  slug: string;
  position: string;
  company: string;
  location?: string;
  tags?: string[];
  url: string;
  date: string; // unix epoch as string
  salary_min?: number;
  salary_max?: number;
  description?: string;
}

export async function fetchRemoteOK(query: string): Promise<UnifiedJob[]> {
  const res = await fetch('https://remoteok.com/api', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; JobSearchAggregator/1.0; +https://github.com)',
      'Accept': 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`RemoteOK API error: ${res.status}`);

  const raw = await res.json();
  // First element is metadata — skip it
  const jobs: RemoteOKJob[] = Array.isArray(raw) ? raw.slice(1) : [];

  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);

  return jobs
    .filter(job => {
      if (!job.position || !job.company) return false;
      const searchText = `${job.position} ${(job.tags ?? []).join(' ')}`.toLowerCase();
      return queryWords.some(w => searchText.includes(w));
    })
    .map(job => {
      const salary =
        job.salary_min && job.salary_max
          ? `$${Math.round(job.salary_min / 1000)}k – $${Math.round(job.salary_max / 1000)}k`
          : undefined;

      const epochMs = parseInt(job.date, 10);
      const postedAt = Number.isFinite(epochMs) ? new Date(epochMs * 1000) : new Date();

      return {
        id: generateJobId(job.position, job.company, job.location ?? 'Remote', 'remoteok'),
        title: job.position,
        company: job.company,
        location: job.location || 'Remote',
        salary,
        description: (job.description ?? '').replace(/<[^>]+>/g, '').slice(0, 500),
        applyUrl: job.url,
        postedAt,
        source: 'remoteok' as const,
        isRemote: true,
      };
    });
}
