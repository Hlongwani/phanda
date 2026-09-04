'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearAuth } from '@/lib/client';

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('phanda_dark', '1'); }
    else { document.documentElement.classList.remove('dark'); localStorage.removeItem('phanda_dark'); }
  }
  return { dark, toggle };
}

const CATEGORIES = [
  { id: 'general_retail', label: 'General Retail' },
  { id: 'food_and_beverage', label: 'Food & Beverage' },
  { id: 'beauty_and_hair', label: 'Beauty & Hair' },
  { id: 'electronics_and_airtime', label: 'Electronics & Airtime' },
  { id: 'clothing_and_textiles', label: 'Clothing & Textiles' },
  { id: 'construction_and_repairs', label: 'Construction & Repairs' },
  { id: 'transport_and_logistics', label: 'Transport & Logistics' },
  { id: 'other', label: 'Other' },
];

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
];

interface Profile {
  merchant: { id: string; first_name: string; last_name: string; phone_number: string; created_at: string };
  business: { trading_name: string; category: string; city: string; province: string; description: string | null };
}

export default function SettingsPage() {
  const { dark, toggle: toggleDark } = useDarkMode();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/profile').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setProfile(d);
        setForm({
          firstName: d.merchant.first_name,
          lastName: d.merchant.last_name,
          tradingName: d.business.trading_name,
          city: d.business.city,
          province: d.business.province,
          category: d.business.category,
          description: d.business.description || '',
        });
      }
    });
  }, []);

  async function save() {
    setSaving(true);
    const res = await apiFetch('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
      // refresh profile
      apiFetch('/api/profile').then(r => r.ok ? r.json() : null).then(d => { if (d) setProfile(d); });
    }
  }

  if (!profile) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { merchant, business } = profile;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-amber-500 px-5 pt-14 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-bold flex-1">Settings</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-white font-semibold text-sm">Edit</button>
          ) : (
            <button onClick={() => setEditing(false)} className="text-white/70 font-semibold text-sm">Cancel</button>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-black">{merchant.first_name[0]}{merchant.last_name[0]}</span>
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">{merchant.first_name} {merchant.last_name}</h2>
            <p className="text-amber-100 text-sm">{merchant.phone_number}</p>
            <p className="text-amber-100/70 text-xs">Member since {new Date(merchant.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4 pb-24">
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-emerald-700 text-sm font-medium text-center">
            ✓ Changes saved
          </div>
        )}

        {/* Personal info */}
        <div className="card">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">Personal Info</h3>
          <div className="space-y-3">
            <Field label="First name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} editing={editing} />
            <Field label="Last name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} editing={editing} />
            <div>
              <label className="text-gray-500 text-xs font-semibold block mb-1">Phone number</label>
              <p className="text-gray-700 text-sm font-medium">{merchant.phone_number}</p>
              <p className="text-gray-400 text-xs">Contact support to change your number</p>
            </div>
          </div>
        </div>

        {/* Business info */}
        <div className="card">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">Business Info</h3>
          <div className="space-y-3">
            <Field label="Trading name" value={form.tradingName} onChange={v => setForm(f => ({ ...f, tradingName: v }))} editing={editing} />
            <Field label="City / Township" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} editing={editing} />

            {editing ? (
              <div>
                <label className="text-gray-500 text-xs font-semibold block mb-1">Province</label>
                <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500">
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            ) : (
              <Field label="Province" value={form.province} onChange={() => {}} editing={false} />
            )}

            {editing ? (
              <div>
                <label className="text-gray-500 text-xs font-semibold block mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            ) : (
              <Field label="Category" value={CATEGORIES.find(c => c.id === form.category)?.label || form.category} onChange={() => {}} editing={false} />
            )}

            <Field label="Description (optional)" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} editing={editing} multiline />
          </div>

          {editing && (
            <button onClick={save} disabled={saving} className="amber-btn mt-4">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* Danger zone */}
        <div className="card">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">Account</h3>
          <button onClick={toggleDark}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors mb-1">
            <span className="text-xl">{dark ? '☀️' : '🌙'}</span>
            <span className="font-semibold text-sm flex-1 text-left">{dark ? 'Light mode' : 'Dark mode'}</span>
            <div className={`w-10 h-6 rounded-full transition-colors ${dark ? 'bg-amber-500' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${dark ? 'translate-x-4' : ''}`} />
            </div>
          </button>
          <button
            onClick={() => { clearAuth(); router.replace('/welcome'); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-semibold text-sm">Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, editing, multiline }: {
  label: string; value: string; onChange: (v: string) => void; editing: boolean; multiline?: boolean;
}) {
  return (
    <div>
      <label className="text-gray-500 text-xs font-semibold block mb-1">{label}</label>
      {editing ? (
        multiline ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 resize-none" />
        ) : (
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500" />
        )
      ) : (
        <p className="text-gray-700 text-sm font-medium">{value || '—'}</p>
      )}
    </div>
  );
}
