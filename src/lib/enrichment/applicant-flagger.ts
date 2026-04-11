import { HIGH_APPLICANT_THRESHOLD, MODERATE_APPLICANT_THRESHOLD } from '@/lib/constants';

export type ApplicantLevel = 'high' | 'moderate' | 'normal';

export function flagApplicants(count?: number): ApplicantLevel {
  if (!count) return 'normal';
  if (count >= HIGH_APPLICANT_THRESHOLD) return 'high';
  if (count >= MODERATE_APPLICANT_THRESHOLD) return 'moderate';
  return 'normal';
}
