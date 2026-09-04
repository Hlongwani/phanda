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
  const status = searchParams.get('status') || 'active';

  const laybys = db.prepare(`
    SELECT l.*,
      (SELECT COALESCE(SUM(amount),0) FROM layby_payments WHERE layby_id = l.id) as amount_paid
    FROM laybys l
    WHERE l.merchant_id = ? AND l.status = ?
    ORDER BY l.created_at DESC
  `).all(user.merchantId, status);

  return NextResponse.json({ laybys });
}

export async function POST(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { customerName, customerPhone, itemDescription, totalPrice } = await req.json();
    if (!customerName || !itemDescription || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    const id = generateId();
    db.prepare(`
      INSERT INTO laybys (id, merchant_id, customer_name, customer_phone, item_description, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, user.merchantId, customerName, customerPhone || null, itemDescription, totalPrice);

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create layby' }, { status: 500 });
  }
}
