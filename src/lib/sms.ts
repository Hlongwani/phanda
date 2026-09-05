const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;

export async function sendSMS(to: string, message: string): Promise<{ sent: boolean; demo: boolean }> {
  // If env vars not set or using sandbox, return demo mode — caller shows OTP on screen
  if (!AT_API_KEY || !AT_USERNAME || AT_USERNAME === 'sandbox') {
    return { sent: false, demo: true };
  }

  try {
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to,
        message,
      }).toString(),
    });

    if (!res.ok) {
      console.error('Africa\'s Talking SMS error:', await res.text());
      return { sent: false, demo: false };
    }

    return { sent: true, demo: false };
  } catch (err) {
    console.error('SMS send failed:', err);
    return { sent: false, demo: false };
  }
}
