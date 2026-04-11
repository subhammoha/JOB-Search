import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flagApplicants } from '@/lib/enrichment/applicant-flagger';

export function ApplicantBadge({ count, className }: { count?: number; className?: string }) {
  const level = flagApplicants(count);
  if (level === 'normal' || !count) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
        level === 'high'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-orange-50 text-orange-700 border-orange-200',
        className
      )}
      title={`${count} applicants have applied`}
    >
      <Users className="w-3 h-3" />
      {count}+ applicants
    </span>
  );
}
