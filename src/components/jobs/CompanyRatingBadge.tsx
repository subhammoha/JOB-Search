import { TrendingUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LevelsResult } from '@/types/enrich';

interface Props {
  levels?: LevelsResult | null;
  company: string;
  className?: string;
}

function buildGlassdoorUrl(company: string): string {
  return `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(company)}`;
}

export function CompanyRatingBadge({ levels, company, className }: Props) {
  // Always show Glassdoor link. Augment with Levels.fyi comp data if available.
  const glassdoorUrl = buildGlassdoorUrl(company);

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {/* Glassdoor reviews link — always shown */}
      <a
        href={glassdoorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors"
        title="View company reviews on Glassdoor"
      >
        <ExternalLink className="w-3 h-3" />
        Reviews
      </a>

      {/* Levels.fyi comp data — shown only if available */}
      {levels?.avgComp && (
        <a
          href={levels.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 transition-colors"
          title={`Average total compensation based on ${levels.reviewCount} data points from Levels.fyi`}
        >
          <TrendingUp className="w-3 h-3" />
          {levels.avgComp} avg
        </a>
      )}
    </div>
  );
}
