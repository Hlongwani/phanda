'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Welcome() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-amber-500 flex flex-col">
      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg mb-4 mx-auto">
            <span className="text-amber-500 text-4xl font-black">P</span>
          </div>
          <h1 className="text-white text-4xl font-black text-center tracking-tight">PHANDA</h1>
        </div>

        {/* Tagline */}
        <p className="text-amber-100 text-xl text-center font-medium mb-2">
          Your hustle, proven.
        </p>
        <p className="text-amber-200 text-sm text-center max-w-xs">
          Turn every sale into a Digital Business Passport that opens doors to loans, insurance and suppliers.
        </p>

        {/* Illustration */}
        <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-xs">
          {[
            { icon: '🛒', label: 'Spaza shops' },
            { icon: '🍳', label: 'Food vendors' },
            { icon: '✂️', label: 'Hair salons' },
            { icon: '📱', label: 'Airtime' },
            { icon: '👗', label: 'Clothing' },
            { icon: '🔧', label: 'Services' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-amber-400/40 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-amber-100 text-xs font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-10 space-y-3">
        <button
          onClick={() => router.push('/phone')}
          className="w-full bg-white text-amber-500 font-bold rounded-2xl py-4 text-lg shadow-lg"
        >
          Get Started
        </button>
        <Link
          href="/phone"
          className="block text-center text-amber-100 text-sm py-2"
        >
          Already have an account? <span className="text-white font-semibold underline">Sign in</span>
        </Link>
      </div>
    </div>
  );
}
