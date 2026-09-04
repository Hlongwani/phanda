'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const mainTabs = [
  { href: '/dashboard', icon: HomeIcon, label: 'Home' },
  { href: '/history', icon: ListIcon, label: 'History' },
  { href: '/record', icon: PlusIcon, label: 'Record', primary: true },
  { href: '/passport', icon: CardIcon, label: 'Passport' },
];

const moreItems = [
  { href: '/insights', icon: ChartIcon, label: 'Insights', color: 'bg-purple-100 text-purple-600' },
  { href: '/laybys', icon: LaybyIcon, label: 'Laybys', color: 'bg-blue-100 text-blue-600' },
  { href: '/credit', icon: CreditIcon, label: 'Credit Book', color: 'bg-green-100 text-green-600' },
  { href: '/settings', icon: SettingsIcon, label: 'Settings', color: 'bg-gray-100 text-gray-600' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  // Close drawer on route change
  useEffect(() => { setShowMore(false); }, [pathname]);

  const moreActive = moreItems.some(item => pathname === item.href);

  return (
    <>
      {/* More drawer backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More drawer */}
      <div className={`fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50 transition-all duration-300 ${showMore ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="mx-3 mb-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">More</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {moreItems.map(({ href, icon: Icon, label, color }) => (
              <button
                key={href}
                onClick={() => { router.push(href); setShowMore(false); }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95 ${
                  pathname === href ? 'ring-2 ring-amber-400' : ''
                } bg-gray-50 dark:bg-gray-800`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-50">
        <div className="flex items-center justify-around px-2 pb-safe">
          {mainTabs.map(({ href, icon: Icon, label, primary }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                  primary
                    ? 'relative -top-4 bg-amber-500 text-white shadow-lg shadow-amber-200 rounded-2xl px-4 py-3'
                    : active
                    ? 'text-amber-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon size={primary ? 22 : 20} />
                <span className={`text-[10px] font-medium ${primary ? 'text-white' : ''}`}>{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
              showMore || moreActive ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <MoreIcon size={20} active={showMore} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function HomeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function PlusIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CardIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
    </svg>
  );
}

function ChartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function ListIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function LaybyIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function CreditIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SettingsIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function MoreIcon({ size, active }: { size: number; active: boolean }) {
  return active ? (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
