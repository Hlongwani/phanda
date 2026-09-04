import BottomNav from '@/components/BottomNav';
import OnboardingTour from '@/components/OnboardingTour';
import ReminderSetup from '@/components/ReminderSetup';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20">
      {children}
      <BottomNav />
      <OnboardingTour />
      <ReminderSetup />
    </div>
  );
}
