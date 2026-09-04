'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/welcome');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-amber-500">
      <div className="text-white text-2xl font-bold">PHANDA</div>
    </div>
  );
}
