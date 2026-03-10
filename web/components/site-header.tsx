import Link from 'next/link';
import type { Route } from 'next';

export function SiteHeader(): React.ReactNode {
  return (
    <header className="site-header">
      <div className="brand-row">
        <div className="brand-mark" />
        <span className="brand-slash">/</span>
        <Link href="/" className="brand-link">
          OpenCI
        </Link>
      </div>

      <nav className="top-nav">
        <Link href={'/audits' as Route}>Audits</Link>
        <Link href={'/docs' as Route}>Docs</Link>
      </nav>
    </header>
  );
}
