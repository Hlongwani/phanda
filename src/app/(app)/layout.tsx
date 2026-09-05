'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/client';
import BottomNav from '@/components/BottomNav';
import OnboardingTour from '@/components/OnboardingTour';
import ReminderSetup from '@/components/ReminderSetup';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace('/phone');
    }
  }, [router]);

  if (typeof window !== 'undefined' && !getToken()) return null;

  return (
    <div className="pb-20">
      {children}
      <BottomNav />
      <OnboardingTour />
      <ReminderSetup />
    </div>
  );
}
