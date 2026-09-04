'use client';
import { useEffect, useState } from 'react';

const REMINDER_KEY = 'phanda_reminder_set';

export default function ReminderSetup() {
  const [show, setShow] = useState(false);
  const [hour, setHour] = useState('18');

  useEffect(() => {
    // Show if not already configured and notifications supported
    if (!localStorage.getItem(REMINDER_KEY) && 'Notification' in window) {
      // Slight delay so it doesn't appear immediately on load
      const t = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  async function enable() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(REMINDER_KEY, hour);
        scheduleReminder(parseInt(hour));
        setShow(false);
      } else {
        setShow(false);
      }
    } catch {
      setShow(false);
    }
  }

  function scheduleReminder(h: number) {
    // Use a periodic check via SW postMessage (simplified: just show now as demo)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_REMINDER', hour: h });
    }
  }

  function dismiss() {
    localStorage.setItem(REMINDER_KEY, 'dismissed');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 z-50 border border-amber-100">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔔</div>
        <div className="flex-1">
          <p className="text-gray-900 font-bold text-sm">Never forget to record</p>
          <p className="text-gray-500 text-xs mt-0.5 mb-3">Get a daily reminder at:</p>
          <div className="flex items-center gap-2 mb-3">
            <select value={hour} onChange={e => setHour(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500">
              {['08','09','10','12','14','16','17','18','19','20','21'].map(h => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
            <button onClick={enable} className="bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-sm">Enable</button>
            <button onClick={dismiss} className="text-gray-400 text-sm px-2">Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}
