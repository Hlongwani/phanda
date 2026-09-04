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
    const today = new Date().toISOString().split('T')[0];

    const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(user.merchantId) as {
      first_name: string; last_name: string; phone_number: string;
    };
    const business = db.prepare('SELECT * FROM businesses WHERE merchant_id = ?').get(user.merchantId) as {
      trading_name: string; category: string; city: string;
    };
    const passport = db.prepare('SELECT * FROM passports WHERE merchant_id = ?').get(user.merchantId) as {
      health_score: number; passport_number: string; verification_level: string;
      total_revenue_30d: number; transaction_count_30d: number; operating_days: number;
    };

    const todayStats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as sales,
        COUNT(CASE WHEN type = 'sale' THEN 1 END) as count
      FROM transactions
      WHERE merchant_id = ? AND is_deleted = 0 AND date(transaction_date) = date('now')
    `).get(user.merchantId) as { sales: number; count: number };

    const yesterdayStats = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as sales
      FROM transactions
      WHERE merchant_id = ? AND is_deleted = 0 AND date(transaction_date) = date('now', '-1 day')
    `).get(user.merchantId) as { sales: number };

    const streak = db.prepare(`
      WITH RECURSIVE dates AS (
        SELECT date('now') as d
        UNION ALL
        SELECT date(d, '-1 day') FROM dates WHERE d > date('now', '-60 days')
      )
      SELECT COUNT(*) as streak FROM dates d
      WHERE EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.merchant_id = ? AND t.is_deleted = 0 AND t.type = 'sale'
        AND date(t.transaction_date) = d.d
      )
      AND NOT EXISTS (
        SELECT 1 FROM dates d2
        WHERE d2.d < d.d AND d2.d > date('now', '-60 days')
        AND NOT EXISTS (
          SELECT 1 FROM transactions t
          WHERE t.merchant_id = ? AND t.is_deleted = 0 AND t.type = 'sale'
          AND date(t.transaction_date) = d2.d
        )
        AND d2.d > (SELECT MAX(date(transaction_date)) FROM transactions WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0)
      )
    `).get(user.merchantId, user.merchantId, user.merchantId) as { streak: number };

    const recent = db.prepare(`
      SELECT * FROM transactions
      WHERE merchant_id = ? AND is_deleted = 0
      ORDER BY transaction_date DESC LIMIT 5
    `).all(user.merchantId);

    // Week-on-week comparison
    const thisWeek = db.prepare(`
      SELECT COALESCE(SUM(amount),0) as sales, COUNT(*) as count
      FROM transactions
      WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0
      AND transaction_date >= datetime('now', 'weekday 0', '-7 days')
      AND transaction_date < datetime('now', 'weekday 0')
    `).get(user.merchantId) as { sales: number; count: number };

    const lastWeek = db.prepare(`
      SELECT COALESCE(SUM(amount),0) as sales, COUNT(*) as count
      FROM transactions
      WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0
      AND transaction_date >= datetime('now', 'weekday 0', '-14 days')
      AND transaction_date < datetime('now', 'weekday 0', '-7 days')
    `).get(user.merchantId) as { sales: number; count: number };

    return NextResponse.json({
      merchant,
      business,
      passport,
      today: {
        sales: todayStats.sales,
        count: todayStats.count,
        vsYesterday: yesterdayStats.sales > 0
          ? Math.round(((todayStats.sales - yesterdayStats.sales) / yesterdayStats.sales) * 100)
          : null
      },
      streak: streak.streak || 0,
      recent,
      weekOnWeek: {
        thisWeek: thisWeek.sales,
        lastWeek: lastWeek.sales,
        change: lastWeek.sales > 0
          ? Math.round(((thisWeek.sales - lastWeek.sales) / lastWeek.sales) * 100)
          : null,
        thisCount: thisWeek.count,
        lastCount: lastWeek.count,
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
