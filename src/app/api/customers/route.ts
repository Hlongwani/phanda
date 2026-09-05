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

  try {
    const db = getDb();

    const customers = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.phone,
        c.notes,
        c.created_at,
        COALESCE(SUM(CASE WHEN t.type = 'sale' AND t.is_deleted = 0 THEN t.amount ELSE 0 END), 0) AS total_spend,
        COALESCE(SUM(CASE WHEN t.type = 'sale' AND t.is_deleted = 0 THEN 1 ELSE 0 END), 0) AS visit_count,
        MAX(CASE WHEN t.is_deleted = 0 THEN t.transaction_date ELSE NULL END) AS last_visit
      FROM customers c
      LEFT JOIN transactions t ON t.merchant_id = c.merchant_id AND t.customer_name = c.name
      WHERE c.merchant_id = ?
      GROUP BY c.id
      ORDER BY last_visit DESC NULLS LAST, c.created_at DESC
    `).all(user.merchantId);

    return NextResponse.json({ customers });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, phone, notes } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const db = getDb();
    const id = generateId();

    db.prepare(`
      INSERT INTO customers (id, merchant_id, name, phone, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, user.merchantId, name.trim(), phone?.trim() || null, notes?.trim() || null);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
