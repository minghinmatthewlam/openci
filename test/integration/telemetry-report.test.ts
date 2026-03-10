import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { detectionFixture, makeTempRepo, registryEnv, runCli } from './helpers.js';

describe('integration: telemetry reporting', () => {
  it('reports anonymous install events when analytics are enabled', async () => {
    const received: string[] = [];
    const server = createServer((request, response) => {
      if (request.method !== 'POST' || request.url !== '/api/installs') {
        response.statusCode = 404;
        response.end();
        return;
      }

      const chunks: Buffer[] = [];
      request.on('data', (chunk) => chunks.push(chunk));
      request.on('end', () => {
        received.push(Buffer.concat(chunks).toString('utf8'));
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ ok: true }));
      });
    });

    await new Promise<void>((resolve) => server.listen(3299, '127.0.0.1', () => resolve()));

    try {
      const repo = makeTempRepo({ fixturePath: detectionFixture('pnpm-next') });
      const result = runCli(['add', 'ai-pr-review', '--yes'], {
        cwd: repo,
        env: {
          ...registryEnv(),
          OPENCI_ANALYTICS_URL: 'http://127.0.0.1:3299/api/installs',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.status).toBe(0);
      expect(received).toHaveLength(1);
      expect(received[0]).toContain('"workflow":"ai-pr-review"');
      expect(received[0]).toContain('"provider":"claude"');
    } finally {
      server.close();
    }
  });

  it('skips reporting when DO_NOT_TRACK is enabled', async () => {
    const received: string[] = [];
    const server = createServer((request, response) => {
      request.on('data', () => undefined);
      request.on('end', () => {
        received.push('called');
        response.end(JSON.stringify({ ok: true }));
      });
    });

    await new Promise<void>((resolve) => server.listen(3300, '127.0.0.1', () => resolve()));

    try {
      const repo = makeTempRepo({ fixturePath: detectionFixture('pnpm-next') });
      const result = runCli(['add', 'ai-pr-review', '--yes'], {
        cwd: repo,
        env: {
          ...registryEnv(),
          OPENCI_ANALYTICS_URL: 'http://127.0.0.1:3300/api/installs',
          DO_NOT_TRACK: '1',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.status).toBe(0);
      expect(received).toHaveLength(0);
    } finally {
      server.close();
    }
  });
});
