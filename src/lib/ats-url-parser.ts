import { UnifiedJob } from '@/types/job';

export type ATSType = 'greenhouse' | 'lever' | 'ashby';

export interface ATSTarget {
  ats: ATSType;
  slug: string;
}

const GREENHOUSE_RE = /(?:boards|job-boards)\.greenhouse\.io\/([a-zA-Z0-9_-]+)/;
const LEVER_RE = /jobs\.lever\.co\/([a-zA-Z0-9_-]+)/;
const ASHBY_RE = /jobs\.ashbyhq\.com\/([a-zA-Z0-9_-]+)/;

function extractTarget(url: string): ATSTarget | null {
  let m = url.match(GREENHOUSE_RE);
  if (m) return { ats: 'greenhouse', slug: m[1] };

  m = url.match(LEVER_RE);
  if (m) return { ats: 'lever', slug: m[1] };

  m = url.match(ASHBY_RE);
  if (m) return { ats: 'ashby', slug: m[1] };

  return null;
}

/** Extract unique ATS company slugs from job board results' apply URLs. */
export function parseATSSlugs(jobs: UnifiedJob[]): ATSTarget[] {
  const seen = new Set<string>();
  const targets: ATSTarget[] = [];

  for (const job of jobs) {
    if (!job.applyUrl) continue;
    const target = extractTarget(job.applyUrl);
    if (!target) continue;
    const key = `${target.ats}:${target.slug}`;
    if (!seen.has(key)) {
      seen.add(key);
      targets.push(target);
    }
  }

  return targets;
}

/** Merge seed list with dynamically discovered targets, deduplicating by ats+slug. */
export function mergeATSTargets(seed: ATSTarget[], discovered: ATSTarget[]): ATSTarget[] {
  const seen = new Set<string>();
  const merged: ATSTarget[] = [];

  for (const t of [...seed, ...discovered]) {
    const key = `${t.ats}:${t.slug}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(t);
    }
  }

  return merged;
}
