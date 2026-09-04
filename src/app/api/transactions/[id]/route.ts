import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { recalculatePassport } from '@/lib/passport';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const db = getDb();
    const txn = db.prepare('SELECT * FROM transactions WHERE id = ? AND merchant_id = ? AND is_deleted = 0').get(id, user.merchantId);
    if (!txn) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    db.prepare('UPDATE transactions SET is_deleted = 1 WHERE id = ?').run(id);
    recalculatePassport(user.merchantId, user.businessId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
