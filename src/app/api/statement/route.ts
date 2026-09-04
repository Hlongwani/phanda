import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

export async function GET(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '90');

  const db = getDb();
  const merchant = db.prepare('SELECT first_name, last_name, phone_number FROM merchants WHERE id = ?').get(user.merchantId) as { first_name: string; last_name: string; phone_number: string };
  const business = db.prepare('SELECT * FROM businesses WHERE merchant_id = ?').get(user.merchantId) as { trading_name: string; city: string; province: string; category: string };
  const passport = db.prepare('SELECT passport_number, health_score, verification_level FROM passports WHERE merchant_id = ?').get(user.merchantId) as { passport_number: string; health_score: number; verification_level: string };

  const txns = db.prepare(`
    SELECT * FROM transactions
    WHERE merchant_id = ? AND is_deleted = 0
    AND transaction_date >= datetime('now', ?)
    ORDER BY transaction_date DESC
  `).all(user.merchantId, `-${days} days`) as Array<{ type: string; amount: number; payment_method: string; description: string; transaction_date: string }>;

  const totalSales = txns.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalSales - totalExpenses;

  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const periodLabel = days === 30 ? 'Last 30 Days' : days === 90 ? 'Last 90 Days' : `Last ${days} Days`;

  const rows = txns.map(t => `
    <tr>
      <td>${new Date(t.transaction_date).toLocaleDateString('en-ZA')}</td>
      <td>${t.type === 'sale' ? 'Sale' : 'Expense'}</td>
      <td>${(t.description || '—').slice(0, 40)}</td>
      <td>${t.payment_method.replace(/_/g, ' ')}</td>
      <td style="color:${t.type === 'sale' ? '#059669' : '#DC2626'};text-align:right">
        ${t.type === 'sale' ? '+' : '-'}R ${t.amount.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Business Statement — ${business.trading_name}</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; color: #111; max-width: 800px; margin: 0 auto; padding: 40px 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #F59E0B; }
  .brand { font-size: 28px; font-weight: 900; color: #F59E0B; }
  .meta { text-align: right; font-size: 12px; color: #666; }
  h2 { font-size: 18px; margin: 0 0 4px; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
  .tile { background: #F9FAFB; border-radius: 8px; padding: 16px; }
  .tile .val { font-size: 22px; font-weight: 900; }
  .tile .lbl { font-size: 11px; color: #666; margin-top: 4px; }
  .green { color: #059669; }
  .red { color: #DC2626; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
  th { background: #F3F4F6; text-align: left; padding: 10px 8px; font-weight: 600; border-bottom: 1px solid #E5E7EB; }
  td { padding: 9px 8px; border-bottom: 1px solid #F3F4F6; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #999; text-align: center; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
           background: ${passport.verification_level === 'financially_verified' ? '#D1FAE5' : '#FEF3C7'};
           color: ${passport.verification_level === 'financially_verified' ? '#065F46' : '#92400E'}; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">PHANDA</div>
    <h2>${business.trading_name}</h2>
    <div style="font-size:13px;color:#666">${merchant.first_name} ${merchant.last_name} · ${merchant.phone_number}</div>
    <div style="font-size:13px;color:#666">${business.city}, ${business.province}</div>
    <div style="margin-top:8px"><span class="badge">${passport.verification_level.replace(/_/g, ' ')}</span>
    <span style="margin-left:8px;font-size:12px;color:#666">Passport #${passport.passport_number} · Score: ${passport.health_score}/100</span></div>
  </div>
  <div class="meta">
    <div style="font-weight:700;font-size:16px">Business Statement</div>
    <div>${periodLabel}</div>
    <div>Generated: ${generated}</div>
  </div>
</div>

<div class="summary">
  <div class="tile"><div class="val green">R ${totalSales.toFixed(2)}</div><div class="lbl">Total Sales</div></div>
  <div class="tile"><div class="val red">R ${totalExpenses.toFixed(2)}</div><div class="lbl">Total Expenses</div></div>
  <div class="tile"><div class="val ${netProfit >= 0 ? 'green' : 'red'}">R ${netProfit.toFixed(2)}</div><div class="lbl">Net Profit</div></div>
</div>

<table>
  <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Method</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#999;padding:24px">No transactions in this period</td></tr>'}</tbody>
</table>

<div class="footer">This document is generated by Phanda and reflects self-recorded trading data. Passport #${passport.passport_number}. Not a certified financial statement.</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="phanda-statement-${business.trading_name.replace(/\s+/g, '-')}.html"`,
    },
  });
}
