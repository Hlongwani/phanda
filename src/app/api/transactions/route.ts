import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken, generateId } from '@/lib/auth';
import { recalculatePassport } from '@/lib/passport';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

export async function POST(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { amount, type = 'sale', paymentMethod = 'cash', description, categoryTag } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const db = getDb();
    const id = generateId();

    db.prepare(`
      INSERT INTO transactions (id, business_id, merchant_id, type, payment_method, amount, description, category_tag, channel)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'app')
    `).run(id, user.businessId, user.merchantId, type, paymentMethod, amount, description || null, categoryTag || null);

    recalculatePassport(user.merchantId, user.businessId);

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // 'sale' | 'expense' | null (all)

    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE merchant_id = ? AND is_deleted = 0 ${type ? 'AND type = ?' : ''}
      ORDER BY transaction_date DESC
      LIMIT ? OFFSET ?
    `).all(...(type ? [user.merchantId, type, limit, offset] : [user.merchantId, limit, offset]));

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM transactions
      WHERE merchant_id = ? AND is_deleted = 0 ${type ? 'AND type = ?' : ''}
    `).get(...(type ? [user.merchantId, type] : [user.merchantId])) as { total: number };

    return NextResponse.json({ transactions, total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
