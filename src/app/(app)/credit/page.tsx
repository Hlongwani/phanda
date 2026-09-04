'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client';

type Direction = 'owe' | 'owed';
type StatusFilter = 'open' | 'settled';

interface CreditAccount {
  id: string;
  direction: Direction;
  party_name: string;
  party_phone: string | null;
  description: string;
  total_amount: number;
  amount_settled: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

export default function CreditPage() {
  const [dir, setDir] = useState<Direction>('owed');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [form, setForm] = useState({ partyName: '', partyPhone: '', description: '', totalAmount: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function load() {
    setLoading(true);
    const res = await apiFetch(`/api/credit?direction=${dir}&status=${statusFilter}`);
    if (res.ok) { const d = await res.json(); setAccounts(d.accounts); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [dir, statusFilter]);

  async function createAccount() {
    if (!form.partyName || !form.description || !form.totalAmount) return;
    setSubmitting(true);
    const res = await apiFetch('/api/credit', {
      method: 'POST',
      body: JSON.stringify({ direction: dir, ...form, totalAmount: parseFloat(form.totalAmount) }),
    });
    if (res.ok) { setShowForm(false); setForm({ partyName: '', partyPhone: '', description: '', totalAmount: '', dueDate: '' }); load(); }
    setSubmitting(false);
  }

  async function recordPayment(id: string) {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    const res = await apiFetch(`/api/credit/${id}/payments`, { method: 'POST', body: JSON.stringify({ amount: amt }) });
    if (res.ok) { setPayingId(null); setPayAmount(''); load(); }
  }

  const totalBalance = accounts.filter(a => a.status === 'open').reduce((s, a) => s + (a.total_amount - a.amount_settled), 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className={`px-5 pt-14 pb-6 ${dir === 'owed' ? 'bg-emerald-600' : 'bg-red-500'}`}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-bold flex-1">Credit Book</h1>
          <button onClick={() => setShowForm(true)} className="bg-white text-emerald-600 font-bold px-3 py-1.5 rounded-xl text-sm">+ New</button>
        </div>

        {/* Direction toggle */}
        <div className="flex bg-white/20 rounded-2xl p-1 mb-3">
          <button onClick={() => setDir('owed')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${dir === 'owed' ? 'bg-white text-emerald-600' : 'text-white'}`}>
            💰 Owed to me
          </button>
          <button onClick={() => setDir('owe')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${dir === 'owe' ? 'bg-white text-red-500' : 'text-white'}`}>
            📤 I owe
          </button>
        </div>

        {accounts.length > 0 && statusFilter === 'open' && (
          <div className="bg-white/20 rounded-2xl px-4 py-3">
            <div className="text-white text-2xl font-black">R {totalBalance.toFixed(0)}</div>
            <div className="text-white/80 text-xs">{dir === 'owed' ? 'Total owed to you' : 'Total you owe'} · {accounts.length} account{accounts.length > 1 ? 's' : ''}</div>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {(['open', 'settled'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${statusFilter === s ? 'bg-white text-gray-700' : 'bg-white/20 text-white'}`}>
              {s === 'open' ? '⏳ Open' : '✅ Settled'}
            </button>
          ))}
        </div>
      </div>

      {/* New Account Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-900 font-bold text-lg">{dir === 'owed' ? 'Someone owes you' : 'You owe someone'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <input placeholder={dir === 'owed' ? 'Customer name *' : 'Supplier name *'} value={form.partyName} onChange={e => setForm(f => ({ ...f, partyName: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <input placeholder="Phone (optional)" value={form.partyPhone} onChange={e => setForm(f => ({ ...f, partyPhone: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <input placeholder="What for? *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <input type="number" placeholder="Amount (R) *" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <input type="date" placeholder="Due date (optional)" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" />
            <button onClick={createAccount} disabled={submitting || !form.partyName || !form.description || !form.totalAmount} className="amber-btn">
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-900 font-bold text-lg">Record Settlement</h2>
              <button onClick={() => { setPayingId(null); setPayAmount(''); }} className="text-gray-400 text-2xl">×</button>
            </div>
            <input type="number" placeholder="Amount (R)" value={payAmount} onChange={e => setPayAmount(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" autoFocus />
            <button onClick={() => recordPayment(payingId)} disabled={!payAmount} className="amber-btn">Record</button>
          </div>
        </div>
      )}

      <div className="px-5 pt-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">{dir === 'owed' ? '💸' : '📋'}</div>
            <p className="text-gray-400 mb-4">No {statusFilter} {dir === 'owed' ? 'debts owed to you' : 'debts you owe'} yet.</p>
            {statusFilter === 'open' && <button onClick={() => setShowForm(true)} className="amber-btn">Add entry</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(acc => {
              const balance = acc.total_amount - acc.amount_settled;
              const pct = Math.min((acc.amount_settled / acc.total_amount) * 100, 100);
              const isOverdue = acc.due_date && new Date(acc.due_date) < new Date() && acc.status === 'open';
              return (
                <div key={acc.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 font-bold text-sm">{acc.party_name}</p>
                        {isOverdue && <span className="text-red-500 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>}
                      </div>
                      <p className="text-gray-500 text-xs truncate">{acc.description}</p>
                      {acc.due_date && <p className="text-gray-400 text-xs">Due: {new Date(acc.due_date).toLocaleDateString('en-ZA')}</p>}
                      {acc.party_phone && <a href={`tel:${acc.party_phone}`} className="text-amber-500 text-xs">{acc.party_phone}</a>}
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-gray-900 font-black text-sm">R {acc.total_amount.toFixed(0)}</div>
                      {acc.status === 'open' && <div className={`text-xs font-semibold ${dir === 'owed' ? 'text-emerald-600' : 'text-red-500'}`}>R {balance.toFixed(0)} left</div>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : dir === 'owed' ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">R {acc.amount_settled.toFixed(0)} of R {acc.total_amount.toFixed(0)} settled</span>
                    {acc.status === 'open' && (
                      <button onClick={() => setPayingId(acc.id)} className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                        + Settle
                      </button>
                    )}
                    {acc.status === 'settled' && <span className="text-emerald-500 text-xs font-semibold">✓ Settled</span>}
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
