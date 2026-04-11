import { NextRequest, NextResponse } from 'next/server';
import { checkH1BSponsor } from '@/lib/enrichment/h1b-checker';
import { detectConsultancy } from '@/lib/enrichment/consultancy-detector';
import { enrichmentCache } from '@/lib/cache';
import { EnrichmentMap } from '@/types/enrich';

export async function POST(req: NextRequest) {
  let body: { companies: { name: string; description?: string }[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.companies) || body.companies.length === 0) {
    return NextResponse.json({ error: 'companies array required' }, { status: 400 });
  }

  if (body.companies.length > 50) {
    return NextResponse.json({ error: 'Too many companies (max 50)' }, { status: 400 });
  }

  const result: EnrichmentMap = {};

  await Promise.all(
    body.companies.map(async ({ name, description }) => {
      const cacheKey = name.toLowerCase().trim();

      if (enrichmentCache.has(cacheKey)) {
        result[name] = enrichmentCache.get(cacheKey)!;
        return;
      }

      const [h1b, consultancy] = await Promise.all([
        checkH1BSponsor(name),
        Promise.resolve(detectConsultancy(name, description)),
      ]);

      const enrichment = { h1b, consultancy };
      enrichmentCache.set(cacheKey, enrichment);
      result[name] = enrichment;
    })
  );

  return NextResponse.json(result);
}
