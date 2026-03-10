import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenCI',
  description: 'Discover and install AI-powered GitHub Actions workflows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
