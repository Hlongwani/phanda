'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client';

type TxnType = 'all' | 'sale' | 'expense';

interface Txn {
  id: string;
  type: string;
  amount: number;
  payment_method: string;
  description: string | null;
  category_tag: string | null;
  transaction_date: string;
}

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵', card: '💳', snapscan: '📱', eft: '🏦', yoco: '💳', ozow: '💳', other_digital: '💳', mixed: '🔀',
};

const EXPENSE_ICONS: Record<string, string> = {
  stock: '📦', rent: '🏠', transport: '🚗', utilities: '💡', wages: '👤',
  equipment: '🔧', marketing: '📢', other_expense: '💼',
};

const EXPENSE_LABELS: Record<string, string> = {
  stock: 'Stock', rent: 'Rent', transport: 'Transport', utilities: 'Utilities',
  wages: 'Wages', equipment: 'Equipment', marketing: 'Marketing', other_expense: 'Other',
};

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [filter, setFilter] = useState<TxnType>('all');
  const [txns, setTxns] = useState<Txn[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  const load = useCallback(async (type: TxnType, off: number, append = false) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) });
    if (type !== 'all') params.set('type', type);
    const res = await apiFetch(`/api/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTxns(prev => append ? [...prev, ...data.transactions] : data.transactions);
      setTotal(data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setOffset(0);
    load(filter, 0, false);
  }, [filter, load]);

  async function deleteTxn(id: string) {
    if (!confirm('Delete this transaction?')) return;
    setDeleting(id);
    const res = await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTxns(prev => prev.filter(t => t.id !== id));
      setTotal(prev => prev - 1);
    }
    setDeleting(null);
  }

  function loadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    load(filter, next, true);
  }

  function groupByDate(list: Txn[]) {
    const groups: Record<string, Txn[]> = {};
    list.forEach(t => {
      const date = new Date(t.transaction_date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? txns.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.category_tag || '').toLowerCase().includes(q) ||
        t.payment_method.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      )
    : txns;
  const groups = groupByDate(filtered);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-amber-500 px-5 pt-14 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-bold flex-1">Transaction History</h1>
          <button onClick={() => { setShowSearch(s => !s); setSearch(''); }} className="text-white text-xl">🔍</button>
          <span className="text-amber-100 text-sm">{total} total</span>
        </div>

        {showSearch && (
          <div className="mb-3">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by description, amount..."
              className="w-full bg-white/20 text-white placeholder-white/60 rounded-xl px-4 py-2.5 text-sm outline-none border-2 border-white/30 focus:border-white"
            />
            {q && <p className="text-amber-100 text-xs mt-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>}
          </div>
        )}

        <div className="flex gap-2">
          {(['all', 'sale', 'expense'] as TxnType[]).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${filter === t ? 'bg-white text-amber-500' : 'bg-amber-400/30 text-white'}`}>
              {t === 'all' ? 'All' : t === 'sale' ? '💰 Sales' : '📤 Expenses'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 pb-24">
        {loading && txns.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : txns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400">No {filter === 'all' ? '' : filter} transactions yet.</p>
          </div>
        ) : (
          Object.entries(groups).map(([date, items]) => (
            <div key={date} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{date}</span>
                <span className={`text-xs font-semibold ${
                  items.filter(i => i.type === 'sale').reduce((s, i) => s + i.amount, 0) -
                  items.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0) >= 0
                    ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {(() => {
                    const net = items.filter(i => i.type === 'sale').reduce((s, i) => s + i.amount, 0) -
                                items.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
                    return `${net >= 0 ? '+' : ''}R ${net.toFixed(0)}`;
                  })()}
                </span>
              </div>
              <div className="space-y-2">
                {items.map(txn => {
                  const isSale = txn.type === 'sale';
                  const icon = isSale
                    ? (PAYMENT_ICONS[txn.payment_method] || '💵')
                    : (EXPENSE_ICONS[txn.category_tag || ''] || '💼');
                  const label = isSale
                    ? (txn.payment_method.replace(/_/g, ' '))
                    : (EXPENSE_LABELS[txn.category_tag || ''] || txn.category_tag || 'Expense');
                  return (
                    <div key={txn.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isSale ? 'bg-amber-50' : 'bg-slate-100'}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-semibold text-sm truncate">{txn.description || (isSale ? 'Sale' : label)}</p>
                        <p className="text-gray-400 text-xs capitalize">{label} · {new Date(txn.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isSale ? 'text-gray-900' : 'text-red-500'}`}>
                          {isSale ? '+' : '-'}R {txn.amount.toFixed(0)}
                        </span>
                        <button
                          onClick={() => deleteTxn(txn.id)}
                          disabled={deleting === txn.id}
                          className="text-gray-300 hover:text-red-400 transition-colors text-lg ml-1"
                        >
                          {deleting === txn.id ? '…' : '×'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {txns.length < total && !loading && (
          <button onClick={loadMore} className="w-full py-3 text-amber-500 font-semibold text-sm text-center">
            Load more ({total - txns.length} remaining)
          </button>
        )}
        {loading && txns.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
