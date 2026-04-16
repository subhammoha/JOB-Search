'use client';

import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Building2, Cpu, Heart, TrendingUp, Newspaper, Star } from 'lucide-react';
import { CompanyResearch } from '@/app/api/research/route';

interface CompanyResearchModalProps {
  company: string;
  onClose: () => void;
}

interface Section {
  icon: React.ReactNode;
  label: string;
  key: keyof CompanyResearch;
}

const SECTIONS: Section[] = [
  { icon: <Building2 className="w-4 h-4" />, label: 'Overview', key: 'overview' },
  { icon: <Cpu className="w-4 h-4" />, label: 'Tech Stack', key: 'techStack' },
  { icon: <Heart className="w-4 h-4" />, label: 'Culture', key: 'culture' },
  { icon: <TrendingUp className="w-4 h-4" />, label: 'Funding', key: 'funding' },
  { icon: <Newspaper className="w-4 h-4" />, label: 'Recent News', key: 'recentNews' },
  { icon: <Star className="w-4 h-4" />, label: 'Verdict', key: 'verdict' },
];

export function CompanyResearchModal({ company, onClose }: CompanyResearchModalProps) {
  const { data, isLoading, isError } = useQuery<CompanyResearch>({
    queryKey: ['research', company],
    queryFn: async () => {
      const res = await fetch(`/api/research?company=${encodeURIComponent(company)}`);
      if (!res.ok) throw new Error('Research failed');
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — matches server cache
    retry: false,
  });

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{company}</h2>
              <p className="text-xs text-gray-400 mt-0.5">AI company research · powered by Claude</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {isLoading && (
              <div className="space-y-4">
                {SECTIONS.map(s => (
                  <div key={s.key} className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                    <div className="h-3 bg-gray-50 rounded w-full animate-pulse" />
                    <div className="h-3 bg-gray-50 rounded w-4/5 animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="text-center py-8 text-gray-500">
                <p className="font-medium">Could not load research</p>
                <p className="text-sm mt-1 text-gray-400">Make sure ANTHROPIC_API_KEY is configured.</p>
              </div>
            )}

            {data && SECTIONS.map(section => {
              const value = data[section.key];
              if (!value) return null;

              return (
                <div key={section.key}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {section.icon}
                    {section.label}
                  </div>
                  {section.key === 'techStack' && Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(value as string[]).map(tech => (
                        <span key={tech} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm text-gray-700 leading-relaxed ${section.key === 'verdict' ? 'font-medium text-gray-900' : ''}`}>
                      {value as string}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
