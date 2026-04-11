import { Metadata } from 'next';
import { BookmarksView } from './BookmarksView';

export const metadata: Metadata = {
  title: 'Saved Jobs — JobSearch',
};

export default function BookmarksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BookmarksView />
    </div>
  );
}
