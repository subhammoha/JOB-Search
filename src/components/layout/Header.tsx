import Link from 'next/link';
import { Briefcase, ClipboardList, User } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors">
          <Briefcase className="w-5 h-5 text-blue-600" />
          JobSearch
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/pipeline"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
