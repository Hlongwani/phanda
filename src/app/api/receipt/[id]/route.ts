import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const row = db.prepare(`
      SELECT
        t.id,
        t.amount,
        t.type,
        t.payment_method,
        t.description,
        t.category_tag,
        t.transaction_date,
        t.is_deleted,
        b.trading_name
      FROM transactions t
      JOIN businesses b ON b.id = t.business_id
      WHERE t.id = ?
    `).get(id) as {
      id: string;
      amount: number;
      type: string;
      payment_method: string;
      description: string | null;
      category_tag: string | null;
      transaction_date: string;
      is_deleted: number;
      trading_name: string;
    } | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (row.is_deleted === 1) {
      return NextResponse.json({ error: 'Transaction has been deleted' }, { status: 400 });
    }

    return NextResponse.json({
      id: row.id,
      amount: row.amount,
      type: row.type,
      payment_method: row.payment_method,
      description: row.description,
      category_tag: row.category_tag,
      transaction_date: row.transaction_date,
      business: {
        trading_name: row.trading_name,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}
