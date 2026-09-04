'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getToken } from '@/lib/client';

interface DashboardData {
  merchant: { first_name: string; last_name: string };
  business: { trading_name: string; category: string; city: string };
  passport: {
    health_score: number;
    passport_number: string;
    verification_level: string;
    total_revenue_30d: number;
    transaction_count_30d: number;
    operating_days: number;
  };
  today: { sales: number; count: number; vsYesterday: number | null };
  streak: number;
  recent: Array<{ id: string; amount: number; payment_method: string; description: string; transaction_date: string; type: string }>;
  weekOnWeek: { thisWeek: number; lastWeek: number; change: number | null; thisCount: number; lastCount: number } | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  general_retail: '🛒', food_and_beverage: '🍳', beauty_and_hair: '✂️',
  electronics_and_airtime: '📱', clothing_and_textiles: '👗', construction_and_repairs: '🔧',
  transport_and_logistics: '🚗', other: '💼',
};

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵', card: '💳', snapscan: '📱', eft: '🏦', yoco: '💳', ozow: '💳', other_digital: '💳'
};

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="white" strokeWidth="7"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-white text-2xl font-black">{score}</div>
        <div className="text-white/70 text-xs">Score</div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface GoalData { goal: number; currentRevenue: number; forecast: number; daysInMonth: number; dayOfMonth: number }
