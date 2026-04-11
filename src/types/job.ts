export type JobSource = 'jsearch' | 'adzuna' | 'themuse' | 'arbeitnow' | 'remotive';

export interface UnifiedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  applyUrl: string;
  postedAt: Date;
  source: JobSource;
  applicantCount?: number;
  isRemote: boolean;
  employmentType?: string;
  logoUrl?: string;
}

export interface SearchParams {
  q: string;
  location?: string;
  page?: number;
  remote?: boolean;
}

export type FilterState = {
  sources: JobSource[];
  hideConsultancies: boolean;
  onlyH1bSponsors: boolean;
  hideHighApplicants: boolean;
  remoteFilter: 'all' | 'remote' | 'onsite';
  datePosted: 'any' | '24h' | 'week' | 'month';
};
