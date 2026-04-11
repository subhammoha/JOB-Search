import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'JobSearch — Find Jobs Across All Boards',
  description: 'Search jobs from LinkedIn, Indeed, Glassdoor, and more. Filter by H1B sponsorship, avoid staffing agencies, and spot high-competition listings instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 antialiased">
        <QueryProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
