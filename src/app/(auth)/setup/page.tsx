'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, setUser } from '@/lib/client';

const CATEGORIES = [
  { id: 'general_retail', icon: '🛒', label: 'Spaza / General Store' },
  { id: 'food_and_beverage', icon: '🍳', label: 'Food & Snacks' },
  { id: 'beauty_and_hair', icon: '✂️', label: 'Hair & Beauty' },
  { id: 'electronics_and_airtime', icon: '📱', label: 'Airtime & Data' },
  { id: 'clothing_and_textiles', icon: '👗', label: 'Clothing' },
  { id: 'construction_and_repairs', icon: '🔧', label: 'Repairs & Services' },
  { id: 'transport_and_logistics', icon: '🚗', label: 'Transport' },
  { id: 'other', icon: '➕', label: 'Other' },
];

const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'];

export default function SetupPage() {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function register() {
    setLoading(true);
    setError('');
    const phone = localStorage.getItem('phanda_phone') || '';

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone, firstName, lastName, businessName, category, city, province }),
    });

    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setUser({ merchant: data.merchant, business: data.business });
      router.push('/how-it-works');
    } else {
      const err = await res.json();
      setError(err.error || 'Registration failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-amber-500 px-6 pt-14 pb-10">
        <h1 className="text-white text-2xl font-bold">Set up your business</h1>
        <p className="text-amber-100 text-sm mt-1">This becomes your Digital Business Passport — it&apos;s yours forever</p>
      </div>

      <div className="flex-1 px-6 pt-6 flex flex-col">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i === 2 ? 'bg-amber-500' : 'bg-amber-500'}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="text-gray-900 font-semibold text-lg mb-6">What&apos;s your name?</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-500 text-sm mb-1 block">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Thandi"
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-gray-500 text-sm mb-1 block">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Dlamini"
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
            <div className="mt-auto pb-8">
              <button onClick={() => setStep(1)} disabled={!firstName} className="amber-btn">Next</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-gray-900 font-semibold text-lg mb-2">What do you call your business?</h2>
            <p className="text-gray-400 text-sm mb-6">The name your customers know you by</p>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Thandi's Kitchen"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg outline-none focus:border-amber-500 transition-colors mb-6"
            />
            <h2 className="text-gray-900 font-semibold text-lg mb-4">What kind of business is this?</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CATEGORIES.map(({ id, icon, label }) => (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                    category === id ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className={`text-sm font-medium text-left ${category === id ? 'text-amber-700' : 'text-gray-600'}`}>{label}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto pb-8 flex gap-3">
              <button onClick={() => setStep(0)} className="ghost-btn flex-shrink-0 w-auto px-6">Back</button>
              <button onClick={() => setStep(2)} disabled={!businessName || !category} className="amber-btn">Next</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-gray-900 font-semibold text-lg mb-2">Where do you trade?</h2>
            <p className="text-gray-400 text-sm mb-6">Just your town and province — no exact address needed</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-500 text-sm mb-1 block">Town / City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Soweto"
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-gray-500 text-sm mb-1 block">Province</label>
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg outline-none focus:border-amber-500 transition-colors bg-white"
                >
                  <option value="">Select province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="mt-auto pb-8 flex gap-3">
              <button onClick={() => setStep(1)} className="ghost-btn flex-shrink-0 w-auto px-6">Back</button>
              <button onClick={register} disabled={!city || !province || loading} className="amber-btn">
                {loading ? 'Creating your passport...' : 'Save my business'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
