import Link from 'next/link';
import type { Route } from 'next';
import { SiteHeader } from '../../components/site-header';
import { getAuditSummaries } from '../../lib/checks';

export default async function AuditsPage(): Promise<React.ReactNode> {
  const audits = await getAuditSummaries();

  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <section className="audits-page">
          <div className="audits-header">
            <h1>Audits</h1>
            <p>
              Registry validation results for published workflows. These checks are factual validations only and do not
              claim that a workflow is safe or endorsed for production.
            </p>
          </div>

          <div className="audits-table">
            <div className="audits-table-head">
              <span>#</span>
              <span>Workflow</span>
              <span>Metadata</span>
              <span>Content</span>
            </div>

            {audits.map((audit, index) => {
              const metaCheck = audit.checks.find((c) => c.label === 'metadata' || c.label === 'registry entry');
              const contentCheck = audit.checks.find((c) => c.label === 'readme' || c.label === 'content');

              return (
                <Link key={audit.workflow} href={audit.href as Route} className="audits-row">
                  <span className="row-rank">{index + 1}</span>
                  <span>
                    <strong>{audit.workflow}</strong>
                    <span className="row-meta">{audit.author}</span>
                  </span>
                  <span>
                    <span className={`check-badge ${metaCheck?.status ?? 'warn'}`}>
                      {(metaCheck?.status ?? 'warn') === 'pass' ? 'Pass' : 'Warn'}
                    </span>
                  </span>
                  <span>
                    <span className={`check-badge ${contentCheck?.status ?? 'warn'}`}>
                      {(contentCheck?.status ?? 'warn') === 'pass' ? 'Pass' : 'Warn'}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
