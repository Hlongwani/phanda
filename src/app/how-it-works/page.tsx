'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CARDS = [
  {
    icon: '💰',
    title: 'Record every sale',
    body: "Tell PHANDA when you make a sale — cash or card. Takes 5 seconds.",
    bg: 'bg-amber-500',
  },
  {
    icon: '📋',
    title: 'Build your Business Passport',
    body: "Every sale grows your Passport. It shows your trading history and earns you a Business Score.",
    bg: 'bg-slate-800',
  },
  {
    icon: '🚀',
    title: 'Unlock better opportunities',
    body: "Share your Passport with lenders, suppliers and markets. Show them your hustle is real.",
    bg: 'bg-emerald-600',
  },
];

export default function HowItWorksPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  function next() {
    if (current < CARDS.length - 1) {
      setCurrent(current + 1);
    } else {
      router.push('/dashboard');
    }
  }

  const card = CARDS[current];

  return (
    <div className={`min-h-screen flex flex-col ${card.bg} transition-colors duration-500`}>
      {/* Skip */}
      <div className="flex justify-end px-6 pt-14">
        <button onClick={() => router.push('/dashboard')} className="text-white/70 text-sm font-medium">
          Skip
        </button>
      </div>

      {/* Card content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-8xl mb-8">{card.icon}</div>
        <h2 className="text-white text-3xl font-black mb-4 leading-tight">{card.title}</h2>
        <p className="text-white/80 text-lg leading-relaxed max-w-xs">{card.body}</p>
      </div>

      {/* Dots + button */}
      <div className="px-6 pb-12">
        <div className="flex justify-center gap-2 mb-8">
          {CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${i === current ? 'bg-white w-8' : 'bg-white/40 w-2'}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full bg-white font-bold rounded-2xl py-4 text-lg"
          style={{ color: current === 0 ? '#F59E0B' : current === 1 ? '#0F172A' : '#059669' }}
        >
          {current < CARDS.length - 1 ? 'Next' : "Let's go! 🎉"}
        </button>
      </div>
    </div>
  );
}
