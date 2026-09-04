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
    const account = db.prepare('SELECT * FROM credit_accounts WHERE id = ? AND merchant_id = ?').get(id, user.merchantId) as { total_amount: number } | undefined;
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const payId = generateId();
    db.prepare('INSERT INTO credit_payments (id, credit_id, amount, note) VALUES (?, ?, ?, ?)').run(payId, id, amount, note || null);

    const { settled } = db.prepare('SELECT COALESCE(SUM(amount),0) as settled FROM credit_payments WHERE credit_id = ?').get(id) as { settled: number };
    if (settled >= account.total_amount) {
      db.prepare("UPDATE credit_accounts SET status = 'settled', updated_at = datetime('now') WHERE id = ?").run(id);
    }

    return NextResponse.json({ ok: true, settled, completed: settled >= account.total_amount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
