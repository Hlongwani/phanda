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

function verificationLabel(level: string): string {
  return level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function verificationColor(level: string): string {
  if (level === 'financially_verified') return '#059669';
  if (level === 'partially_verified') return '#2563EB';
  return '#D97706';
}

export default function PrintPassportPage() {
  const [data, setData] = useState<PassportData | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/passport');
        if (!res.ok) { setError(true); setLoading(false); return; }
        const passportData: PassportData = await res.json();
        setData(passportData);

        // Fetch share token and build QR code
        try {
          const shareRes = await apiFetch('/api/passport-share', { method: 'POST' });
          if (shareRes.ok) {
            const { token } = await shareRes.json();
            const url = `${window.location.origin}/p/${token}`;
            setShareUrl(url);
            setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`);
          }
        } catch {
          // QR code is non-critical; continue without it
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{
          width: 36, height: 36, border: '4px solid #F59E0B',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <p style={{ color: '#6B7280' }}>Could not load passport</p>
        <button onClick={() => window.location.reload()} style={{ background: '#F59E0B', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  const { passport, business, merchant } = data;
  const memberSince = new Date(passport.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const generatedAt = new Date(passport.generated_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const vColor = verificationColor(passport.verification_level);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .phone-frame { max-width: 100% !important; border-radius: 0 !important; box-shadow: none !important; }
          .print-page { padding: 0 !important; }
        }
        @page {
          size: A4;
          margin: 15mm 20mm;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Toolbar — hidden when printing */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#374151' }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Print Passport</span>
        <button
          onClick={() => window.print()}
          style={{
            background: '#F59E0B', color: 'white', border: 'none',
            borderRadius: 10, padding: '9px 20px', fontWeight: 700,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          Print / Save PDF
        </button>
      </div>

      {/* Print document */}
      <div className="print-page" style={{ paddingTop: 64, maxWidth: 680, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* Document header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px 16px 0 0',
          padding: '28px 32px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
        }}>
          {/* Left — branding + business info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Phanda wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, background: '#F59E0B',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 16,
              }}>P</div>
              <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: 18, letterSpacing: '0.05em' }}>PHANDA</span>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 500, marginLeft: 4, alignSelf: 'flex-end', paddingBottom: 2 }}>Business Passport</span>
            </div>

            <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 4px', lineHeight: 1.1 }}>
              {business.trading_name}
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 14, margin: '0 0 2px' }}>
              {merchant.first_name} {merchant.last_name}
            </p>
            <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 16px' }}>
              {business.city}, {business.province} &nbsp;·&nbsp; Member since {memberSince}
            </p>

            {/* Passport number + verification badge row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 6, padding: '4px 10px',
              }}>
                <span style={{ color: '#F59E0B', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em' }}>
                  # {passport.passport_number}
                </span>
              </div>
              <div style={{
                background: `${vColor}22`,
                border: `1px solid ${vColor}55`,
                borderRadius: 6, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ color: vColor, fontSize: 10 }}>
                  {passport.verification_level === 'financially_verified' ? '✓' :
                   passport.verification_level === 'partially_verified' ? '◑' : '◌'}
                </span>
                <span style={{ color: vColor, fontSize: 11, fontWeight: 600 }}>
                  {verificationLabel(passport.verification_level)}
                </span>
              </div>
            </div>
          </div>

          {/* Right — health score */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              width: 90, height: 90,
              background: 'rgba(245,158,11,0.15)',
              border: '3px solid #F59E0B',
              borderRadius: '50%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#F59E0B', fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
                {passport.health_score}
              </span>
              <span style={{ color: '#94A3B8', fontSize: 9, marginTop: 2 }}>/ 100</span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: 10, marginTop: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Health Score
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderTop: 'none',
          borderRadius: '0 0 16px 16px',
          padding: '28px 32px',
        }}>

          {/* Key stats grid */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
              Key Statistics
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Revenue (30 days)', value: `R ${passport.total_revenue_30d.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` },
                { label: 'Days Trading', value: passport.operating_days.toString() },
                { label: 'Consistency Score', value: `${passport.consistency_score}/100` },
                { label: 'Avg Daily Revenue', value: `R ${passport.avg_daily_revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: '#F9FAFB', borderRadius: 10,
                  padding: '12px 14px', border: '1px solid #F3F4F6',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Score bars + QR code row */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>

            {/* Score breakdown */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
                Score Breakdown
              </h2>
              {[
                { label: 'Consistency (35%)', score: passport.consistency_score, color: '#F59E0B' },
                { label: 'Volume (25%)', score: passport.volume_score, color: '#3B82F6' },
                { label: 'Diversity (20%)', score: passport.pct_digital > 0 ? 80 : 40, color: '#8B5CF6' },
                { label: 'Longevity (20%)', score: passport.longevity_score, color: '#10B981' },
              ].map(({ label, score, color }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{score}/100</span>
                  </div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* QR code */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', textAlign: 'center' }}>
                View Online
              </h2>
              {qrUrl ? (
                <div style={{
                  border: '1px solid #E5E7EB', borderRadius: 10,
                  padding: 8, display: 'inline-block', background: 'white',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="Passport QR code" width={120} height={120} style={{ display: 'block' }} />
                </div>
              ) : (
                <div style={{
                  width: 136, height: 136, background: '#F9FAFB',
                  border: '1px solid #E5E7EB', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#D1D5DB', fontSize: 11 }}>No QR</span>
                </div>
              )}
              {shareUrl && (
                <p style={{ fontSize: 9, color: '#9CA3AF', marginTop: 6, maxWidth: 140, wordBreak: 'break-all', lineHeight: 1.4 }}>
                  {shareUrl}
                </p>
              )}
            </div>
          </div>

          {/* Payment mix */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
              Payment Mix
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 5 }}>
              <span>Cash {passport.pct_cash.toFixed(0)}%</span>
              <span>Digital {passport.pct_digital.toFixed(0)}%</span>
            </div>
            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', width: `${passport.pct_cash}%`, background: '#F59E0B' }} />
              <div style={{ height: '100%', width: `${passport.pct_digital}%`, background: '#3B82F6' }} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#F3F4F6', margin: '0 0 20px' }} />

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: '#6B7280' }}>Disclaimer:</strong> This passport reflects self-recorded trading data verified by Phanda. It is not a bank statement or audited financial report. Information is accurate as of the date generated.
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 }}>
                <div style={{
                  width: 18, height: 18, background: '#F59E0B',
                  borderRadius: 4, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 10,
                }}>P</div>
                <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: 13 }}>PHANDA</span>
              </div>
              <p style={{ fontSize: 9, color: '#D1D5DB', margin: 0 }}>Generated {generatedAt}</p>
            </div>
          </div>
        </div>

        {/* Bottom print hint */}
        <p className="no-print" style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 24, marginBottom: 32 }}>
          Use your browser&apos;s &ldquo;Save as PDF&rdquo; option for best results. Set margins to None for a clean border-to-border print.
        </p>
      </div>
    </>
  );
}
