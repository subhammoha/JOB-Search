'use client';

import { MapPin, Clock, DollarSign, ExternalLink, Bookmark, BookmarkCheck, Wifi } from 'lucide-react';
import { UnifiedJob } from '@/types/job';
import { EnrichmentResult } from '@/types/enrich';
import { formatRelativeDate, cn } from '@/lib/utils';
import { SourceBadge } from './SourceBadge';
import { ApplicantBadge } from './ApplicantBadge';
import { H1BSponsorBadge } from './H1BSponsorBadge';
import { ConsultancyBadge } from './ConsultancyBadge';

interface JobCardProps {
  job: UnifiedJob;
  enrichment?: EnrichmentResult;
  enrichmentLoading?: boolean;
  isBookmarked: boolean;
  onBookmarkToggle: (job: UnifiedJob) => void;
}

export function JobCard({ job, enrichment, enrichmentLoading, isBookmarked, onBookmarkToggle }: JobCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Top row: source + date + bookmark */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <SourceBadge source={job.source} />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeDate(new Date(job.postedAt))}
          </span>
          <button
            onClick={() => onBookmarkToggle(job)}
            className="text-gray-400 hover:text-blue-600 transition-colors p-0.5"
            title={isBookmarked ? 'Remove bookmark' : 'Save job'}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Save job'}
          >
            {isBookmarked
              ? <BookmarkCheck className="w-4 h-4 text-blue-600" />
              : <Bookmark className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 leading-snug">
          {job.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{job.company}</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {job.location}
          </span>
          {job.isRemote && (
            <span className="flex items-center gap-1 text-teal-600 font-medium">
              <Wifi className="w-3 h-3" />
              Remote
            </span>
          )}
        </div>
        {job.salary && (
          <div className="flex items-center gap-1 mt-1 text-sm text-green-700 font-medium">
            <DollarSign className="w-3 h-3" />
            {job.salary}
          </div>
        )}
      </div>

      {/* Enrichment badges */}
      <div className={cn('flex flex-wrap gap-1.5 min-h-[22px]', enrichmentLoading && 'opacity-50')}>
        {enrichment ? (
          <>
            <H1BSponsorBadge h1b={enrichment.h1b} />
            <ConsultancyBadge consultancy={enrichment.consultancy} />
            <ApplicantBadge count={job.applicantCount} />
          </>
        ) : enrichmentLoading ? (
          <>
            <div className="h-5 bg-gray-100 rounded w-24 animate-pulse" />
            <div className="h-5 bg-gray-100 rounded w-20 animate-pulse" />
          </>
        ) : (
          <ApplicantBadge count={job.applicantCount} />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      {/* Apply button */}
      <div className="flex justify-end mt-auto pt-1">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Apply
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
