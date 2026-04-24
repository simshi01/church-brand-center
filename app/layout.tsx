import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/lib/toastContext';
import ToastContainer from '@/components/Toast/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jem Church Brand Center',
  description: 'Шаблоны для миссий церкви «Посольство Иисуса»',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="preload"
          href="/fonts/TT_Hoves_Pro_Expanded_DemiBold.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/TT_Hoves_Pro_DemiBold.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/TT_Hoves_Pro_Medium.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
