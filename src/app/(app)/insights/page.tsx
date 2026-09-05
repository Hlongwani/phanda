'use client';
import { useEffect, useState } from 'react';
import { apiFetch, getToken } from '@/lib/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Period = '7' | '30' | '90';

interface InsightsData {
  summary: { totalSales: number; totalExpenses: number; saleCount: number; avgSale: number };
  dailySales: Array<{ date: string; sales: number; count: number }>;
  paymentBreakdown: Array<{ payment_method: string; count: number; total: number }>;
  topCategories: Array<{ category: string; count: number; total: number }>;
  heatmap: Array<{ date: string; total: number }>;
}

interface CashFlowData {
  byDayOfWeek: Array<{ day: string; revenue: number; count: number }>;
  bestDay: string | null;
  slowestDay: string | null;
  bestHour: number | null;
  peakTime: string | null;
}

const PIE_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];

export default function InsightsPage() {
  const [period, setPeriod] = useState<Period>('30');
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/insights?period=${period}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    apiFetch('/api/cashflow')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCashFlow(d); })
      .catch(() => {});
  }, []);

  // Build last 30-day heatmap array
  function buildHeatmap() {
    const days: { date: string; total: number }[] = [];
    const map = new Map((data?.heatmap || []).map(h => [h.date, h.total]));
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, total: map.get(key) || 0 });
    }
    return days;
  }

  const heatmapDays = buildHeatmap();
  const maxHeat = Math.max(...heatmapDays.map(d => d.total), 1);

  const barData = (data?.dailySales || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
    Sales: Math.round(d.sales),
  })).slice(-14);

  const pieData = (data?.paymentBreakdown || []).map(p => ({
    name: p.payment_method.replace(/_/g, ' '),
    value: Math.round(p.total),
  }));

  const bestDay = (data?.dailySales || []).reduce((a, b) => b.sales > a.sales ? b : a, { date: '', sales: 0 });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-amber-500 px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold">My Insights</h1>
          <a
            href={`/api/statement?days=${period}&_t=${getToken()}`}
            onClick={e => {
              e.preventDefault();
              const token = getToken();
              fetch(`/api/statement?days=${period}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.text())
                .then(html => {
                  const w = window.open('', '_blank');
                  if (w) { w.document.write(html); w.document.close(); }
                });
            }}
            className="bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl"
          >
            📄 Statement
          </a>
        </div>
        <div className="flex gap-2">
          {(['7', '30', '90'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === p ? 'bg-white text-amber-500' : 'bg-amber-400/30 text-white'
              }`}>
              {p === '7' ? '7 days' : p === '30' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-gray-400">No data yet. Start recording sales!</div>
      ) : (
        <div className="px-5 pt-5 space-y-4">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-tile">
              <div className="text-2xl font-black text-gray-900">R {data.summary.totalSales.toFixed(0)}</div>
              <div className="text-gray-400 text-xs mt-0.5">Total Sales</div>
            </div>
            <div className="stat-tile">
              <div className="text-2xl font-black text-gray-900">{data.summary.saleCount}</div>
              <div className="text-gray-400 text-xs mt-0.5">Transactions</div>
            </div>
            <div className="stat-tile">
              <div className="text-2xl font-black text-gray-900">R {data.summary.avgSale.toFixed(0)}</div>
              <div className="text-gray-400 text-xs mt-0.5">Avg Sale Value</div>
            </div>
            <div className="stat-tile">
              <div className="text-2xl font-black text-gray-900">
                R {data.summary.totalSales - data.summary.totalExpenses > 0
                    ? (data.summary.totalSales - data.summary.totalExpenses).toFixed(0)
                    : '0'}
              </div>
              <div className="text-gray-400 text-xs mt-0.5">Est. Profit</div>
            </div>
          </div>

          {/* Cash Flow Calendar */}
          {cashFlow && cashFlow.byDayOfWeek.some(d => d.count > 0) && (() => {
            const maxRev = Math.max(...cashFlow.byDayOfWeek.map(d => d.revenue), 1);
            return (
              <div className="card">
                <h3 className="text-gray-800 font-semibold text-sm mb-1">Cash Flow Calendar</h3>
                <p className="text-gray-400 text-xs mb-3">Revenue by day of week — last 90 days</p>

                {/* Summary chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {cashFlow.bestDay && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      Busiest day: {cashFlow.bestDay}
                    </span>
                  )}
                  {cashFlow.peakTime && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      Peak time: {cashFlow.peakTime}
                    </span>
                  )}
                  {cashFlow.slowestDay && cashFlow.slowestDay !== cashFlow.bestDay && (
                    <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full">
                      Quietest day: {cashFlow.slowestDay}
                    </span>
                  )}
                </div>

                {/* Horizontal bar chart */}
                <div className="space-y-2">
                  {cashFlow.byDayOfWeek.map(({ day, revenue, count }) => {
                    const isBest = day === cashFlow.bestDay;
                    const isSlowest = day === cashFlow.slowestDay && day !== cashFlow.bestDay;
                    const widthPct = maxRev > 0 ? (revenue / maxRev) * 100 : 0;
                    return (
                      <div key={day} className="flex items-center gap-2">
                        <span className={`text-xs font-semibold w-7 shrink-0 ${isBest ? 'text-amber-600' : isSlowest ? 'text-gray-400' : 'text-gray-500'}`}>
                          {day}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          {count > 0 && (
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isBest ? 'bg-amber-500' : isSlowest ? 'bg-gray-300' : 'bg-amber-300'
                              }`}
                              style={{ width: `${Math.max(widthPct, 2)}%` }}
                            />
                          )}
                        </div>
                        <span className={`text-xs w-16 text-right shrink-0 ${isBest ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                          {count > 0 ? `R${revenue.toFixed(0)}` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Bar chart */}
          {barData.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-800 font-semibold text-sm">Daily Sales</h3>
                {bestDay.date && (
                  <span className="text-gray-400 text-xs">Best: {new Date(bestDay.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} (R{bestDay.sales.toFixed(0)})</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    interval={Math.floor(barData.length / 4)} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `R${v}`} />
                  <Tooltip formatter={(v) => [`R ${v}`, 'Sales']} />
                  <Bar dataKey="Sales" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {bestDay.date && (
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(bestDay.date).toLocaleDateString('en-ZA', { weekday: 'long' })}s are your strongest trading day.
                </p>
              )}
            </div>
          )}

          {/* Payment breakdown */}
          {pieData.length > 0 && (
            <div className="card">
              <h3 className="text-gray-800 font-semibold text-sm mb-3">How customers pay</h3>
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={pieData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="flex-1 space-y-2">
                  {pieData.map((p, i) => {
                    const total = pieData.reduce((s, x) => s + x.value, 0);
                    return (
                      <div key={p.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-gray-600 text-xs capitalize flex-1">{p.name}</span>
                        <span className="text-gray-800 text-xs font-semibold">{Math.round((p.value / total) * 100)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {pieData[0]?.name === 'cash' && (
                <p className="text-gray-400 text-xs mt-3 border-t border-gray-100 pt-3">
                  💡 Most of your customers pay cash. Accepting SnapScan could grow your sales.
                </p>
              )}
            </div>
          )}

          {/* Top categories */}
          {data.topCategories.length > 0 && (
            <div className="card">
              <h3 className="text-gray-800 font-semibold text-sm mb-3">What you sell most</h3>
              <div className="space-y-3">
                {data.topCategories.map((cat, i) => {
                  const max = data.topCategories[0].count;
                  return (
                    <div key={cat.category}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600 text-sm">{cat.category}</span>
                        <span className="text-gray-400 text-xs">{cat.count} sales</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(cat.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tax Estimate */}
          {data.summary.totalSales > 0 && (() => {
            // South Africa Small Business Corporation / Turnover Tax thresholds (2024/25)
            // Turnover Tax: 0% up to R335,000/yr; 1% on R335k–R500k; 2% on R500k–R750k; 3% on R750k+
            // Annualised from the selected period
            const periodDays = parseInt(period);
            const annualised = (data.summary.totalSales / periodDays) * 365;
            let taxRate = 0;
            let taxLabel = '';
            if (annualised <= 335000) { taxRate = 0; taxLabel = 'R0 (below threshold)'; }
            else if (annualised <= 500000) { taxRate = 0.01; taxLabel = '1% Turnover Tax'; }
            else if (annualised <= 750000) { taxRate = 0.02; taxLabel = '2% Turnover Tax'; }
            else { taxRate = 0.03; taxLabel = '3% Turnover Tax'; }
            const estimatedAnnualTax = annualised * taxRate;
            const periodTax = (data.summary.totalSales) * taxRate;
            return (
              <div className="card">
                <h3 className="text-gray-800 font-semibold text-sm mb-3">Tax Estimate</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xl font-black text-gray-900">R {annualised.toFixed(0)}</div>
                    <div className="text-gray-400 text-xs">Annualised revenue</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-amber-600">R {estimatedAnnualTax.toFixed(0)}</div>
                    <div className="text-gray-400 text-xs">Est. annual tax</div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl px-3 py-2">
                  <p className="text-amber-700 text-xs font-medium">Rate: {taxLabel}</p>
                  <p className="text-amber-600 text-xs mt-0.5">Est. tax for this {period}-day period: R {periodTax.toFixed(0)}</p>
                </div>
                <p className="text-gray-400 text-xs mt-2">Based on SA Turnover Tax (2024/25). Consult a tax professional for accuracy.</p>
              </div>
            );
          })()}

          {/* Heatmap */}
          <div className="card">
            <h3 className="text-gray-800 font-semibold text-sm mb-3">Recording consistency (30 days)</h3>
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
              {heatmapDays.map(({ date, total }) => (
                <div
                  key={date}
                  title={`${date}: R${total.toFixed(0)}`}
                  className="aspect-square rounded-sm"
                  style={{
                    background: total === 0
                      ? '#F3F4F6'
                      : `rgba(245, 158, 11, ${0.2 + (total / maxHeat) * 0.8})`
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              {heatmapDays.filter(d => d.total > 0).length} of 30 days recorded — keep your streak going!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
