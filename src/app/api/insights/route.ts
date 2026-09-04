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
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30';
    const days = parseInt(period);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const summary = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as totalSales,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpenses,
        COUNT(CASE WHEN type = 'sale' THEN 1 END) as saleCount,
        COALESCE(AVG(CASE WHEN type = 'sale' THEN amount END), 0) as avgSale
      FROM transactions
      WHERE merchant_id = ? AND is_deleted = 0 AND transaction_date >= ?
    `).get(user.merchantId, since) as {
      totalSales: number; totalExpenses: number; saleCount: number; avgSale: number;
    };

    const dailySales = db.prepare(`
      SELECT
        date(transaction_date) as date,
        COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as sales,
        COUNT(CASE WHEN type = 'sale' THEN 1 END) as count
      FROM transactions
      WHERE merchant_id = ? AND is_deleted = 0 AND transaction_date >= ?
      GROUP BY date(transaction_date)
      ORDER BY date ASC
    `).all(user.merchantId, since) as { date: string; sales: number; count: number }[];

    const paymentBreakdown = db.prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM transactions
      WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0 AND transaction_date >= ?
      GROUP BY payment_method
    `).all(user.merchantId, since) as { payment_method: string; count: number; total: number }[];

    const topCategories = db.prepare(`
      SELECT
        COALESCE(category_tag, 'Other') as category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM transactions
      WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0 AND transaction_date >= ?
        AND category_tag IS NOT NULL
      GROUP BY category_tag
      ORDER BY count DESC
      LIMIT 5
    `).all(user.merchantId, since) as { category: string; count: number; total: number }[];

    const heatmap = db.prepare(`
      SELECT date(transaction_date) as date, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0
        AND transaction_date >= date('now', '-30 days')
      GROUP BY date(transaction_date)
    `).all(user.merchantId) as { date: string; total: number }[];

    return NextResponse.json({ summary, dailySales, paymentBreakdown, topCategories, heatmap });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}
