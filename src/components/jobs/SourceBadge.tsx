import { cn } from '@/lib/utils';
import { JobSource } from '@/types/job';

const SOURCE_LABELS: Record<JobSource, string> = {
  jsearch: 'Indeed/LinkedIn',
  adzuna: 'Adzuna',
  themuse: 'The Muse',
  arbeitnow: 'Arbeitnow',
  remotive: 'Remotive',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  workday: 'Workday',
};

const SOURCE_COLORS: Record<JobSource, string> = {
  jsearch: 'bg-blue-50 text-blue-700 border-blue-200',
  adzuna: 'bg-orange-50 text-orange-700 border-orange-200',
  themuse: 'bg-purple-50 text-purple-700 border-purple-200',
  arbeitnow: 'bg-green-50 text-green-700 border-green-200',
  remotive: 'bg-teal-50 text-teal-700 border-teal-200',
  greenhouse: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lever: 'bg-rose-50 text-rose-700 border-rose-200',
  ashby: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  workday: 'bg-sky-50 text-sky-700 border-sky-200',
};

export function SourceBadge({ source, className }: { source: JobSource; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        SOURCE_COLORS[source],
        className
      )}
    >
      via {SOURCE_LABELS[source]}
    </span>
  );
}
