<div align="center">

<pre>
 ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║
╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗██║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝
</pre>

**Install GitHub Actions workflows from any repo.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)

[Quick Start](#quick-start) · [Commands](#commands) · [FAQ](#faq)

</div>

---

OpenCI is the package manager for GitHub Actions workflows. Install AI agent workflows from Anthropic, OpenAI, Google, and any public repo in one command.

```bash
npx openci-app add anthropics/claude-code --workflow claude-issue-triage
```

## Why OpenCI

AI agent workflows are the most useful CI automations today, but there's no way to install them from other repos. You have to find the YAML, copy it, figure out what secrets to set, and manually track updates.

OpenCI gives you:
- **One-command install** from any repo's `.github/workflows/` directory
- **Post-install intelligence** — secrets, provider, permissions, timeout warnings, conflict detection
- **Lifecycle management** — list, status, update, remove, doctor

## Quick Start

Install a workflow from any repo:

```bash
npx openci-app add anthropics/claude-code --workflow claude-issue-triage
```

See what's available in a repo:

```bash
npx openci-app add anthropics/claude-code
```

Install from different providers:

```bash
npx openci-app add openai/codex --workflow issue-labeler
npx openci-app add google-github-actions/run-gemini-cli --workflow gemini-triage
```

Check what's installed and keep it healthy:

```bash
npx openci-app list
npx openci-app status
npx openci-app doctor
npx openci-app update
```

## Commands

### `add`

Install a workflow or list available workflows in a repo.

```bash
# List available workflows
openci add anthropics/claude-code

# Install a specific workflow
openci add anthropics/claude-code --workflow claude-issue-triage

# Overwrite existing
openci add anthropics/claude-code --workflow claude --force

# Preview without writing
openci add anthropics/claude-code --workflow claude --dry-run
```

Sources: `owner/repo`, `git@github.com:owner/repo.git`, `https://...`, `./local-path`

| Flag | Description |
|------|-------------|
| `--workflow <name>` | Workflow to install (omit to list available) |
| `--force` | Overwrite existing workflow file |
| `--yes` | Non-interactive mode |
| `--dry-run` | Show what would be installed without writing |
| `--verbose` | Show additional details |

### `list`

Show installed workflows:

```bash
openci list
```

### `status`

Show workflow health — installed, missing, untracked:

```bash
openci status
```

### `update`

Re-fetch workflows from their source. Detects local modifications and shows diffs:

```bash
openci update
openci update claude-issue-triage
openci update --force   # overwrite even if locally modified
```

### `remove`

Remove a workflow and its tracking metadata. Shows orphaned secrets:

```bash
openci remove claude-issue-triage
```

### `doctor`

Check health of installed workflows — file existence, secrets, timeouts:

```bash
openci doctor
```

## Post-Install Intelligence

After installing a workflow, OpenCI analyzes the YAML and shows:

```
Installed claude-issue-triage.yml

  Provider:     Claude (anthropics/claude-code-action@v1)
  Model:        claude-opus-4-6
  Triggers:     issues, issue_comment
  Permissions:  contents: read, issues: write

Required secret: ANTHROPIC_API_KEY
  Run: gh secret set ANTHROPIC_API_KEY
```

- **Secrets** — extracted from `${{ secrets.* }}` references
- **Provider/model** — detected from `uses:` action references
- **Permissions** — parsed from the `permissions:` block
- **Timeout warnings** — flags missing `timeout-minutes`
- **Conflict detection** — warns about trigger overlaps with existing workflows

## Non-Interactive / Agent Usage

In `--yes` mode, the CLI never prompts. Successful `add` prints only the created path to stdout; warnings go to stderr.

```bash
npx openci-app add anthropics/claude-code --workflow claude-issue-triage --yes
```

## Local Management

OpenCI tracks installed workflows in sidecar files:

```text
.github/workflows/.openci/<workflow>.json
```

This records source, commit SHA, content hash, and install time so `list`, `status`, `update`, and `remove` work reliably.

## Private Repos

Any repo your local `git clone` can access works — SSH keys, HTTPS credentials, etc.

```bash
openci add your-org/private-workflows --workflow pr-review
openci add git@github.com:your-org/private-workflows.git --workflow pr-review
```

## FAQ

**What repos can I install from?**
Any public or private repo that has a `.github/workflows/` directory. If `git clone` can access it, OpenCI can install from it.

**How does update detect local changes?**
OpenCI stores a SHA-256 hash of the workflow content at install time. On update, it compares the current file hash against the stored hash. If they differ, the file was locally modified and update will skip it unless you pass `--force`.

**What does doctor check?**
File existence, whether required secrets are set (via `gh secret list`), and whether `timeout-minutes` is configured.

**Where is metadata stored?**
In `.github/workflows/.openci/<workflow>.json`, alongside the installed workflow files.

## Development

Requirements: Node.js `>=20`, npm.

```bash
npm install
npm test
npm run build
node dist/index.js --help
```

Web app:

```bash
npm --prefix web ci
npm --prefix web run test
npm --prefix web run build
```

## License

[Apache 2.0](LICENSE)
