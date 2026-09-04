import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken, generateId } from '@/lib/auth';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { amount, note } = await req.json();

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  try {
    const db = getDb();
    const layby = db.prepare('SELECT * FROM laybys WHERE id = ? AND merchant_id = ?').get(id, user.merchantId) as {
      id: string; total_price: number;
    } | undefined;
    if (!layby) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const paymentId = generateId();
    db.prepare('INSERT INTO layby_payments (id, layby_id, amount, note) VALUES (?, ?, ?, ?)').run(paymentId, id, amount, note || null);

    // Check if fully paid
    const { paid } = db.prepare('SELECT COALESCE(SUM(amount),0) as paid FROM layby_payments WHERE layby_id = ?').get(id) as { paid: number };
    if (paid >= layby.total_price) {
      db.prepare("UPDATE laybys SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(id);
    }

    return NextResponse.json({ ok: true, paid, completed: paid >= layby.total_price });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
