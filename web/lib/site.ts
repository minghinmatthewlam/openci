import type { RegistryEntry } from './registry';

export const featuredAgents = [
  'Claude',
  'Codex',
  'Cursor',
  'GitHub Copilot',
  'OpenCode',
  'Windsurf',
];

export const docsSections = [
  { label: 'Overview', href: '/docs' },
  { label: 'CLI', href: '/docs#cli' },
  { label: 'FAQ', href: '/docs#faq' },
];

export function formatInstallCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return String(value);
}

export function buildWorkflowHref(workflow: RegistryEntry): string {
  return `/${workflow.author ?? 'openci'}/${workflow.name}`;
}

export function buildInstallCommand(workflowName: string, provider = 'claude'): string {
  return `$ npx openci add ${workflowName} --provider ${provider}`;
}
