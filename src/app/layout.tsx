import type { Metadata, Viewport } from 'next';
import './globals.css';
import { site } from '@/lib/config';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  keywords: site.keywords,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
