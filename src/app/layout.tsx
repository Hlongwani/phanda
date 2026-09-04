import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'PHANDA — Your hustle, proven.',
  description: 'Turn everyday trading activity into a trusted Digital Business Passport.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Phanda',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#F59E0B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Apply dark class before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('phanda_dark')==='1')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body>
        <ServiceWorkerRegistrar />
        <div className="phone-frame">
          {children}
        </div>
      </body>
    </html>
  );
}
