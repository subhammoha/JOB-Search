import { NextRequest, NextResponse } from 'next/server';
import { aggregateJobs } from '@/lib/aggregator';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim();
  const location = searchParams.get('location')?.trim() || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  if (q.length > 200) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  try {
    const result = await aggregateJobs({ q, location, page });

    return NextResponse.json({
      jobs: result.jobs.map(job => ({
        ...job,
        postedAt: job.postedAt.toISOString(),
      })),
      meta: {
        total: result.jobs.length,
        failedSources: result.failedSources,
        successfulSources: result.successfulSources,
        rateLimitWarning: result.rateLimitWarning,
      },
    });
  } catch (err) {
    console.error('[/api/jobs] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
