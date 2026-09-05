'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  total_spend: number;
  visit_count: number;
  last_visit: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  payment_method: string;
  description: string | null;
  transaction_date: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [txnMap, setTxnMap] = useState<Record<string, Transaction[]>>({});
  const [txnLoading, setTxnLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function load() {
    setLoading(true);
    const res = await apiFetch('/api/customers');
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.customers);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleExpand(customer: Customer) {
    if (expandedId === customer.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(customer.id);
    if (!txnMap[customer.id]) {
      setTxnLoading(customer.id);
      const res = await apiFetch(`/api/customers/${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        setTxnMap(m => ({ ...m, [customer.id]: data.transactions }));
      }
      setTxnLoading(null);
    }
  }

  async function createCustomer() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    const res = await apiFetch('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ name: form.name, phone: form.phone }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: '', phone: '' });
      load();
    }
    setSubmitting(false);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'No visits yet';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-6 bg-amber-500">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-bold flex-1">Customers</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-amber-600 font-bold px-3 py-1.5 rounded-xl text-sm"
          >
            + Add
          </button>
        </div>

        {!loading && customers.length > 0 && (
          <div className="bg-white/20 rounded-2xl px-4 py-3">
            <div className="text-white text-2xl font-black">{customers.length}</div>
            <div className="text-white/80 text-xs">
              {customers.length === 1 ? 'customer' : 'customers'} · R{' '}
              {customers.reduce((s, c) => s + c.total_spend, 0).toFixed(0)} total spend
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-900 font-bold text-lg">New Customer</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <input
              placeholder="Customer name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500"
              autoFocus
            />
            <input
              placeholder="Phone number (optional)"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500"
              type="tel"
            />
            <button
              onClick={createCustomer}
              disabled={submitting || !form.name.trim()}
              className="amber-btn"
            >
              {submitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </div>
      )}

      <div className="px-5 pt-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-gray-500 font-semibold mb-1">No customers yet</p>
            <p className="text-gray-400 text-sm mb-6">Add customers to track their spending and visit history.</p>
            <button onClick={() => setShowForm(true)} className="amber-btn">Add your first customer</button>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map(customer => {
              const isExpanded = expandedId === customer.id;
              const txns = txnMap[customer.id] || [];
              const isLoadingTxns = txnLoading === customer.id;

              return (
                <div key={customer.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleExpand(customer)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-600 font-bold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-bold text-sm truncate">{customer.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-400 text-xs">{formatDate(customer.last_visit)}</span>
                            {customer.phone && (
                              <>
                                <span className="text-gray-300 text-xs">·</span>
                                <span className="text-gray-400 text-xs">{customer.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-gray-900 font-black text-sm">R {customer.total_spend.toFixed(0)}</div>
                        <div className="text-amber-500 text-xs font-semibold">
                          {customer.visit_count} {customer.visit_count === 1 ? 'visit' : 'visits'}
                        </div>
                      </div>
                      <div className={`ml-3 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expanded: transaction history */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-3 mb-2">Last 10 transactions</p>
                      {isLoadingTxns ? (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : txns.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-3">No transactions linked yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {txns.map(txn => (
                            <div key={txn.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-700 text-sm font-medium truncate">
                                  {txn.description || txn.payment_method}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {new Date(txn.transaction_date).toLocaleDateString('en-ZA', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div className="text-right ml-3 flex-shrink-0">
                                <span className={`text-sm font-bold ${txn.type === 'sale' ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {txn.type === 'sale' ? '+' : '-'}R {txn.amount.toFixed(0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {customer.phone && (
                        <a
                          href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 w-full bg-amber-50 text-amber-600 font-semibold text-sm py-2.5 rounded-xl border border-amber-200"
                        >
                          📱 WhatsApp {customer.name.split(' ')[0]}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