interface Alert { type: string; severity: string; title: string; body: string; href: string }

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) { router.replace('/welcome'); return; }
    Promise.all([
      apiFetch('/api/dashboard').then(r => r.ok ? r.json() : null),
      apiFetch('/api/goal').then(r => r.ok ? r.json() : null),
      apiFetch('/api/alerts').then(r => r.ok ? r.json() : null),
    ]).then(([d, g, a]) => {
      if (d) setData(d);
      if (g) setGoalData(g);
      if (a) setAlerts(a.alerts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  async function saveGoal() {
    const val = parseFloat(goalInput);
    if (!val || val <= 0) return;
    await apiFetch('/api/goal', { method: 'POST', body: JSON.stringify({ goal: val }) });
    setGoalData(g => g ? { ...g, goal: val } : null);
    setShowGoalInput(false);
    setGoalInput('');
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 px-6">
      <p className="text-gray-500 text-center">Could not load dashboard</p>
      <button onClick={() => window.location.reload()} className="amber-btn">Retry</button>
    </div>
  );

  const { merchant, business, passport, today, streak, recent } = data;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-amber-500 px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-amber-100 text-sm">{getGreeting()}</p>
            <h1 className="text-white text-xl font-bold">{merchant.first_name} {merchant.last_name}</h1>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            title="Settings"
          >
            <span className="text-white font-bold text-sm">{merchant.first_name[0]}{merchant.last_name[0] || ''}</span>
          </button>
        </div>

        {/* Passport Card */}
        <Link href="/passport">
          <div className="bg-slate-900 rounded-3xl p-5 flex items-center justify-between shadow-xl">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{CATEGORY_ICONS[business.category] || '💼'}</span>
                <span className="text-gray-400 text-xs uppercase tracking-wider">{business.category.replace(/_/g, ' ')}</span>
              </div>
              <h2 className="text-white text-lg font-bold leading-tight">{business.trading_name}</h2>
              <p className="text-gray-400 text-xs mt-1">{business.city} · {passport.passport_number}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  passport.verification_level === 'financially_verified' ? 'bg-emerald-900 text-emerald-400' :
                  passport.verification_level === 'partially_verified' ? 'bg-blue-900 text-blue-400' :
                  'bg-amber-900 text-amber-400'
                }`}>
                  {passport.verification_level === 'financially_verified' ? '✓ Verified' :
                   passport.verification_level === 'partially_verified' ? '◑ Partial' : '◌ Self-recorded'}
                </span>
              </div>
            </div>
            <ScoreRing score={passport.health_score} />
          </div>
        </Link>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <Link key={i} href={alert.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                  alert.severity === 'high' ? 'bg-red-50 border border-red-200' :
                  alert.severity === 'medium' ? 'bg-amber-50 border border-amber-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                <span className="text-xl flex-shrink-0">
                  {alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : '💡'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    alert.severity === 'high' ? 'text-red-700' : alert.severity === 'medium' ? 'text-amber-700' : 'text-blue-700'
                  }`}>{alert.title}</p>
                  <p className={`text-xs ${
                    alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
                  }`}>{alert.body}</p>
                </div>
                <span className="text-gray-400 text-sm">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* Today stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-tile">
            <div className="text-xl font-black text-gray-900">R {today.sales.toFixed(0)}</div>
            <div className="text-gray-400 text-xs mt-0.5">Today</div>
            {today.vsYesterday !== null && (
              <div className={`text-xs font-medium mt-1 ${today.vsYesterday >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {today.vsYesterday >= 0 ? '↑' : '↓'} {Math.abs(today.vsYesterday)}% vs yesterday
              </div>
            )}
          </div>
          <div className="stat-tile">
            <div className="text-xl font-black text-gray-900">{today.count}</div>
            <div className="text-gray-400 text-xs mt-0.5">Sales today</div>
          </div>
          <div className="stat-tile">
            <div className="text-xl font-black text-gray-900 flex items-center gap-1">
              {streak} <span className="text-base">🔥</span>
            </div>
            <div className="text-gray-400 text-xs mt-0.5">Day streak</div>
          </div>
        </div>

        {/* Week-on-week */}
        {data.weekOnWeek && (data.weekOnWeek.thisWeek > 0 || data.weekOnWeek.lastWeek > 0) && (
          <div className="card">
            <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-3">This Week vs Last Week</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xl font-black text-gray-900">R {data.weekOnWeek.thisWeek.toFixed(0)}</div>
                <div className="text-gray-400 text-xs">This week · {data.weekOnWeek.thisCount} sales</div>
              </div>
              <div>
                <div className="text-xl font-black text-gray-400">R {data.weekOnWeek.lastWeek.toFixed(0)}</div>
                <div className="text-gray-400 text-xs">Last week · {data.weekOnWeek.lastCount} sales</div>
              </div>
            </div>
            {data.weekOnWeek.change !== null && (
              <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold ${data.weekOnWeek.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {data.weekOnWeek.change >= 0 ? '↑' : '↓'} {Math.abs(data.weekOnWeek.change)}% {data.weekOnWeek.change >= 0 ? 'up' : 'down'} from last week
              </div>
            )}
          </div>
        )}

        {/* Monthly goal + forecast */}
        {goalData && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold">This Month</h3>
              <button onClick={() => setShowGoalInput(v => !v)} className="text-amber-500 text-xs font-semibold">
                {goalData.goal > 0 ? `Goal: R ${goalData.goal.toFixed(0)}` : '+ Set goal'}
              </button>
            </div>

            {showGoalInput && (
              <div className="flex gap-2 mb-3">
                <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                  placeholder="Monthly target (R)" className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500" />
                <button onClick={saveGoal} className="bg-amber-500 text-white font-bold px-4 rounded-xl text-sm">Save</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xl font-black text-gray-900">R {goalData.currentRevenue.toFixed(0)}</div>
                <div className="text-gray-400 text-xs">Earned so far</div>
              </div>
              <div>
                <div className="text-xl font-black text-blue-600">R {goalData.forecast.toFixed(0)}</div>
                <div className="text-gray-400 text-xs">Forecast (month end)</div>
              </div>
            </div>

            {goalData.goal > 0 && (
              <>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>R {goalData.currentRevenue.toFixed(0)}</span>
                  <span>R {goalData.goal.toFixed(0)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${goalData.currentRevenue >= goalData.goal ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min((goalData.currentRevenue / goalData.goal) * 100, 100)}%` }} />
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  {goalData.currentRevenue >= goalData.goal
                    ? '🎉 Goal reached!'
                    : `R ${(goalData.goal - goalData.currentRevenue).toFixed(0)} to go · day ${goalData.dayOfMonth} of ${goalData.daysInMonth}`}
                </p>
              </>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/record" className="bg-amber-500 rounded-2xl p-4 flex items-center gap-3 shadow-md shadow-amber-200">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">+</span>
              </div>
              <span className="text-white font-bold">Record Sale</span>
            </Link>
            <Link href="/passport" className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🪪</span>
              </div>
              <span className="text-gray-800 font-semibold text-sm">My Passport</span>
            </Link>
            <Link href="/insights" className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <span className="text-gray-800 font-semibold text-sm">Insights</span>
            </Link>
            <Link href="/laybys" className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">🛍️</span>
              </div>
              <span className="text-gray-800 font-semibold text-sm">Laybys</span>
            </Link>
            <Link href="/credit" className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">💸</span>
              </div>
              <span className="text-gray-800 font-semibold text-sm">Credit Book</span>
            </Link>
          </div>
        </div>

        {/* 30-day summary */}
        <div className="card">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-3">30-Day Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-black text-gray-900">R {passport.total_revenue_30d.toFixed(0)}</div>
              <div className="text-gray-400 text-xs">Total revenue</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{passport.transaction_count_30d}</div>
              <div className="text-gray-400 text-xs">Total sales</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{passport.operating_days}</div>
              <div className="text-gray-400 text-xs">Days active</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                R {passport.transaction_count_30d > 0 ? (passport.total_revenue_30d / passport.transaction_count_30d).toFixed(0) : '0'}
              </div>
              <div className="text-gray-400 text-xs">Avg sale value</div>
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Recent Sales</h3>
            <Link href="/insights" className="text-amber-500 text-xs font-semibold">See all</Link>
          </div>

          {recent.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-gray-500 text-sm">No sales yet today.</p>
              <Link href="/record" className="text-amber-500 font-semibold text-sm mt-1 block">Record your first one →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.filter(t => t.type === 'sale').slice(0, 5).map(txn => (
                <div key={txn.id} className="card flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {PAYMENT_ICONS[txn.payment_method] || '💵'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-semibold text-sm truncate">{txn.description || 'Sale'}</p>
                    <p className="text-gray-400 text-xs capitalize">{txn.payment_method.replace(/_/g, ' ')} · {new Date(txn.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="text-gray-900 font-bold text-sm">R {txn.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
