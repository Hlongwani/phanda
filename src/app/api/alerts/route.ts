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

  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Overdue credit accounts (have a due_date that's passed)
  const overdueCredit = db.prepare(`
    SELECT id, party_name, direction, total_amount,
      (SELECT COALESCE(SUM(amount),0) FROM credit_payments WHERE credit_id = credit_accounts.id) as settled
    FROM credit_accounts
    WHERE merchant_id = ? AND status = 'open' AND due_date IS NOT NULL AND due_date < ?
  `).all(user.merchantId, today) as Array<{ id: string; party_name: string; direction: string; total_amount: number; settled: number }>;

  // Laybys with no payment in 14+ days
  const staleLaybys = db.prepare(`
    SELECT l.id, l.customer_name, l.total_price,
      (SELECT COALESCE(SUM(amount),0) FROM layby_payments WHERE layby_id = l.id) as paid,
      (SELECT MAX(paid_at) FROM layby_payments WHERE layby_id = l.id) as last_payment
    FROM laybys l
    WHERE l.merchant_id = ? AND l.status = 'active'
    AND (
      last_payment IS NULL AND l.created_at < datetime('now', '-14 days')
      OR last_payment < datetime('now', '-14 days')
    )
  `).all(user.merchantId) as Array<{ id: string; customer_name: string; total_price: number; paid: number; last_payment: string | null }>;

  // No sales recorded today
  const { todayCount } = db.prepare(`
    SELECT COUNT(*) as todayCount FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0
    AND date(transaction_date) = date('now')
  `).get(user.merchantId) as { todayCount: number };

  // Streak at risk: had sales yesterday but none today (after 12pm)
  const hour = new Date().getHours();
  const { yesterdayCount } = db.prepare(`
    SELECT COUNT(*) as yesterdayCount FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0
    AND date(transaction_date) = date('now', '-1 day')
  `).get(user.merchantId) as { yesterdayCount: number };

  const alerts = [];

  for (const c of overdueCredit) {
    const balance = c.total_amount - c.settled;
    alerts.push({
      type: 'overdue_credit',
      severity: 'high',
      title: c.direction === 'owed' ? `${c.party_name} owes you R${balance.toFixed(0)}` : `You owe ${c.party_name} R${balance.toFixed(0)}`,
      body: 'Payment is overdue',
      href: '/credit',
    });
  }

  for (const l of staleLaybys) {
    const balance = l.total_price - l.paid;
    alerts.push({
      type: 'stale_layby',
      severity: 'medium',
      title: `${l.customer_name}'s layby — R${balance.toFixed(0)} left`,
      body: 'No payment in 14+ days',
      href: '/laybys',
    });
  }

  if (hour >= 17 && todayCount === 0 && yesterdayCount > 0) {
    alerts.push({
      type: 'no_sales_today',
      severity: 'low',
      title: 'No sales recorded today',
      body: 'Record a sale to keep your streak alive 🔥',
      href: '/record',
    });
  }

  return NextResponse.json({ alerts });
}
