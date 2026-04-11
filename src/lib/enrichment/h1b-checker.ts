import { H1BResult } from '@/types/enrich';

// Module-level cache to avoid re-parsing JSON on every request
let h1bData: Record<string, { count: number; lastYear: number }> | null = null;
const fuzzyCache = new Map<string, H1BResult>();

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|corp|ltd|co|incorporated|limited|plc|lp|na|llp|pllc|pa)\b\.?/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadH1BData(): Promise<Record<string, { count: number; lastYear: number }>> {
  if (h1bData) return h1bData;

  try {
    // Dynamic import of the JSON data file
    const data = await import('@/data/h1b-sponsors.json');
    h1bData = data.default as Record<string, { count: number; lastYear: number }>;
    return h1bData;
  } catch {
    // File may not exist yet (before running the update script)
    console.warn('[h1b-checker] h1b-sponsors.json not found. Run: pnpm run update-h1b');
    h1bData = {};
    return h1bData;
  }
}

export async function checkH1BSponsor(company: string): Promise<H1BResult> {
  const normalized = normalizeCompanyName(company);

  // Check fuzzy cache first
  if (fuzzyCache.has(normalized)) {
    return fuzzyCache.get(normalized)!;
  }

  const data = await loadH1BData();

  // Layer 1: Exact match on normalized name
  if (data[normalized]) {
    const entry = data[normalized];
    const result: H1BResult = { sponsors: true, filingCount: entry.count, lastYear: entry.lastYear };
    fuzzyCache.set(normalized, result);
    return result;
  }

  // Layer 2: Substring match
  // Check if any key contains the normalized name or vice versa
  let bestMatch: { key: string; entry: { count: number; lastYear: number } } | null = null;

  for (const [key, entry] of Object.entries(data)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      if (!bestMatch || entry.count > bestMatch.entry.count) {
        bestMatch = { key, entry };
      }
    }
  }

  if (bestMatch) {
    const result: H1BResult = {
      sponsors: true,
      filingCount: bestMatch.entry.count,
      lastYear: bestMatch.entry.lastYear,
    };
    fuzzyCache.set(normalized, result);
    return result;
  }

  // Layer 3: Unknown — not in dataset
  const unknown: H1BResult = { sponsors: null };
  fuzzyCache.set(normalized, unknown);
  return unknown;
}
