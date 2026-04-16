import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { UnifiedJob } from '@/types/job';
import { UserProfile } from '@/types/profile';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory cache: key = jobId + profile hash, value = { score, reason }
const cache = new Map<string, { score: number; reason: string }>();

function profileHash(p: UserProfile): string {
  return JSON.stringify([p.targetRoles, p.skills, p.salaryMin, p.visaRequired, p.remotePreference]);
}

function buildPrompt(job: UnifiedJob, profile: UserProfile): string {
  const candidate = [
    profile.targetRoles.length > 0 && `Target roles: ${profile.targetRoles.join(', ')}`,
    profile.skills.length > 0 && `Skills: ${profile.skills.join(', ')}`,
    profile.salaryMin > 0 && `Salary floor: $${(profile.salaryMin / 1000).toFixed(0)}k`,
    profile.visaRequired && 'Needs H1B sponsorship',
    profile.remotePreference !== 'any' && `Preference: ${profile.remotePreference}`,
    profile.experienceYears > 0 && `Experience: ${profile.experienceYears} years`,
  ].filter(Boolean).join(' | ');

  return `Rate this job for a candidate. Return JSON only: {"score": <1-10>, "reason": "<15 words max>"}

Candidate: ${candidate}
Job: ${job.title} at ${job.company}, ${job.location}${job.isRemote ? ' (Remote)' : ''}${job.salary ? `, ${job.salary}` : ''}
Description: ${job.description?.slice(0, 300) ?? ''}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Match scoring not configured' }, { status: 503 });
  }

  const { jobs, profile }: { jobs: UnifiedJob[]; profile: UserProfile } = await req.json();

  if (!jobs?.length || !profile) {
    return NextResponse.json({ error: 'Missing jobs or profile' }, { status: 400 });
  }

  const pHash = profileHash(profile);
  const results: Record<string, { score: number; reason: string }> = {};

  // Check cache first
  const toScore: UnifiedJob[] = [];
  for (const job of jobs.slice(0, 30)) {
    const key = `${job.id}:${pHash}`;
    const cached = cache.get(key);
    if (cached) {
      results[job.id] = cached;
    } else {
      toScore.push(job);
    }
  }

  // Score uncached jobs in parallel (max 5 concurrent)
  const CONCURRENCY = 5;
  for (let i = 0; i < toScore.length; i += CONCURRENCY) {
    const batch = toScore.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async job => {
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 80,
          messages: [{ role: 'user', content: buildPrompt(job, profile) }],
        });
        const text = (msg.content[0] as { type: string; text: string }).text.trim();
        const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
        return { job, score: Number(parsed.score) || 5, reason: parsed.reason ?? '' };
      })
    );

    for (const r of settled) {
      if (r.status === 'fulfilled') {
        const { job, score, reason } = r.value;
        const entry = { score, reason };
        results[job.id] = entry;
        cache.set(`${job.id}:${pHash}`, entry);
        // Evict if cache too large
        if (cache.size > 2000) {
          const firstKey = cache.keys().next().value;
          if (firstKey) cache.delete(firstKey);
        }
      }
    }
  }

  return NextResponse.json(results);
}
