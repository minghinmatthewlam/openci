'use client';

import { useState } from 'react';

export function CopyCommand({ value }: { value: string }): React.ReactNode {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button className="command-box" type="button" onClick={handleCopy} aria-label={copied ? 'Copied' : 'Copy to clipboard'}>
      <span className="command-value">{value}</span>
      <span className="command-icon">{copied ? 'COPIED' : '⧉'}</span>
    </button>
  );
}
