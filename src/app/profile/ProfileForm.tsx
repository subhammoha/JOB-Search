'use client';

import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { UserProfile } from '@/types/profile';
import { User, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function TagInput({ value, onChange, placeholder }: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  return (
    <div>
      <div className="flex gap-2 mb-2 flex-wrap">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter(v => v !== tag))}
              className="text-blue-400 hover:text-blue-700 ml-0.5 text-xs leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function ProfileForm() {
  const { profile, saveProfile } = useProfile();
  const [form, setForm] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to search
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <User className="w-6 h-6 text-blue-600" />
        My Profile
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Set your preferences to get AI-powered match scores on job listings.
      </p>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Target roles */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Target Roles
          </label>
          <p className="text-xs text-gray-500 mb-2">Press Enter or click Add after each role</p>
          <TagInput
            value={form.targetRoles}
            onChange={v => setForm(f => ({ ...f, targetRoles: v }))}
            placeholder="e.g. Staff Engineer"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Key Skills
          </label>
          <p className="text-xs text-gray-500 mb-2">Technologies and tools you want to work with</p>
          <TagInput
            value={form.skills}
            onChange={v => setForm(f => ({ ...f, skills: v }))}
            placeholder="e.g. TypeScript, React, Python"
          />
        </div>

        {/* Salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Minimum Salary (USD/year)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min={0}
              step={10000}
              value={form.salaryMin || ''}
              onChange={e => setForm(f => ({ ...f, salaryMin: parseInt(e.target.value) || 0 }))}
              placeholder="120000"
              className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Years of Experience
          </label>
          <input
            type="number"
            min={0}
            max={40}
            value={form.experienceYears || ''}
            onChange={e => setForm(f => ({ ...f, experienceYears: parseInt(e.target.value) || 0 }))}
            placeholder="5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Remote preference */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Work Preference
          </label>
          <div className="flex gap-3">
            {(['any', 'remote', 'hybrid'] as const).map(val => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="remote"
                  value={val}
                  checked={form.remotePreference === val}
                  onChange={() => setForm(f => ({ ...f, remotePreference: val }))}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700 capitalize">{val === 'any' ? 'No preference' : val}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Visa */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.visaRequired}
              onChange={e => setForm(f => ({ ...f, visaRequired: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <div>
              <span className="text-sm font-semibold text-gray-800">I need H1B visa sponsorship</span>
              <p className="text-xs text-gray-500">Only show jobs from confirmed H1B sponsors</p>
            </div>
          </label>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            'Save Profile'
          )}
        </button>
      </form>
    </div>
  );
}
