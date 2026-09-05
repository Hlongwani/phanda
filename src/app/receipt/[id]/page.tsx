'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Receipt {
  id: string;
  amount: number;
  type: string;
  payment_method: string;
  description: string | null;
  category_tag: string | null;
  transaction_date: string;
  business: { trading_name: string };
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', card: 'Card / EFT', mixed: 'Mixed payment',
};

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/receipt/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setReceipt)
      .catch(() => setError('Receipt not found.'));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gray-50">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Receipt not found</h1>
        <p className="text-gray-500 text-sm">This receipt may have been deleted or the link is incorrect.</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  const date = new Date(receipt.transaction_date);
  const formattedDate = date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

  function share() {
    if (navigator.share) {
      navigator.share({ title: `Receipt from ${receipt!.business.trading_name}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-6 pt-10 pb-8 text-center">
          <div className="text-5xl mb-3">🧾</div>
          <h1 className="text-white text-2xl font-black">{receipt.business.trading_name}</h1>
          <p className="text-amber-100 text-sm mt-1">Digital Receipt</p>
        </div>

        {/* Amount */}
        <div className="px-6 py-6 border-b border-gray-100 text-center">
          <p className="text-gray-400 text-sm mb-1">Amount paid</p>
          <p className="text-5xl font-black text-gray-900">R {receipt.amount.toFixed(2)}</p>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Payment method</span>
            <span className="text-gray-800 font-medium text-sm">{METHOD_LABELS[receipt.payment_method] || receipt.payment_method}</span>
          </div>
          {receipt.description && (
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Items / Note</span>
              <span className="text-gray-800 font-medium text-sm text-right max-w-[60%]">{receipt.description}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Date</span>
            <span className="text-gray-800 font-medium text-sm">{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Time</span>
            <span className="text-gray-800 font-medium text-sm">{formattedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Reference</span>
            <span className="text-gray-500 text-xs font-mono">{receipt.id.slice(0, 12).toUpperCase()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <p className="text-center text-gray-400 text-xs mb-4">Issued via Phanda — Digital Business Platform</p>
          <button onClick={share}
            className="w-full bg-amber-500 text-white font-bold rounded-2xl py-3 text-sm">
            Share Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
