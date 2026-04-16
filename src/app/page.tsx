import { SearchBar } from '@/components/search/SearchBar';
import { SavedSearchChips } from '@/components/search/SavedSearchChips';
import { Briefcase, ShieldCheck, AlertTriangle, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
          <Briefcase className="w-4 h-4" />
          Aggregates Jobs From Everywhere and Show at One Place
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Find your next job,<br />
          <span className="text-blue-600">smarter.</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          Search across all major job boards at once. Instantly flag H1B sponsors(If Data Is Avalible,
          avoid staffing agencies, and spot high-competition listings — all in one place.
        </p>
      </div>

      {/* Search form */}
      <div className="w-full max-w-3xl mb-4 flex flex-col items-center">
        <SearchBar />
        <SavedSearchChips />
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600 max-w-xl mt-8">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700">
          <ShieldCheck className="w-4 h-4" />
          H1B Visa Sponsorship
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700">
          <AlertTriangle className="w-4 h-4" />
          Staffing Agency Detection
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-700">
          <Users className="w-4 h-4" />
          Application Count Alerts
        </div>
      </div>

      {/* Example searches */}
      <div className="mt-10 text-center">
        <p className="text-xs text-gray-400 mb-3">Try searching for</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Salesforce Administrator', 'Salesforce Developer', 'Salesforce Architect', 'Salesforce Solution Architect', 'Salesforce Technical Architect', 'Salesforce Consultant', 'Salesforce Business Analyst', 'Salesforce Project Manager', 'Salesforce Product Manager', 'Salesforce Manager', 'Salesforce Release Manager', 'Salesforce Delivery Manager', 'Salesforce Practice Lead', 'Salesforce Data Engineer', 'Salesforce QA Engineer', 'Salesforce QA Tester', 'Salesforce QA Automation Engineer', 'Salesforce Test Lead'].map(term => (
            <a
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              {term}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
