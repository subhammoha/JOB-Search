'use client';

import { FilterState, JobSource } from '@/types/job';
import { SlidersHorizontal } from 'lucide-react';

const ALL_SOURCES: { id: JobSource; label: string; direct?: boolean }[] = [
  { id: 'jsearch', label: 'Indeed/LinkedIn' },
  { id: 'adzuna', label: 'Adzuna' },
  { id: 'themuse', label: 'The Muse' },
  { id: 'arbeitnow', label: 'Arbeitnow' },
  { id: 'remotive', label: 'Remotive' },
  { id: 'greenhouse', label: 'Greenhouse', direct: true },
  { id: 'lever', label: 'Lever', direct: true },
  { id: 'ashby', label: 'Ashby', direct: true },
];

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalJobs: number;
  filteredJobs: number;
}

export function SearchFilters({ filters, onChange, totalJobs, filteredJobs }: SearchFiltersProps) {
  function toggleSource(source: JobSource) {
    const current = filters.sources;
    const updated = current.includes(source)
      ? current.filter(s => s !== source)
      : [...current, source];
    onChange({ ...filters, sources: updated });
  }

  return (
    <aside className="space-y-5">
      <div className="flex items-center gap-2 font-semibold text-gray-800">
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        {totalJobs > 0 && (
          <span className="ml-auto text-xs font-normal text-gray-500">
            {filteredJobs} of {totalJobs}
          </span>
        )}
      </div>

      {/* Source filter */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Job Boards</p>
        <div className="space-y-1.5 mb-3">
          {ALL_SOURCES.filter(s => !s.direct).map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sources.includes(id)}
                onChange={() => toggleSource(id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Direct ATS</p>
        <div className="space-y-1.5">
          {ALL_SOURCES.filter(s => s.direct).map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sources.includes(id)}
                onChange={() => toggleSource(id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Work type filter */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Work Type</p>
        <div className="space-y-1.5">
          {(['all', 'remote', 'onsite'] as const).map(val => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="remote"
                value={val}
                checked={filters.remoteFilter === val}
                onChange={() => onChange({ ...filters, remoteFilter: val })}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{val === 'all' ? 'All' : val === 'remote' ? 'Remote only' : 'On-site only'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Smart Filters</p>
        <div className="space-y-2">
          <Toggle
            label="Hide staffing agencies"
            checked={filters.hideConsultancies}
            onChange={v => onChange({ ...filters, hideConsultancies: v })}
          />
          <Toggle
            label="Only H1B sponsors"
            checked={filters.onlyH1bSponsors}
            onChange={v => onChange({ ...filters, onlyH1bSponsors: v })}
          />
          <Toggle
            label="Hide 200+ applicants"
            checked={filters.hideHighApplicants}
            onChange={v => onChange({ ...filters, hideHighApplicants: v })}
          />
        </div>
      </div>

      {/* Date posted */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date Posted</p>
        <div className="space-y-1.5">
          {([
            { val: 'any', label: 'Any time' },
            { val: '24h', label: 'Past 24 hours' },
            { val: 'week', label: 'Past week' },
            { val: 'month', label: 'Past month' },
          ] as const).map(({ val, label }) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="datePosted"
                value={val}
                checked={filters.datePosted === val}
                onChange={() => onChange({ ...filters, datePosted: val })}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
