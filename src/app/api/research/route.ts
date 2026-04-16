import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface CompanyResearch {
  overview: string;
  techStack: string[];
  culture: string;
  funding: string;
  recentNews: string;
  verdict: string;
}

const cache = new Map<string, { data: CompanyResearch; cachedAt: number }>();
const TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get('company');
  if (!company?.trim()) {
    return NextResponse.json({ error: 'Missing company' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Research not configured' }, { status: 503 });
  }

  const key = company.toLowerCase().trim();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.cachedAt < TTL) {
    return NextResponse.json(cached.data);
  }

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Research "${company}" as a tech employer. Return valid JSON only, no markdown, matching exactly this structure:
{
  "overview": "2-3 sentence company overview covering product, industry, and size",
  "techStack": ["list", "of", "known", "technologies"],
  "culture": "1-2 sentences on engineering culture and work environment",
  "funding": "funding stage and notable investors or revenue info if public",
  "recentNews": "most notable recent development in the last year",
  "verdict": "1 sentence on whether engineers should be excited to apply here"
}`,
    }],
  });

  try {
    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
    const data: CompanyResearch = JSON.parse(jsonStr);

    cache.set(key, { data, cachedAt: Date.now() });
    if (cache.size > 500) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to parse research response' }, { status: 500 });
  }
}
