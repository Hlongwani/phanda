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

  const db = getDb();
  const merchant = db.prepare('SELECT id, first_name, last_name, phone_number, created_at FROM merchants WHERE id = ?').get(user.merchantId) as Record<string, unknown>;
  const business = db.prepare('SELECT * FROM businesses WHERE merchant_id = ?').get(user.merchantId) as Record<string, unknown>;

  return NextResponse.json({ merchant, business });
}

export async function PATCH(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { firstName, lastName, tradingName, city, province, category, description } = await req.json();
    const db = getDb();

    if (firstName || lastName) {
      db.prepare(`
        UPDATE merchants SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(firstName || null, lastName || null, user.merchantId);
    }

    db.prepare(`
      UPDATE businesses SET
        trading_name = COALESCE(?, trading_name),
        city = COALESCE(?, city),
        province = COALESCE(?, province),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        updated_at = datetime('now')
      WHERE merchant_id = ?
    `).run(tradingName || null, city || null, province || null, category || null, description || null, user.merchantId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
