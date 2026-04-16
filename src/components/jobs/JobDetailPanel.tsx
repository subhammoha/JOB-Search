'use client';

import { useEffect } from 'react';
import { UnifiedJob } from '@/types/job';
import { SourceBadge } from './SourceBadge';
import { X, ExternalLink, MapPin, DollarSign, Wifi, Clock, Building2 } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

interface JobDetailPanelProps {
  job: UnifiedJob | null;
  onClose: () => void;
}

export function JobDetailPanel({ job, onClose }: JobDetailPanelProps) {
  // Close on ESC
  useEffect(() => {
    if (!job) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [job, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (job) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [job]);

  if (!job) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed top-14 right-0 bottom-0 z-50 w-full sm:w-[480px] bg-white shadow-xl flex flex-col border-l border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="min-w-0">
            <SourceBadge source={job.source} className="mb-2" />
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <Building2 className="w-3.5 h-3.5" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
              {job.isRemote && (
                <span className="flex items-center gap-1 text-teal-600 font-medium">
                  <Wifi className="w-3.5 h-3.5" />
                  Remote
                </span>
              )}
            </div>
            {job.salary && (
              <div className="flex items-center gap-1 mt-1.5 text-sm text-green-700 font-medium">
                <DollarSign className="w-3.5 h-3.5" />
                {job.salary}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatRelativeDate(new Date(job.postedAt))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mt-0.5"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable description */}
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Job Description</h3>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {job.description || 'No description available.'}
          </div>
        </div>

        {/* Footer — apply button */}
        <div className="p-5 border-t border-gray-100 bg-gray-50">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Apply for this role
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </>
  );
}
