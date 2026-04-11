import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConsultancyResult } from '@/types/enrich';

export function ConsultancyBadge({ consultancy, className }: { consultancy?: ConsultancyResult | null; className?: string }) {
  if (!consultancy?.isConsultancy) return null;

  const { confidence, reason } = consultancy;

  if (confidence === 'high') {
    return (
      <span
        className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200', className)}
        title={reason}
      >
        <AlertTriangle className="w-3 h-3" />
        Staffing Agency
      </span>
    );
  }

  if (confidence === 'medium') {
    return (
      <span
        className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-amber-50 text-amber-600 border-amber-200', className)}
        title={reason}
      >
        <AlertTriangle className="w-3 h-3" />
        Likely Consulting Firm
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-yellow-50 text-yellow-700 border-yellow-200', className)}
      title={reason}
    >
      <Info className="w-3 h-3" />
      May be placement role
    </span>
  );
}
