import Link from 'next/link';

export function SiteHeader(): React.ReactNode {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand-row">
          <div className="brand-mark" />
          <span className="brand-slash">/</span>
          <Link href="/" className="brand-link">
            OpenCI
          </Link>
        </div>

        <nav className="top-nav">
          <Link href="/docs">Docs</Link>
        </nav>
      </div>
    </header>
  );
}
