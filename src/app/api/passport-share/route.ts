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

  const db = getDb();
  // Reuse existing share token if one exists
  const existing = db.prepare('SELECT token FROM passport_shares WHERE merchant_id = ?').get(user.merchantId) as { token: string } | undefined;
  if (existing) return NextResponse.json({ token: existing.token });

  const token = generateId() + generateId();
  db.prepare('INSERT INTO passport_shares (token, merchant_id) VALUES (?, ?)').run(token, user.merchantId);
  return NextResponse.json({ token });
}
