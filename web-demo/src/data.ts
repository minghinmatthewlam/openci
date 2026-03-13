export type Workflow = {
  id: string;
  name: string;
  description: string;
  author: string;
  avatar: string;
  downloads: string;
  tags: string[];
  command: string;
  yaml: string;
  readme: string;
};

export const workflows: Workflow[] = [
  {
    id: "claude-reviewer",
    name: "Claude Code Reviewer",
    description:
      "Automated PR reviews using Anthropic's Claude 3.5 Sonnet. Catches bugs, suggests improvements, and enforces style guidelines.",
    author: "openci-core",
    avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=claude",
    downloads: "12.4k",
    tags: ["review", "claude", "quality"],
    command: "npx openci add claude-reviewer",
    yaml: `name: Claude Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Claude Reviewer
        uses: openci/claude-reviewer@v1
        with:
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          github_token: \${{ secrets.GITHUB_TOKEN }}
          model: "claude-3-5-sonnet-20240620"`,
    readme: `# Claude Code Reviewer

This action automatically reviews pull requests using Claude 3.5 Sonnet.

## Features
- Inline code comments for suggested changes
- Summary of PR impact
- Security vulnerability detection
- Performance optimization suggestions

## Setup
1. Add \`ANTHROPIC_API_KEY\` to your repository secrets.
2. Ensure the action has \`pull-requests: write\` permissions.
`,
  },
  {
    id: "codex-auto-fix",
    name: "Codex Auto-Fixer",
    description:
      "Automatically attempts to fix failing tests and linting errors using OpenAI's Codex model, pushing commits directly to the PR.",
    author: "dev-agents",
    avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=codex",
    downloads: "8.2k",
    tags: ["auto-fix", "openai", "testing"],
    command: "npx openci add codex-auto-fix",
    yaml: `name: Auto Fix
on:
  check_run:
    types: [completed]

jobs:
  fix:
    if: \${{ github.event.check_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Codex Auto-Fixer
        uses: dev-agents/codex-auto-fix@v2
        with:
          openai_api_key: \${{ secrets.OPENAI_API_KEY }}
          github_token: \${{ secrets.GITHUB_TOKEN }}`,
    readme: `# Codex Auto-Fixer

When a CI check fails (tests or linting), this agent reads the error logs, analyzes the code, and attempts to push a fix.

## Features
- Reads Jest, Mocha, PyTest, and ESLint outputs
- Commits fixes directly to the branch
- Leaves a comment explaining the fix
`,
  },
  {
    id: "release-notes-gen",
    name: "AI Release Notes",
    description:
      "Generates beautiful, human-readable release notes from merged PRs and commit messages using Gemini 1.5 Pro.",
    author: "google-cloud",
    avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=gemini",
    downloads: "24.1k",
    tags: ["release", "gemini", "documentation"],
    command: "npx openci add release-notes-gen",
    yaml: `name: Generate Release Notes
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: AI Release Notes
        uses: openci/release-notes-gen@v1
        with:
          gemini_api_key: \${{ secrets.GEMINI_API_KEY }}
          github_token: \${{ secrets.GITHUB_TOKEN }}`,
    readme: `# AI Release Notes

Stop writing release notes manually. This action uses Gemini to summarize all changes since the last tag.

## Features
- Categorizes changes (Features, Fixes, Chores)
- Highlights breaking changes
- Mentions contributors
`,
  },
  {
    id: "security-scanner",
    name: "Agentic Security Scanner",
    description:
      "Deep code analysis agent that looks for logical vulnerabilities, hardcoded secrets, and injection flaws.",
    author: "sec-ops",
    avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=shield",
    downloads: "5.5k",
    tags: ["security", "agent", "sast"],
    command: "npx openci add security-scanner",
    yaml: `name: Security Scan
on:
  schedule:
    - cron: '0 0 * * *'
  pull_request:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Agentic Security Scanner
        uses: sec-ops/security-scanner@v1
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          fail_on_high: true`,
    readme: `# Agentic Security Scanner

Uses an ensemble of LLMs to perform deep static analysis on your codebase.

## Features
- Detects complex logical flaws traditional SAST misses
- Zero false positive guarantee (verified by agent consensus)
- Generates SARIF reports
`,
  },
  {
    id: "issue-triage",
    name: "Smart Issue Triage",
    description:
      "Automatically labels, assigns, and responds to new GitHub issues based on repository context and past issues.",
    author: "openci-core",
    avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=triage",
    downloads: "18.9k",
    tags: ["issues", "triage", "management"],
    command: "npx openci add issue-triage",
    yaml: `name: Issue Triage
on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Smart Issue Triage
        uses: openci/issue-triage@v2
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          auto_assign: true`,
    readme: `# Smart Issue Triage

Keep your issue tracker clean. This agent reads new issues, applies labels, and asks for missing information (like reproduction steps).
`,
  },
  {
    id: "doc-sync",
    name: "DocSync Agent",
    description:
      "Detects when code changes invalidate existing documentation and automatically opens a PR to update the docs.",
    author: "docs-team",
    avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=docs",
    downloads: "3.2k",
    tags: ["documentation", "sync", "agent"],
    command: "npx openci add doc-sync",
    yaml: `name: DocSync
on:
  push:
    branches: [main]
    paths:
      - 'src/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: DocSync Agent
        uses: docs-team/doc-sync@v1
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          docs_dir: './docs'`,
    readme: `# DocSync Agent

Never let your documentation go stale. When code changes, this agent reads the diff and updates corresponding markdown files.
`,
  },
];
