'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});

      // Listen for offline-queued transactions and show a banner
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'OFFLINE_QUEUED') {
          // Store in localStorage for retry when back online
          const queue: unknown[] = JSON.parse(localStorage.getItem('phanda_offline_queue') || '[]');
          queue.push(e.data.payload);
          localStorage.setItem('phanda_offline_queue', JSON.stringify(queue));
        }
      });
    }
  }, []);

  return null;
}
