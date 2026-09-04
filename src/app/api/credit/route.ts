import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken, generateId } from '@/lib/auth';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

export async function GET(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const direction = searchParams.get('direction'); // 'owe' | 'owed' | null
  const status = searchParams.get('status') || 'open';

  const accounts = db.prepare(`
    SELECT c.*,
      (SELECT COALESCE(SUM(amount),0) FROM credit_payments WHERE credit_id = c.id) as amount_settled
    FROM credit_accounts c
    WHERE c.merchant_id = ? AND c.status = ? ${direction ? 'AND c.direction = ?' : ''}
    ORDER BY c.created_at DESC
  `).all(...(direction ? [user.merchantId, status, direction] : [user.merchantId, status]));

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { direction, partyName, partyPhone, description, totalAmount, dueDate } = await req.json();
    if (!direction || !partyName || !description || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    const id = generateId();
    db.prepare(`
      INSERT INTO credit_accounts (id, merchant_id, direction, party_name, party_phone, description, total_amount, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.merchantId, direction, partyName, partyPhone || null, description, totalAmount, dueDate || null);

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create credit account' }, { status: 500 });
  }
}
