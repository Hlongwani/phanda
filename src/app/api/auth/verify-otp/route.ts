import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otp } = await req.json();

    if (!otp || otp.length !== 5) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const db = getDb();

    // Validate stored OTP
    const storedOtp = db.prepare(`
      SELECT * FROM otps
      WHERE phone_number = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `).get(phoneNumber, otp) as { id: string } | undefined;

    if (!storedOtp) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Mark OTP as used
    db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(storedOtp.id);
    const merchant = db.prepare('SELECT * FROM merchants WHERE phone_number = ?').get(phoneNumber) as {
      id: string; first_name: string; last_name: string; phone_number: string;
    } | undefined;

    if (!merchant) {
      // New user — OTP verified but no account yet
      return NextResponse.json({ isNewUser: true });
    }

    const business = db.prepare('SELECT * FROM businesses WHERE merchant_id = ?').get(merchant.id) as {
      id: string; trading_name: string; category: string;
    } | undefined;

    if (!business) {
      return NextResponse.json({ isNewUser: true });
    }

    const token = signToken({
      merchantId: merchant.id,
      businessId: business.id,
      phoneNumber: merchant.phone_number
    });

    return NextResponse.json({
      token,
      merchant: {
        id: merchant.id,
        firstName: merchant.first_name,
        lastName: merchant.last_name,
        phoneNumber: merchant.phone_number
      },
      business: {
        id: business.id,
        tradingName: business.trading_name,
        category: business.category
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'OTP verification failed' }, { status: 500 });
  }
}
