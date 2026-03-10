import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyCommand } from '../../../components/copy-command';
import { SiteHeader } from '../../../components/site-header';
import { getWorkflowChecks } from '../../../lib/checks';
import { readWorkflowBundleByAuthor } from '../../../lib/registry';
import { buildInstallCommand, formatInstallCount } from '../../../lib/site';
import { getWorkflowMetrics } from '../../../lib/telemetry';

export const dynamic = 'force-dynamic';

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ author: string; name: string }>;
}): Promise<React.ReactNode> {
  const { author, name } = await params;
  const [bundle, checks, metrics] = await Promise.all([
    readWorkflowBundleByAuthor(author, name),
    getWorkflowChecks(name),
    getWorkflowMetrics(name),
  ]);

  if (!bundle) {
    notFound();
  }

  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <div className="detail-layout">
        <section className="detail-main">
          <div className="breadcrumbs">
            <Link href="/">workflows</Link>
            <span>/</span>
            <Link href={`/${bundle.metadata.author}`}>{bundle.metadata.author}</Link>
            <span>/</span>
            <span>{bundle.metadata.name}</span>
          </div>

          <h1 className="detail-title">{bundle.metadata.name}</h1>
          <CopyCommand value={buildInstallCommand(bundle.metadata.name, bundle.metadata.provider[0] ?? 'claude')} />

          <div className="content-card">
            <div className="content-label">{bundle.metadata.smart ? 'SMART WORKFLOW' : 'BASIC WORKFLOW'}</div>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h2>{children}</h2>,
              }}
            >
              {stripLeadingTitle(bundle.readme)}
            </ReactMarkdown>
          </div>
        </section>

        <aside className="detail-sidebar">
          <div className="sidebar-block">
            <p className="sidebar-label">Weekly installs</p>
            <p className="sidebar-stat">{formatInstallCount(metrics.weeklyInstalls)}</p>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">Providers</p>
            <p>{bundle.metadata.provider.join(', ')}</p>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">Repository</p>
            <p>{bundle.metadata.repository ?? `${bundle.metadata.author}/workflows`}</p>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">Triggers</p>
            <p>{bundle.metadata.triggers.join(', ')}</p>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">Required secrets</p>
            <ul>
              {Object.entries(bundle.metadata.requiredSecrets).map(([provider, secrets]) => (
                <li key={provider}>
                  <strong>{provider}</strong>: {secrets.join(', ')}
                </li>
              ))}
            </ul>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">First seen</p>
            <p>{bundle.metadata.publishedAt ?? '2026-03-09'}</p>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">Installed on</p>
            <ul>
              {Object.entries(metrics.providerBreakdown).length > 0 ? (
                Object.entries(metrics.providerBreakdown).map(([provider, count]) => (
                  <li key={provider}>
                    <strong>{provider}</strong>: {formatInstallCount(count)}
                  </li>
                ))
              ) : (
                <li>No telemetry yet</li>
              )}
            </ul>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">Registry checks</p>
            <div className="check-strip vertical">
              {checks.map((check) => (
                <span key={check.label} className={`check-badge ${check.status}`}>
                  {check.label}: {check.status.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </aside>
        </div>
      </main>
    </>
  );
}

function stripLeadingTitle(markdown: string): string {
  return markdown.replace(/^# .+\n+/, '');
}
