import { notFound } from 'next/navigation';

interface PassportData {
  merchant: { first_name: string; last_name: string };
  business: { trading_name: string; category: string; city: string; province: string };
  passport: {
    passport_number: string; health_score: number; verification_level: string;
    total_revenue_30d: number; operating_days: number; pct_cash: number; pct_digital: number;
    consistency_score: number; volume_score: number; longevity_score: number; created_at: string;
  };
}

async function getData(token: string): Promise<PassportData | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/p/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function PublicPassportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getData(token);
  if (!data) notFound();

  const { merchant, business, passport } = data;
  const memberSince = new Date(passport.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const scoreColor = passport.health_score >= 70 ? '#10B981' : passport.health_score >= 50 ? '#F59E0B' : '#EF4444';
  const r = 42, circ = 2 * Math.PI * r, fill = (passport.health_score / 100) * circ;

  const CATEGORY_LABELS: Record<string, string> = {
    general_retail: 'General Retail', food_and_beverage: 'Food & Beverage', beauty_and_hair: 'Beauty & Hair',
    electronics_and_airtime: 'Electronics & Airtime', clothing_and_textiles: 'Clothing & Textiles',
    construction_and_repairs: 'Construction & Repairs', transport_and_logistics: 'Transport & Logistics', other: 'Other',
  };

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', background: '#0F172A', minHeight: '100vh', padding: '0' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', background: '#0F172A', minHeight: '100vh', paddingBottom: 40 }}>

        {/* Brand bar */}
        <div style={{ background: '#F59E0B', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>PHANDA</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Verified Business Passport</span>
        </div>

        {/* Card */}
        <div style={{ margin: 20, background: 'linear-gradient(135deg,#1E293B,#0F172A)', borderRadius: 24, padding: 24, border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 80, fontWeight: 900, color: 'rgba(245,158,11,0.08)', pointerEvents: 'none' }}>P</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Business Passport</div>
              <div style={{ color: '#F59E0B', fontFamily: 'monospace', fontSize: 12 }}>{passport.passport_number}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'white', fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{passport.health_score}</div>
              <div style={{ color: '#94A3B8', fontSize: 11 }}>Health Score</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 900 }}>{business.trading_name}</div>
            <div style={{ color: '#94A3B8', fontSize: 14 }}>{merchant.first_name} {merchant.last_name}</div>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>{business.city}, {business.province} · {CATEGORY_LABELS[business.category] || business.category}</div>
            <div style={{ color: '#64748B', fontSize: 12 }}>Member since {memberSince}</div>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: passport.verification_level === 'financially_verified' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            color: passport.verification_level === 'financially_verified' ? '#10B981' : '#F59E0B',
          }}>
            {passport.verification_level === 'financially_verified' ? '✓' : '◌'}
            {passport.verification_level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '0 20px 20px' }}>
          {[
            { val: `R ${passport.total_revenue_30d.toFixed(0)}`, lbl: 'Revenue (30 days)' },
            { val: `${passport.operating_days}`, lbl: 'Days Trading' },
            { val: `${passport.pct_digital.toFixed(0)}%`, lbl: 'Digital Payments' },
            { val: `${passport.consistency_score}/100`, lbl: 'Consistency Score' },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={{ background: '#1E293B', borderRadius: 16, padding: 16, border: '1px solid #334155' }}>
              <div style={{ color: 'white', fontSize: 22, fontWeight: 900 }}>{val}</div>
              <div style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Score ring */}
        <div style={{ background: '#1E293B', borderRadius: 16, margin: '0 20px 20px', padding: 20, border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="96" height="96" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx="48" cy="48" r={r} fill="none" stroke="#334155" strokeWidth="7" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={scoreColor} strokeWidth="7"
              strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
          </svg>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>Health Score: {passport.health_score}/100</div>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
              {passport.health_score >= 70 ? '✅ Finance-Ready' : passport.health_score >= 50 ? '⏳ Building History' : '🌱 Early Stage'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 11, padding: '0 20px' }}>
          This passport is issued by Phanda and reflects self-recorded trading data.<br />
          Passport #{passport.passport_number} · Verified {new Date().toLocaleDateString('en-ZA')}
        </div>
      </div>
    </div>
  );
}
