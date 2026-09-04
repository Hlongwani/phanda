'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client';

type Mode = 'sale' | 'expense';
type SaleStep = 'amount' | 'method' | 'description';
type ExpenseStep = 'amount' | 'category' | 'description';

const PAYMENT_METHODS = [
  { id: 'cash', icon: '💵', label: 'Cash', sub: 'Notes or coins' },
  { id: 'card', icon: '💳', label: 'Card or EFT', sub: 'SnapScan, bank transfer, tap-to-pay' },
  { id: 'mixed', icon: '🔀', label: 'Mixed', sub: 'Part cash, part digital' },
];

const EXPENSE_CATEGORIES = [
  { id: 'stock', icon: '📦', label: 'Stock / Inventory', sub: 'Goods bought for resale' },
  { id: 'rent', icon: '🏠', label: 'Rent / Space', sub: 'Stall, shop or storage' },
  { id: 'transport', icon: '🚗', label: 'Transport', sub: 'Delivery, taxi, fuel' },
  { id: 'utilities', icon: '💡', label: 'Utilities', sub: 'Electricity, water, airtime' },
  { id: 'wages', icon: '👤', label: 'Wages / Staff', sub: 'Casual or permanent workers' },
  { id: 'equipment', icon: '🔧', label: 'Equipment', sub: 'Tools, machines, repairs' },
  { id: 'marketing', icon: '📢', label: 'Marketing', sub: 'Flyers, data, advertising' },
  { id: 'other_expense', icon: '💼', label: 'Other', sub: 'Anything else' },
];

const SALE_TAGS = ['Bread', 'Airtime', 'Cooldrink', 'Snacks', 'Cigarettes', 'Clothing', 'Vegetables', 'Soap'];

const ENCOURAGEMENTS = [
  (n: number) => `That's sale #${n} today. Keep going! 🚀`,
  (n: number) => `Your passport just got stronger. ${n} sales today!`,
  () => `Every sale counts. You're building something real. 💪`,
  () => `Your Business Score just went up! Keep recording. ⭐`,
];

