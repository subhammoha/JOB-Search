'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile, DEFAULT_PROFILE } from '@/types/profile';

const STORAGE_KEY = 'jsa-profile';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const saveProfile = useCallback((updated: UserProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const hasProfile = loaded && (
    profile.targetRoles.length > 0 ||
    profile.skills.length > 0 ||
    profile.salaryMin > 0
  );

  return { profile, saveProfile, loaded, hasProfile };
}
