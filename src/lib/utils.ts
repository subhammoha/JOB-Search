import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function generateJobId(title: string, company: string, location: string, source: string): string {
  const raw = `${title}-${company}-${location}-${source}`.toLowerCase().replace(/\s+/g, '-');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${source}-${Math.abs(hash).toString(36)}`;
}

export function deduplicateJobKey(title: string, company: string, location: string): string {
  return `${title}-${company}-${location}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
