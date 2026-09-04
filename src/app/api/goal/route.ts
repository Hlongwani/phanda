import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

// Store monthly goal as a simple key-value in businesses table description is not ideal;
// use a dedicated column added via ALTER TABLE (idempotent)
function ensureGoalColumn(db: ReturnType<typeof getDb>) {
  try {
    db.exec('ALTER TABLE businesses ADD COLUMN monthly_goal REAL DEFAULT 0');
  } catch {
    // column already exists
  }
}

export async function GET(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  ensureGoalColumn(db);

  const biz = db.prepare('SELECT monthly_goal FROM businesses WHERE merchant_id = ?').get(user.merchantId) as { monthly_goal: number };

  // Calculate this month's revenue so far
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { revenue } = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as revenue FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0
    AND transaction_date >= ?
  `).get(user.merchantId, monthStart) as { revenue: number };

  // Forecast: days elapsed vs days in month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const forecast = dayOfMonth > 0 ? Math.round((revenue / dayOfMonth) * daysInMonth) : 0;

  return NextResponse.json({ goal: biz?.monthly_goal || 0, currentRevenue: revenue, forecast, daysInMonth, dayOfMonth });
}

export async function POST(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  ensureGoalColumn(db);

  const { goal } = await req.json();
  if (!goal || goal < 0) return NextResponse.json({ error: 'Invalid goal' }, { status: 400 });

  db.prepare('UPDATE businesses SET monthly_goal = ? WHERE merchant_id = ?').run(goal, user.merchantId);
  return NextResponse.json({ ok: true });
}
