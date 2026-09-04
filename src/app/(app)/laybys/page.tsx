'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client';

interface Layby {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  item_description: string;
  total_price: number;
  amount_paid: number;
  status: string;
  created_at: string;
}

type Tab = 'active' | 'completed';

export default function LaybysPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [laybys, setLaybys] = useState<Layby[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [form, setForm] = useState({ customerName: '', customerPhone: '', itemDescription: '', totalPrice: '' });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function load(status: Tab) {
    setLoading(true);
    const res = await apiFetch(`/api/laybys?status=${status}`);
    if (res.ok) { const d = await res.json(); setLaybys(d.laybys); }
    setLoading(false);
  }

  useEffect(() => { load(tab); }, [tab]);

  async function createLayby() {
    if (!form.customerName || !form.itemDescription || !form.totalPrice) return;
    setSubmitting(true);
    const res = await apiFetch('/api/laybys', { method: 'POST', body: JSON.stringify({ ...form, totalPrice: parseFloat(form.totalPrice) }) });
    if (res.ok) { setShowForm(false); setForm({ customerName: '', customerPhone: '', itemDescription: '', totalPrice: '' }); load(tab); }
    setSubmitting(false);
  }

  async function recordPayment(id: string) {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    const res = await apiFetch(`/api/laybys/${id}/payments`, { method: 'POST', body: JSON.stringify({ amount: amt }) });
    if (res.ok) { setPayingId(null); setPayAmount(''); load(tab); }
  }

  const totalOwed = laybys.filter(l => l.status === 'active').reduce((s, l) => s + (l.total_price - l.amount_paid), 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-amber-500 px-5 pt-14 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-bold flex-1">Layby Tracker</h1>
          <button onClick={() => setShowForm(true)} className="bg-white text-amber-500 font-bold px-3 py-1.5 rounded-xl text-sm">+ New</button>
        </div>
        {tab === 'active' && laybys.length > 0 && (
          <div className="bg-white/20 rounded-2xl px-4 py-3">
            <div className="text-white text-2xl font-black">R {totalOwed.toFixed(0)}</div>
            <div className="text-amber-100 text-xs">Outstanding from {laybys.length} layby{laybys.length > 1 ? 's' : ''}</div>
          </div>
        )}
        <div className="flex gap-2 mt-3">
          {(['active', 'completed'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-white text-amber-500' : 'bg-amber-400/30 text-white'}`}>
              {t === 'active' ? '⏳ Active' : '✅ Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* New Layby Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-900 font-bold text-lg">New Layby</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <input placeholder="Customer name *" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <input placeholder="Customer phone (optional)" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <input placeholder="What are they buying? *" value={form.itemDescription} onChange={e => setForm(f => ({ ...f, itemDescription: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <input type="number" placeholder="Total price (R) *" value={form.totalPrice} onChange={e => setForm(f => ({ ...f, totalPrice: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <button onClick={createLayby} disabled={submitting || !form.customerName || !form.itemDescription || !form.totalPrice} className="amber-btn">
              {submitting ? 'Saving...' : 'Save Layby'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-900 font-bold text-lg">Record Payment</h2>
              <button onClick={() => { setPayingId(null); setPayAmount(''); }} className="text-gray-400 text-2xl">×</button>
            </div>
            <input type="number" placeholder="Amount received (R)" value={payAmount} onChange={e => setPayAmount(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" autoFocus />
            <button onClick={() => recordPayment(payingId)} disabled={!payAmount} className="amber-btn">Record Payment</button>
          </div>
        </div>
      )}

      <div className="px-5 pt-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : laybys.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🛍️</div>
            <p className="text-gray-400 mb-4">No {tab} laybys yet.</p>
            {tab === 'active' && <button onClick={() => setShowForm(true)} className="amber-btn">Add your first layby</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {laybys.map(layby => {
              const balance = layby.total_price - layby.amount_paid;
              const pct = Math.min((layby.amount_paid / layby.total_price) * 100, 100);
              return (
                <div key={layby.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold text-sm">{layby.customer_name}</p>
                      <p className="text-gray-500 text-xs truncate">{layby.item_description}</p>
                      {layby.customer_phone && (
                        <a href={`tel:${layby.customer_phone}`} className="text-amber-500 text-xs">{layby.customer_phone}</a>
                      )}
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-gray-900 font-black text-sm">R {layby.total_price.toFixed(0)}</div>
                      {layby.status === 'active' && <div className="text-red-500 text-xs font-semibold">R {balance.toFixed(0)} left</div>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">R {layby.amount_paid.toFixed(0)} of R {layby.total_price.toFixed(0)} paid</span>
                    {layby.status === 'active' && (
                      <button onClick={() => setPayingId(layby.id)} className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                        + Payment
                      </button>
                    )}
                    {layby.status === 'completed' && <span className="text-emerald-500 text-xs font-semibold">✓ Paid off</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
