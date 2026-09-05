import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const db = getDb();

    const customer = db.prepare(
      'SELECT * FROM customers WHERE id = ? AND merchant_id = ?'
    ).get(id, user.merchantId);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const { name } = customer as { name: string };

    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE merchant_id = ? AND customer_name = ? AND is_deleted = 0
      ORDER BY transaction_date DESC
      LIMIT 10
    `).all(user.merchantId, name);

    return NextResponse.json({ customer, transactions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}
