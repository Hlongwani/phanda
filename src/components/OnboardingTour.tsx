'use client';
import { useEffect, useState } from 'react';

const STEPS = [
  {
    icon: '📊',
    title: 'Your Business Passport',
    body: 'Every sale you record builds your Business Passport — a trusted financial track record that helps you access credit, suppliers, and markets.',
  },
  {
    icon: '💰',
    title: 'Record every sale',
    body: 'Tap the + button to record a sale in seconds. The more consistently you record, the stronger your Health Score grows.',
  },
  {
    icon: '📤',
    title: 'Track expenses too',
    body: 'Use the same + button to record expenses like stock, rent, and transport. This keeps your profit accurate.',
  },
  {
    icon: '🛍️',
    title: 'Layby & Credit Book',
    body: 'Track layby balances and money owed to you (or by you) in the Layby and Credit sections accessible from the dashboard.',
  },
  {
    icon: '🎉',
    title: "You're all set!",
    body: 'Start recording your first sale. Your passport grows stronger every day you trade.',
  },
];

const TOUR_KEY = 'phanda_tour_done';

export default function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-8 text-center">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-amber-500' : 'w-1.5 bg-gray-200'}`} />
          ))}
        </div>

        <div className="text-6xl mb-4">{current.icon}</div>
        <h2 className="text-gray-900 text-xl font-black mb-3">{current.title}</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">{current.body}</p>

        <button
          onClick={() => isLast ? dismiss() : setStep(s => s + 1)}
          className="amber-btn mb-3"
        >
          {isLast ? "Let's go! 🚀" : 'Next'}
        </button>

        {!isLast && (
          <button onClick={dismiss} className="w-full text-gray-400 text-sm py-2">
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
