import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateOTP, generateId } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const db = getDb();
    const merchant = db.prepare('SELECT id FROM merchants WHERE phone_number = ?').get(phoneNumber) as { id: string } | undefined;
    const isNewUser = !merchant;

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare("UPDATE otps SET used = 1 WHERE phone_number = ? AND used = 0").run(phoneNumber);
    db.prepare("INSERT INTO otps (id, phone_number, code, expires_at) VALUES (?, ?, ?, ?)").run(generateId(), phoneNumber, otp, expiresAt);

    const { sent, demo } = await sendSMS(phoneNumber, `Your Phanda OTP is: ${otp}. Valid for 10 minutes. Do not share.`);

    return NextResponse.json({
      message: 'OTP sent',
      isNewUser,
      ...(demo ? { hint: `Demo mode — OTP: ${otp}` } : {}),
      ...(sent ? {} : (!demo ? { hint: `SMS unavailable — OTP: ${otp}` } : {})),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
