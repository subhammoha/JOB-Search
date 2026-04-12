import { LevelsResult } from '@/types/enrich';

const levelsCache = new Map<string, LevelsResult | null>();

function normalizeCompany(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function buildLevelsUrl(company: string): string {
  const slug = normalizeCompany(company);
  return `https://www.levels.fyi/companies/${slug}/`;
}

export async function fetchLevelsData(company: string): Promise<LevelsResult | null> {
  const key = company.toLowerCase().trim();
  if (levelsCache.has(key)) return levelsCache.get(key)!;

  // Levels.fyi doesn't have an officially documented public API,
  // but their company data endpoint is publicly accessible.
  const slug = normalizeCompany(company);
  const url = `https://www.levels.fyi/js/salaryData.json`;

  try {
    // We use the publicly available salary data endpoint
    // and filter for the company by name match
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // cache for 24h
    });

    if (!res.ok) {
      levelsCache.set(key, null);
      return null;
    }

    // Levels.fyi salary data is a large JSON array
    // We scan for entries matching this company
    const data: Array<{
      company: string;
      totalyearlycompensation?: number;
    }> = await res.json();

    const companyLower = company.toLowerCase();
    const matches = data.filter(
      entry => entry.company?.toLowerCase() === companyLower
    );

    if (matches.length === 0) {
      levelsCache.set(key, null);
      return null;
    }

    const comps = matches
      .map(m => m.totalyearlycompensation ?? 0)
      .filter(c => c > 0);

    const avgComp =
      comps.length > 0
        ? `$${Math.round(comps.reduce((a, b) => a + b, 0) / comps.length / 1000)}k TC`
        : undefined;

    const result: LevelsResult = {
      rating: null as unknown as number, // Levels.fyi doesn't expose ratings in this dataset
      reviewCount: matches.length,
      avgComp,
      url: buildLevelsUrl(company),
    };

    levelsCache.set(key, result);
    return result;
  } catch {
    levelsCache.set(key, null);
    return null;
  }
}
