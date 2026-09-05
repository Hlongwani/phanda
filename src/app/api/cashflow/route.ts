import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
// Display order: Mon–Sun (index 1–6, then 0)
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function peakTimeLabel(hour: number): string {
  if (hour >= 6 && hour < 12) return 'Morning (6-12)';
  if (hour >= 12 && hour < 17) return 'Afternoon (12-17)';
  if (hour >= 17 && hour < 21) return 'Evening (17-21)';
  return 'Night (21-6)';
}

export async function GET(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();

    // Revenue and count by day-of-week over last 90 days
    const dowRows = db.prepare(`
      SELECT
        CAST(strftime('%w', transaction_date) AS INTEGER) as dow,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as count
      FROM transactions
      WHERE merchant_id = ?
        AND type = 'sale'
        AND is_deleted = 0
        AND transaction_date >= date('now', '-90 days')
      GROUP BY dow
    `).all(user.merchantId) as { dow: number; revenue: number; count: number }[];

    // Build a full 7-entry map (0=Sun … 6=Sat), filling in zeros
    const dowMap = new Map<number, { revenue: number; count: number }>();
    for (const row of dowRows) {
      dowMap.set(row.dow, { revenue: row.revenue, count: row.count });
    }

    // Return Mon–Sun display order
    const byDayOfWeek = DISPLAY_ORDER.map(dow => ({
      day: DOW_NAMES[dow],
      revenue: Math.round((dowMap.get(dow)?.revenue ?? 0) * 100) / 100,
      count: dowMap.get(dow)?.count ?? 0,
    }));

    // Best day: highest revenue
    const withData = byDayOfWeek.filter(d => d.count > 0);
    const bestDayObj = withData.length
      ? withData.reduce((a, b) => b.revenue > a.revenue ? b : a)
      : null;
    const bestDay = bestDayObj?.day ?? null;

    // Slowest day: lowest revenue among days with at least 1 transaction
    const slowestDayObj = withData.length
      ? withData.reduce((a, b) => b.revenue < a.revenue ? b : a)
      : null;
    const slowestDay = slowestDayObj?.day ?? null;

    // Best hour by transaction count
    const hourRow = db.prepare(`
      SELECT
        CAST(strftime('%H', transaction_date) AS INTEGER) as hour,
        COUNT(*) as count
      FROM transactions
      WHERE merchant_id = ?
        AND type = 'sale'
        AND is_deleted = 0
        AND transaction_date >= date('now', '-90 days')
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 1
    `).get(user.merchantId) as { hour: number; count: number } | undefined;

    const bestHour = hourRow?.hour ?? null;
    const peakTime = bestHour !== null ? peakTimeLabel(bestHour) : null;

    return NextResponse.json({ byDayOfWeek, bestDay, slowestDay, bestHour, peakTime });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch cashflow data' }, { status: 500 });
  }
}
