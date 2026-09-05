'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PhonePage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const formatted = phone.replace(/\D/g, '').slice(0, 10);

  async function handleSend() {
    if (formatted.length < 9) {
      setError('Enter a valid South African number');
      return;
    }
    setLoading(true);
    setError('');

    const e164 = '+27' + formatted.replace(/^0/, '');

    // Try login first, then register flow
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: e164 }),
    });

    setLoading(false);
    if (res.ok || res.status === 404) {
      const data = res.ok ? await res.json() : {};
      localStorage.setItem('phanda_phone', e164);
      localStorage.setItem('phanda_phone_raw', formatted);
      localStorage.setItem('phanda_otp_hint', data.hint || '');
      router.push('/otp');
    } else {
      setError('Something went wrong. Try again.');
    }
  }

  function formatDisplay(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + ' ' + d.slice(3);
    return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-amber-500 px-6 pt-14 pb-10">
        <button onClick={() => router.back()} className="text-amber-100 mb-6 flex items-center gap-1">
          <span className="text-xl">←</span>
        </button>
        <h1 className="text-white text-2xl font-bold">Enter your number</h1>
        <p className="text-amber-100 text-sm mt-1">We&apos;ll send a one-time code to verify it&apos;s you</p>
      </div>

      <div className="flex-1 px-6 pt-8 flex flex-col">
        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i === 0 ? 'bg-amber-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Input */}
        <div className="mb-3">
          <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-amber-500 transition-colors">
            <div className="px-4 py-4 bg-gray-50 border-r border-gray-200 flex items-center gap-2">
              <span className="text-lg">🇿🇦</span>
              <span className="text-gray-600 font-medium text-sm">+27</span>
            </div>
            <input
              type="tel"
              value={formatDisplay(formatted)}
              onChange={e => setPhone(e.target.value)}
              placeholder="083 000 0000"
              className="flex-1 px-4 py-4 text-lg font-medium outline-none bg-white"
              inputMode="numeric"
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2 px-1">{error}</p>}
        </div>

        <p className="text-gray-400 text-xs px-1 mb-8">
          We use your number to keep your account safe. We&apos;ll never sell your data or call you to sell you anything.
        </p>

        {/* WhatsApp option */}
        <div className="bg-green-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="text-green-800 font-semibold text-sm">Prefer WhatsApp?</p>
            <p className="text-green-600 text-xs">You can also record sales by sending us a WhatsApp message</p>
          </div>
        </div>

        <div className="mt-auto pb-8">
          <button
            onClick={handleSend}
            disabled={formatted.length < 9 || loading}
            className="amber-btn"
          >
            {loading ? 'Sending...' : 'Send my code'}
          </button>
        </div>
      </div>
    </div>
  );
}
