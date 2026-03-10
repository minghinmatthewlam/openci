import Link from 'next/link';
import type { Route } from 'next';
import { SiteHeader } from '../../components/site-header';
import { getAuditSummaries } from '../../lib/checks';

export default async function AuditsPage(): Promise<React.ReactNode> {
  const audits = await getAuditSummaries();

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="audits-page">
        <div className="audits-header">
          <h1>Audits</h1>
          <p>
            These checks are factual registry validations only. They do not claim that a workflow is safe, secure, or
            endorsed for production.
          </p>
        </div>

        <div className="audits-table">
          <div className="audits-table-head">
            <span>Workflow</span>
            <span>Checks</span>
          </div>

          {audits.map((audit) => (
            <Link key={audit.workflow} href={audit.href as Route} className="audits-row">
              <span>
                <strong>{audit.workflow}</strong>
                <span className="row-meta">{audit.author}</span>
              </span>
              <span className="check-strip">
                {audit.checks.map((check) => (
                  <span key={check.label} className={`check-badge ${check.status}`}>
                    {check.label}: {check.status.toUpperCase()}
                  </span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
