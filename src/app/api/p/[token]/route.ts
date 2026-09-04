import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();

  const share = db.prepare('SELECT merchant_id FROM passport_shares WHERE token = ?').get(token) as { merchant_id: string } | undefined;
  if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const merchantId = share.merchant_id;
  const merchant = db.prepare('SELECT first_name, last_name FROM merchants WHERE id = ?').get(merchantId) as { first_name: string; last_name: string };
  const business = db.prepare('SELECT trading_name, category, city, province FROM businesses WHERE merchant_id = ?').get(merchantId) as { trading_name: string; category: string; city: string; province: string };
  const passport = db.prepare('SELECT passport_number, health_score, verification_level, total_revenue_30d, operating_days, pct_cash, pct_digital, consistency_score, volume_score, longevity_score, created_at FROM passports WHERE merchant_id = ?').get(merchantId) as Record<string, unknown>;

  return NextResponse.json({ merchant, business, passport });
}
