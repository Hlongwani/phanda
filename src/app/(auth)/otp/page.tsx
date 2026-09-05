'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, setUser } from '@/lib/client';

export default function OTPPage() {
  const [digits, setDigits] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [hint, setHint] = useState('');
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const router = useRouter();

  useEffect(() => {
    refs[0].current?.focus();
    setHint(localStorage.getItem('phanda_otp_hint') || '');
    const timer = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  function handleDigit(idx: number, val: string) {
    const d = val.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < 4) refs[idx + 1].current?.focus();
    if (next.every(x => x) && idx === 4) verify(next.join(''));
  }

  function handleKey(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  }

  async function verify(otp: string) {
    setLoading(true);
    setError('');
    const phone = localStorage.getItem('phanda_phone') || '';

    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone, otp }),
    });

    const isNewUser = localStorage.getItem('phanda_new_user') === '1';

    if (res.ok) {
      const data = await res.json();
      if (isNewUser) {
        router.push('/setup');
      } else {
        setToken(data.token);
        setUser({ merchant: data.merchant, business: data.business });
        router.push('/dashboard');
      }
    } else {
      setError(hint ? `Invalid code. ${hint}` : 'Invalid or expired code. Please try again.');
      setLoading(false);
      setDigits(['', '', '', '', '']);
      refs[0].current?.focus();
    }
  }

  const otp = digits.join('');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-amber-500 px-6 pt-14 pb-10">
        <button onClick={() => router.back()} className="text-amber-100 mb-6 text-xl">←</button>
        <h1 className="text-white text-2xl font-bold">Enter your code</h1>
        <p className="text-amber-100 text-sm mt-1">
          We sent a 5-digit code to your number
        </p>
      </div>

      <div className="flex-1 px-6 pt-8 flex flex-col">
        {/* Progress dots */}
        <div className="flex gap-2 mb-10">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 1 ? 'bg-amber-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* OTP boxes */}
        <div className="flex gap-3 justify-center mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-colors ${
                d ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}

        {/* Demo hint */}
        {hint && (
          <div className="bg-amber-50 rounded-xl px-4 py-3 mb-6 text-center">
            <p className="text-amber-700 text-sm font-medium">{hint}</p>
          </div>
        )}

        {/* Countdown */}
        <p className="text-gray-400 text-sm text-center mb-2">
          {countdown > 0 ? (
            <>Code expires in <span className="text-gray-600 font-medium">0:{countdown.toString().padStart(2, '0')}</span></>
          ) : (
            <button className="text-amber-500 font-semibold" onClick={() => setCountdown(60)}>Resend code</button>
          )}
        </p>

        <div className="mt-auto pb-8">
          <button
            onClick={() => otp.length === 5 && verify(otp)}
            disabled={otp.length < 5 || loading}
            className="amber-btn"
          >
            {loading ? 'Verifying...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
