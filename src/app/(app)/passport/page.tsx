'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client';

interface PassportData {
  passport: {
    passport_number: string;
    health_score: number;
    verification_level: string;
    total_revenue_30d: number;
    total_revenue_90d: number;
    total_revenue_365d: number;
    transaction_count_30d: number;
    operating_days: number;
    pct_cash: number;
    pct_digital: number;
    consistency_score: number;
    volume_score: number;
    longevity_score: number;
    avg_daily_revenue: number;
    generated_at: string;
    created_at: string;
  };
  business: { trading_name: string; category: string; city: string; province: string };
  merchant: { first_name: string; last_name: string; phone_number: string };
  monthsSince: number;
  badges: Array<{ id: string; label: string; icon: string; achieved: boolean }>;
  verificationLevels: Array<{ label: string; achieved: boolean }>;
}

function ScoreBar({ label, score, color = 'bg-amber-500' }: { label: string; score: number; color?: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-gray-600 text-sm">{label}</span>
        <span className="text-gray-800 font-semibold text-sm">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

async function getShareLink(): Promise<string> {
  const res = await apiFetch('/api/passport-share', { method: 'POST' });
  const { token } = await res.json();
  return `${window.location.origin}/p/${token}`;
}

export default function PassportPage() {
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/passport')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 px-6">
      <p className="text-gray-500 text-center">Could not load passport</p>
      <button onClick={() => window.location.reload()} className="amber-btn">Retry</button>
    </div>
  );

  const { passport, business, merchant, monthsSince, badges, verificationLevels } = data;
  const memberSince = new Date(passport.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="text-white font-bold">Business Passport</h1>
          <button
            className="text-gray-400 text-sm font-medium"
            onClick={() => {
              const text = `📊 Business Passport\n\n🏢 ${business.trading_name}\n👤 ${merchant.first_name} ${merchant.last_name}\n📍 ${business.city}, ${business.province}\n\nHealth Score: ${passport.health_score}/100\nTrading: ${passport.operating_days} days | Revenue: R${passport.total_revenue_30d.toFixed(0)}/30d\n\nVerified by Phanda 🌟`;
              if (navigator.share) navigator.share({ title: 'My Business Passport', text });
              else navigator.clipboard?.writeText(text).then(() => alert('Copied!'));
            }}
          >Share</button>
        </div>

        {/* Passport Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 border border-slate-700 relative overflow-hidden">
          {/* Watermark */}
          <div className="absolute right-4 top-4 text-amber-500/10 text-7xl font-black pointer-events-none">P</div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-8 bg-amber-500 rounded-full" />
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Business Passport</p>
                  <p className="text-amber-500 text-xs font-mono">{passport.passport_number}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-white">{passport.health_score}</div>
              <div className="text-gray-400 text-xs">Health Score</div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-white text-xl font-bold">{business.trading_name}</h2>
            <p className="text-gray-400 text-sm">{merchant.first_name} {merchant.last_name}</p>
            <p className="text-gray-500 text-xs mt-1">{business.city}, {business.province} · Member since {memberSince}</p>
          </div>

          {/* Verification badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            passport.verification_level === 'financially_verified' ? 'bg-emerald-900 text-emerald-400' :
            passport.verification_level === 'partially_verified' ? 'bg-blue-900 text-blue-400' :
            'bg-amber-900 text-amber-400'
          }`}>
            <span>{passport.verification_level === 'financially_verified' ? '✓' : passport.verification_level === 'partially_verified' ? '◑' : '◌'}</span>
            <span>{passport.verification_level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Trading History */}
        <div className="card">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">Trading History</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-black text-gray-900">R {passport.total_revenue_30d.toFixed(0)}</div>
              <div className="text-gray-400 text-xs">Revenue (30 days)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">R {passport.total_revenue_365d.toFixed(0)}</div>
              <div className="text-gray-400 text-xs">Revenue (all time)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{passport.operating_days}</div>
              <div className="text-gray-400 text-xs">Days trading</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{monthsSince}</div>
              <div className="text-gray-400 text-xs">Months active</div>
            </div>
          </div>

          {/* Cash vs Digital */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>💵 Cash {passport.pct_cash.toFixed(0)}%</span>
              <span>📱 Digital {passport.pct_digital.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${passport.pct_cash}%` }} />
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${passport.pct_digital}%` }} />
            </div>
          </div>
        </div>

        {/* Verification Levels */}
        <div className="card">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">Verification Journey</h3>
          <div className="space-y-3">
            {verificationLevels.map(({ label, achieved }, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  achieved ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {achieved ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium ${achieved ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                {achieved && <span className="ml-auto text-emerald-500 text-xs font-semibold">Done</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Health Score Breakdown</h3>
            <span className="text-2xl font-black text-gray-900">{passport.health_score}<span className="text-gray-400 text-sm font-normal">/100</span></span>
          </div>
          <ScoreBar label="Consistency (35%)" score={passport.consistency_score} />
          <ScoreBar label="Volume (25%)" score={passport.volume_score} color="bg-blue-500" />
          <ScoreBar label="Diversity (20%)" score={passport.pct_digital > 0 ? 80 : 40} color="bg-purple-500" />
          <ScoreBar label="Longevity (20%)" score={passport.longevity_score} color="bg-emerald-500" />
          <p className="text-gray-400 text-xs mt-2">
            {passport.consistency_score < 60 ? '💡 Record sales more consistently to boost your score.' :
             passport.volume_score < 50 ? '💡 Grow your monthly revenue to improve Volume score.' :
             '✅ Your score is looking strong. Keep trading!'}
          </p>
        </div>

        {/* Badges */}
        <div className="card">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">Achievements</h3>
          <div className="grid grid-cols-4 gap-3">
            {badges.map(({ id, label, icon, achieved }) => (
              <div key={id} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${achieved ? '' : 'opacity-30'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${achieved ? 'bg-amber-50' : 'bg-gray-100'}`}>
                  {icon}
                </div>
                <span className="text-gray-600 text-xs text-center leading-tight">{label}</span>
                {achieved && <span className="text-emerald-500 text-xs">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Credit Readiness */}
        {(() => {
          const steps = [
            { label: 'Record for 30+ days', done: passport.operating_days >= 30, detail: `${passport.operating_days}/30 days` },
            { label: '3 months of history', done: monthsSince >= 3, detail: `${monthsSince}/3 months` },
            { label: 'Health score ≥ 60', done: passport.health_score >= 60, detail: `${passport.health_score}/60` },
            { label: 'Use digital payments', done: passport.pct_digital > 10, detail: `${passport.pct_digital.toFixed(0)}% digital` },
            { label: 'R5,000+ monthly revenue', done: passport.total_revenue_30d >= 5000, detail: `R${passport.total_revenue_30d.toFixed(0)}/R5,000` },
          ];
          const done = steps.filter(s => s.done).length;
          const pct = Math.round((done / steps.length) * 100);
          return (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Credit Readiness</h3>
                <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-500' : 'text-gray-400'}`}>{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="space-y-2">
                {steps.map(({ label, done: d, detail }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${d ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {d ? '✓' : '○'}
                    </div>
                    <span className={`text-sm flex-1 ${d ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                    <span className={`text-xs ${d ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>{detail}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-4 pt-3 border-t border-gray-100">
                {pct === 100 ? '🎉 You\'re finance-ready! Share your passport with lenders.' :
                 `Complete ${steps.length - done} more step${steps.length - done > 1 ? 's' : ''} to become finance-ready.`}
              </p>
            </div>
          );
        })()}

        {/* Share CTA */}
        <div className="bg-slate-900 rounded-2xl p-5 text-center mb-4">
          <p className="text-white font-bold mb-1">Share your Passport</p>
          <p className="text-gray-400 text-sm mb-4">Let lenders, suppliers and markets see your trading history</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                const link = await getShareLink();
                const text = [
                  `📊 Business Passport`,
                  ``,
                  `🏢 ${business.trading_name}`,
                  `👤 ${merchant.first_name} ${merchant.last_name}`,
                  `📍 ${business.city}, ${business.province}`,
                  ``,
                  `Health Score: ${passport.health_score}/100`,
                  `Status: ${passport.verification_level.replace(/_/g, ' ')}`,
                  `Trading: ${passport.operating_days} days`,
                  `30-day Revenue: R ${passport.total_revenue_30d.toFixed(0)}`,
                  `Passport #: ${passport.passport_number}`,
                  ``,
                  `View full passport: ${link}`,
                ].join('\n');
                if (navigator.share) {
                  navigator.share({ title: 'My Business Passport', text, url: link });
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(text).then(() => alert('Passport link copied!'));
                }
              }}
              className="bg-amber-500 text-white font-bold rounded-xl px-4 py-3 text-sm"
            >
              📤 Share
            </button>
            <a
              href="#"
              onClick={async e => {
                e.preventDefault();
                const link = await getShareLink();
                const text = `📊 My Business Passport\n\n🏢 ${business.trading_name}\n👤 ${merchant.first_name} ${merchant.last_name}\n📍 ${business.city}, ${business.province}\n\nHealth Score: ${passport.health_score}/100\nStatus: ${passport.verification_level.replace(/_/g, ' ')}\nTrading: ${passport.operating_days} days\nRevenue: R${passport.total_revenue_30d.toFixed(0)}/30d\n\nView: ${link}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              target="_blank" rel="noopener noreferrer"
              className="bg-green-600 text-white font-bold rounded-xl px-4 py-3 text-sm flex items-center justify-center"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
