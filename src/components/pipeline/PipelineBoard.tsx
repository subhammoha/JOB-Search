'use client';

import { useState } from 'react';
import { usePipeline, PipelineStatus, PipelineEntry } from '@/hooks/usePipeline';
import { SourceBadge } from '@/components/jobs/SourceBadge';
import { Download, Trash2, ExternalLink, ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';

const STATUSES: { value: PipelineStatus; label: string; color: string }[] = [
  { value: 'saved',       label: 'Saved',       color: 'bg-gray-100 text-gray-700' },
  { value: 'applied',     label: 'Applied',     color: 'bg-blue-100 text-blue-700' },
  { value: 'interviewing',label: 'Interviewing',color: 'bg-purple-100 text-purple-700' },
  { value: 'offer',       label: 'Offer',       color: 'bg-green-100 text-green-700' },
  { value: 'rejected',    label: 'Rejected',    color: 'bg-red-100 text-red-700' },
];

function statusColor(s: PipelineStatus) {
  return STATUSES.find(x => x.value === s)?.color ?? 'bg-gray-100 text-gray-700';
}

function PipelineRow({ entry, onStatusChange, onNotesChange, onRemove }: {
  entry: PipelineEntry;
  onStatusChange: (id: string, s: PipelineStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(entry.notes);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 min-w-[220px]">
        <div className="font-medium text-gray-900 text-sm leading-snug">{entry.job.title}</div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
          <span>{entry.job.company}</span>
          <span>·</span>
          <span>{entry.job.location}</span>
        </div>
        <div className="mt-1">
          <SourceBadge source={entry.job.source} />
        </div>
      </td>

      <td className="px-4 py-3">
        <select
          value={entry.status}
          onChange={e => onStatusChange(entry.job.id, e.target.value as PipelineStatus)}
          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColor(entry.status)}`}
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {new Date(entry.addedAt).toLocaleDateString()}
      </td>

      <td className="px-4 py-3 min-w-[160px]">
        {editingNotes ? (
          <input
            autoFocus
            value={notesValue}
            onChange={e => setNotesValue(e.target.value)}
            onBlur={() => { onNotesChange(entry.job.id, notesValue); setEditingNotes(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { onNotesChange(entry.job.id, notesValue); setEditingNotes(false); } }}
            className="w-full text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Add notes…"
          />
        ) : (
          <span
            className="text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setEditingNotes(true)}
          >
            {entry.notes || <span className="italic text-gray-300">Add notes…</span>}
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <a
            href={entry.job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Apply"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => onRemove(entry.job.id)}
            className="text-gray-300 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function PipelineBoard() {
  const { getAll, loaded, updateStatus, updateNotes, remove, exportCSV } = usePipeline();

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const entries = getAll().sort((a, b) =>
    new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.value] = entries.filter(e => e.status === s.value).length;
    return acc;
  }, {} as Record<PipelineStatus, number>);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to search
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Job Pipeline
            {entries.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-1">({entries.length} jobs)</span>
            )}
          </h1>
        </div>
        {entries.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Status summary pills */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map(s => counts[s.value] > 0 && (
            <span key={s.value} className={`px-3 py-1 rounded-full text-xs font-medium ${s.color}`}>
              {s.label}: {counts[s.value]}
            </span>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <ClipboardList className="w-12 h-12 text-gray-200" />
          <div>
            <p className="font-semibold text-gray-700">Your pipeline is empty</p>
            <p className="text-sm text-gray-500 mt-1">
              Bookmark jobs from search results to track them here.
            </p>
          </div>
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Search Jobs
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {entries.map(entry => (
                <PipelineRow
                  key={entry.job.id}
                  entry={entry}
                  onStatusChange={updateStatus}
                  onNotesChange={updateNotes}
                  onRemove={remove}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
