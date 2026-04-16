export interface UserProfile {
  targetRoles: string[];                          // e.g. ["Staff Engineer", "Principal Engineer"]
  salaryMin: number;                              // USD, 0 = not specified
  visaRequired: boolean;                          // needs H1B sponsorship
  remotePreference: 'remote' | 'hybrid' | 'any';
  experienceYears: number;                        // 0 = not specified
  skills: string[];                               // e.g. ["TypeScript", "React", "Python"]
}

export const DEFAULT_PROFILE: UserProfile = {
  targetRoles: [],
  salaryMin: 0,
  visaRequired: false,
  remotePreference: 'any',
  experienceYears: 0,
  skills: [],
};
