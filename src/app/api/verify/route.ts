import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken, generateId } from '@/lib/auth';

function getAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

export async function POST(req: NextRequest) {
  const user = getAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { passportNumber, note } = await req.json();
    if (!passportNumber) return NextResponse.json({ error: 'passportNumber is required' }, { status: 400 });

    const db = getDb();

    // Look up the merchant being verified by passport number (join passports with merchants)
    const target = db.prepare(`
      SELECT m.id as merchant_id FROM passports p
      JOIN merchants m ON m.id = p.merchant_id
      WHERE p.passport_number = ?
    `).get(passportNumber) as { merchant_id: string } | undefined;

    if (!target) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // Cannot verify yourself
    if (target.merchant_id === user.merchantId) {
      return NextResponse.json({ error: 'Cannot verify yourself' }, { status: 400 });
    }

    // Insert or ignore if already verified
    db.prepare(`
      INSERT OR IGNORE INTO verifications (id, verifier_merchant_id, verified_merchant_id, note, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(generateId(), user.merchantId, target.merchant_id, note ?? null, new Date().toISOString());

    // Return updated count for the verified business
    const { count } = db.prepare(`
      SELECT COUNT(*) as count FROM verifications WHERE verified_merchant_id = ?
    `).get(target.merchant_id) as { count: number };

    return NextResponse.json({ success: true, verificationCount: count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to record verification' }, { status: 500 });
  }
}
