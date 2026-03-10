import { listRegistryWorkflows } from '../lib/registry';

export default async function HomePage(): Promise<React.ReactNode> {
  const workflows = await listRegistryWorkflows();

  return (
    <main
      style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '32px 24px 80px',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 48,
          color: 'var(--muted)',
          fontSize: 14,
        }}
      >
        <div>OpenCI</div>
        <nav style={{ display: 'flex', gap: 16 }}>
          <span>Workflows</span>
          <span>Docs</span>
        </nav>
      </header>

      <section style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 14, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          The Open Workflow Directory
        </p>
        <h1 style={{ fontSize: 56, lineHeight: 1, margin: '8px 0 16px' }}>OpenCI</h1>
        <p style={{ fontSize: 28, lineHeight: 1.3, maxWidth: 760, color: 'var(--muted)' }}>
          Discover and install AI-powered GitHub Actions workflows with a single command.
        </p>
      </section>

      <section
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 24,
        }}
      >
        <p style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em' }}>
          Local Registry Harness
        </p>
        <p style={{ margin: '8px 0 24px', color: 'var(--muted)' }}>
          Phase 1 reads workflow data directly from the local registry fixtures.
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
          {workflows.map((workflow) => (
            <li key={workflow.name}>
              <strong>{workflow.name}</strong> <span style={{ color: 'var(--muted)' }}>{workflow.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
