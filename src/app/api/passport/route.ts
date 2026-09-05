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

  try {
    const db = getDb();

    const passport = db.prepare('SELECT * FROM passports WHERE merchant_id = ?').get(user.merchantId) as Record<string, unknown>;
    const business = db.prepare('SELECT * FROM businesses WHERE merchant_id = ?').get(user.merchantId) as Record<string, unknown>;
    const merchant = db.prepare('SELECT first_name, last_name, phone_number, created_at FROM merchants WHERE id = ?').get(user.merchantId) as Record<string, unknown>;

    if (!passport) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    const firstTxn = db.prepare(`
      SELECT MIN(transaction_date) as first FROM transactions WHERE merchant_id = ? AND is_deleted = 0
    `).get(user.merchantId) as { first: string | null };

    const monthsSince = firstTxn.first
      ? Math.floor((Date.now() - new Date(firstTxn.first).getTime()) / (30 * 24 * 60 * 60 * 1000))
      : 0;

    const badges = computeBadges(db, user.merchantId, passport);

    const { count: verificationCount } = db.prepare(
      'SELECT COUNT(*) as count FROM verifications WHERE verified_merchant_id = ?'
    ).get(user.merchantId) as { count: number };

    return NextResponse.json({
      passport,
      business,
      merchant,
      monthsSince,
      badges,
      verificationCount,
      verificationLevels: [
        { label: 'Identity Verified', achieved: true },
        { label: '30 Days Active', achieved: (passport.operating_days as number) >= 30 },
        { label: '3 Months Consistent', achieved: monthsSince >= 3 },
        { label: 'Finance Ready', achieved: (passport.health_score as number) >= 70 && monthsSince >= 6 },
      ]
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch passport' }, { status: 500 });
  }
}

function computeBadges(db: ReturnType<typeof getDb>, merchantId: string, passport: Record<string, unknown>) {
  const totalTxns = (db.prepare("SELECT COUNT(*) as c FROM transactions WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0").get(merchantId) as { c: number }).c;
  const maxDay = (db.prepare(`
    SELECT MAX(daily) as m FROM (
      SELECT SUM(amount) as daily FROM transactions
      WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0
      GROUP BY date(transaction_date)
    )
  `).get(merchantId) as { m: number | null }).m || 0;

  return [
    { id: 'first_sale', label: 'First Sale', icon: '🎯', achieved: totalTxns >= 1 },
    { id: '7_day_streak', label: '7-Day Streak', icon: '🔥', achieved: (passport.operating_days as number) >= 7 },
    { id: '50_sales', label: '50 Sales', icon: '💼', achieved: totalTxns >= 50 },
    { id: 'r5000_month', label: 'R5,000 Month', icon: '💰', achieved: (passport.total_revenue_30d as number) >= 5000 },
    { id: 'r10k_month', label: 'R10,000 Month', icon: '🏆', achieved: (passport.total_revenue_30d as number) >= 10000 },
    { id: 'consistency', label: '30 Days Active', icon: '📅', achieved: (passport.operating_days as number) >= 30 },
    { id: 'digital', label: 'Digital Trader', icon: '📱', achieved: (passport.pct_digital as number) > 20 },
    { id: 'best_day', label: 'R1,000 Day', icon: '⭐', achieved: maxDay >= 1000 },
  ];
}
