import { ShieldCheck, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { H1BResult } from '@/types/enrich';

export function H1BSponsorBadge({ h1b, className }: { h1b?: H1BResult; className?: string }) {
  if (!h1b) {
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-gray-50 text-gray-400 border-gray-200', className)}>
        <ShieldQuestion className="w-3 h-3" />
        H1B Unknown
      </span>
    );
  }

  if (h1b.sponsors === true) {
    return (
      <span
        className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-green-50 text-green-700 border-green-200', className)}
        title={h1b.filingCount ? `${h1b.filingCount.toLocaleString()} H1B filings (${h1b.lastYear})` : 'Known H1B sponsor'}
      >
        <ShieldCheck className="w-3 h-3" />
        Sponsors H1B
        {h1b.filingCount ? ` (${h1b.filingCount.toLocaleString()})` : ''}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-gray-50 text-gray-500 border-gray-200', className)}>
      <ShieldQuestion className="w-3 h-3" />
      H1B Unknown
    </span>
  );
}