export default function RecordPage() {
  const [mode, setMode] = useState<Mode>('sale');
  const [step, setStep] = useState<SaleStep | ExpenseStep>('amount');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [expenseCat, setExpenseCat] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customDesc, setCustomDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [todaySalesCount, setTodaySalesCount] = useState(1);
  const router = useRouter();

  function switchMode(m: Mode) {
    setMode(m);
    setStep('amount');
    setAmount('');
    setMethod('');
    setExpenseCat('');
    setTags([]);
    setCustomDesc('');
  }

  function handleKey(val: string) {
    if (val === 'back') { setAmount(a => a.slice(0, -1)); return; }
    if (val === '.' && amount.includes('.')) return;
    if (amount.length < 8) setAmount(a => a + val);
  }

  function nextStep() {
    if (step === 'amount') setStep(mode === 'sale' ? 'method' : 'category');
    else if (step === 'method' || step === 'category') setStep('description');
  }

  function prevStep() {
    if (step === 'description') setStep(mode === 'sale' ? 'method' : 'category');
    else if (step === 'method' || step === 'category') setStep('amount');
    else router.push('/dashboard');
  }

  const stepIndex = step === 'amount' ? 0 : step === 'method' || step === 'category' ? 1 : 2;

  async function submit() {
    setLoading(true);
    const description = [...tags, customDesc].filter(Boolean).join(', ');
    const res = await apiFetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: parseFloat(amount),
        type: mode,
        paymentMethod: mode === 'sale' ? (method === 'mixed' ? 'cash' : method) : 'cash',
        description: description || null,
        categoryTag: mode === 'sale' ? (tags[0] || null) : expenseCat,
      }),
    });
    if (res.ok) { setConfirmed(true); setLoading(false); }
    else { setLoading(false); alert('Failed to record. Try again.'); }
  }

  function reset() {
    setAmount(''); setMethod(''); setExpenseCat(''); setTags([]); setCustomDesc('');
    setStep('amount'); setConfirmed(false);
    if (mode === 'sale') setTodaySalesCount(c => c + 1);
  }

  if (confirmed) {
    const isSale = mode === 'sale';
    const msg = isSale ? ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)](todaySalesCount) : '💡 Tracking expenses keeps your profit accurate.';
    const catLabel = EXPENSE_CATEGORIES.find(c => c.id === expenseCat)?.label || expenseCat;
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center px-6 text-center ${isSale ? 'bg-amber-500' : 'bg-slate-700'}`}>
        <div className="text-7xl mb-4 animate-bounce">{isSale ? '✅' : '📝'}</div>
        <h2 className="text-white text-3xl font-black mb-2">{isSale ? 'Sale recorded!' : 'Expense recorded!'}</h2>
        <div className="text-white text-5xl font-black mb-2">R {parseFloat(amount).toFixed(0)}</div>
        <div className="text-white/80 text-lg mb-4 capitalize">{isSale ? method : catLabel}</div>
        <div className="bg-white/20 rounded-2xl px-5 py-4 mb-10 max-w-xs">
          <p className="text-white font-medium">{msg}</p>
        </div>
        <div className="w-full space-y-3">
          <button onClick={reset} className="w-full bg-white text-amber-500 font-bold rounded-2xl py-4 text-lg">
            Record another
          </button>
          {isSale && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Receipt\n\nAmount: R ${parseFloat(amount).toFixed(2)}\nPayment: ${method}\n${tags.length > 0 ? 'Items: ' + tags.join(', ') + '\n' : ''}${customDesc ? 'Note: ' + customDesc + '\n' : ''}\nDate: ${new Date().toLocaleDateString('en-ZA')}\nThank you! 🙏`)}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full bg-white/20 text-white font-bold rounded-2xl py-4 text-lg flex items-center justify-center gap-2 border border-white/30"
            >
              📱 Send WhatsApp Receipt
            </a>
          )}
          <button onClick={() => router.push('/dashboard')} className="w-full text-white/80 font-medium py-3">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const headerLabel = step === 'amount'
    ? (mode === 'sale' ? 'How much did you make?' : 'How much did you spend?')
    : step === 'method' ? 'How did they pay?'
    : step === 'category' ? 'What did you spend on?'
    : 'Add a description';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className={`px-6 pt-14 pb-6 ${mode === 'sale' ? 'bg-amber-500' : 'bg-slate-700'}`}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={prevStep} className="text-white text-xl">←</button>
          <div className="flex-1 flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        {/* Mode toggle — only on first step */}
        {step === 'amount' && (
          <div className="flex bg-white/20 rounded-2xl p-1 mb-3">
            <button onClick={() => switchMode('sale')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'sale' ? 'bg-white text-amber-500' : 'text-white'}`}>
              💰 Sale
            </button>
            <button onClick={() => switchMode('expense')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'expense' ? 'bg-white text-slate-700' : 'text-white'}`}>
              📤 Expense
            </button>
          </div>
        )}

        <h1 className="text-white text-xl font-bold">{headerLabel}</h1>
      </div>

      {/* Step: Amount */}
      {step === 'amount' && (
        <div className="flex flex-col flex-1">
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="text-6xl font-black text-gray-900 mb-2">R {amount || '0'}</div>
            <div className="flex gap-3 mb-4">
              {['50', '100', '150', '200'].map(q => (
                <button key={q} onClick={() => setAmount(q)}
                  className="bg-amber-50 text-amber-600 font-bold text-sm px-4 py-2 rounded-xl border border-amber-200">
                  R{q}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0 border-t border-gray-100">
            {['1','2','3','4','5','6','7','8','9','.','0','back'].map(k => (
              <button key={k} onClick={() => handleKey(k)}
                className="h-16 flex items-center justify-center text-2xl font-semibold text-gray-800 active:bg-gray-100 transition-colors">
                {k === 'back' ? '⌫' : k}
              </button>
            ))}
          </div>
          <div className="px-6 py-4">
            <button onClick={nextStep} disabled={!amount || parseFloat(amount) <= 0} className="amber-btn">Next</button>
          </div>
        </div>
      )}

      {/* Step: Payment method (sale) */}
      {step === 'method' && (
        <div className="flex-1 flex flex-col px-6 pt-6">
          <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-6 inline-block self-start">
            <span className="text-gray-600 font-bold">R {parseFloat(amount).toFixed(0)}</span>
          </div>
          <div className="space-y-3 flex-1">
            {PAYMENT_METHODS.map(({ id, icon, label, sub }) => (
              <button key={id} onClick={() => setMethod(id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${method === id ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                <span className="text-3xl">{icon}</span>
                <div className="text-left">
                  <p className={`font-semibold ${method === id ? 'text-amber-700' : 'text-gray-800'}`}>{label}</p>
                  <p className="text-gray-400 text-xs">{sub}</p>
                </div>
                {method === id && <span className="ml-auto text-amber-500 text-xl">✓</span>}
              </button>
            ))}
          </div>
          <div className="py-4">
            <button onClick={nextStep} disabled={!method} className="amber-btn">Next</button>
          </div>
        </div>
      )}

      {/* Step: Expense category */}
      {step === 'category' && (
        <div className="flex-1 flex flex-col px-6 pt-6">
          <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-6 inline-block self-start">
            <span className="text-gray-600 font-bold">R {parseFloat(amount).toFixed(0)}</span>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {EXPENSE_CATEGORIES.map(({ id, icon, label, sub }) => (
              <button key={id} onClick={() => setExpenseCat(id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${expenseCat === id ? 'border-slate-600 bg-slate-50' : 'border-gray-200 bg-white'}`}>
                <span className="text-2xl">{icon}</span>
                <div className="text-left">
                  <p className={`font-semibold text-sm ${expenseCat === id ? 'text-slate-700' : 'text-gray-800'}`}>{label}</p>
                  <p className="text-gray-400 text-xs">{sub}</p>
                </div>
                {expenseCat === id && <span className="ml-auto text-slate-600 text-xl">✓</span>}
              </button>
            ))}
          </div>
          <div className="py-4">
            <button onClick={nextStep} disabled={!expenseCat} className="amber-btn">Next</button>
          </div>
        </div>
      )}

      {/* Step: Description */}
      {step === 'description' && (
        <div className="flex-1 flex flex-col px-6 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gray-50 rounded-2xl px-4 py-2">
              <span className="text-gray-600 font-bold">R {parseFloat(amount).toFixed(0)}</span>
            </div>
            <span className="text-gray-400">·</span>
            <div className="bg-gray-50 rounded-2xl px-4 py-2 capitalize">
              <span className="text-gray-600 font-medium">
                {mode === 'sale' ? method : EXPENSE_CATEGORIES.find(c => c.id === expenseCat)?.label}
              </span>
            </div>
          </div>
          <div className="flex justify-end mb-4">
            <button onClick={submit} className="text-amber-500 font-semibold text-sm">Skip</button>
          </div>
          {mode === 'sale' && (
            <>
              <h3 className="text-gray-600 text-sm font-semibold mb-3">Quick add</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {SALE_TAGS.map(tag => (
                  <button key={tag} onClick={() => setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tags.includes(tag) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
          <input
            type="text"
            value={customDesc}
            onChange={e => setCustomDesc(e.target.value)}
            placeholder="Add a note..."
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-amber-500 transition-colors mb-auto"
          />
          <div className="py-4">
            <button onClick={submit} disabled={loading} className="amber-btn">
              {loading ? 'Recording...' : `Record ${mode === 'sale' ? 'Sale' : 'Expense'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
