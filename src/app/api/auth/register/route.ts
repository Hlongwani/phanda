import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateId, generatePassportNumber, hashPin, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, firstName, lastName, pin, businessName, category, city, province } = await req.json();

    if (!phoneNumber || !firstName || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT id FROM merchants WHERE phone_number = ?').get(phoneNumber);
    if (existing) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    const merchantId = generateId();
    const businessId = generateId();
    const passportId = generateId();
    const passportNumber = generatePassportNumber();
    const pinHash = pin ? await hashPin(pin) : null;

    db.prepare(`
      INSERT INTO merchants (id, phone_number, first_name, last_name, pin_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run(merchantId, phoneNumber, firstName, lastName || '', pinHash);

    db.prepare(`
      INSERT INTO businesses (id, merchant_id, trading_name, category, city, province)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(businessId, merchantId, businessName, category || 'general_retail', city || '', province || '');

    db.prepare(`
      INSERT INTO passports (id, merchant_id, business_id, passport_number)
      VALUES (?, ?, ?, ?)
    `).run(passportId, merchantId, businessId, passportNumber);

    const token = signToken({ merchantId, businessId, phoneNumber });

    return NextResponse.json({
      token,
      merchant: { id: merchantId, firstName, lastName, phoneNumber },
      business: { id: businessId, tradingName: businessName, category },
      passport: { passportNumber }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
