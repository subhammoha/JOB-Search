import { Metadata } from 'next';
import { ProfileForm } from './ProfileForm';

export const metadata: Metadata = {
  title: 'My Profile — JobSearch',
};

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProfileForm />
    </div>
  );
}
