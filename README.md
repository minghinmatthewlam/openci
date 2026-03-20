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
[![Node.js](https://img.shields.io/badge/node-%3E%3D24-green.svg)](https://nodejs.org/)

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

Search the hosted workflow catalog:

```bash
npx openci-app search triage
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

# Inspect or configure required repo secrets after install
openci add anthropics/claude-code --workflow claude-issue-triage --setup
openci add anthropics/claude-code --workflow claude-issue-triage --setup --copy-env ANTHROPIC_API_KEY

# Preview without writing
openci add anthropics/claude-code --workflow claude --dry-run
```

Sources: `owner/repo`, `github:owner/repo`, `git@github.com:owner/repo.git`, `https://...`, `./local-path`

| Flag                    | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `--workflow <name>`     | Workflow to install (omit to list available)           |
| `--force`               | Overwrite existing workflow file                       |
| `--yes`                 | Non-interactive mode                                   |
| `--dry-run`             | Show what would be installed without writing           |
| `--setup`               | Inspect required repository secrets after install      |
| `--copy-env <NAME>`     | Copy a same-named local env var into a repo secret     |
| `--secret <NAME=value>` | Set a repository secret from an explicit value         |
| `--all-from-env`        | Copy any same-named local env vars for missing secrets |
| `--json`                | Emit structured JSON to stdout                         |
| `--verbose`             | Show additional details                                |

### `search`

Search the OpenCI workflow catalog:

```bash
openci search triage
openci search review --json
```

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

Re-fetch workflows from their source. Detects local modifications and skips overwriting them unless you pass `--force`:

```bash
openci update
openci update claude-issue-triage
openci update --force   # overwrite even if locally modified
```

### `remove`

Remove a workflow and its tracking metadata. Reports secrets that may no longer be needed and secrets still used by other managed workflows:

```bash
openci remove claude-issue-triage
```

### `doctor`

Check installed workflow health — file existence, secrets, and timeouts — and summarize results as healthy, warning, or error:

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

In `--yes` mode, the CLI never prompts. Successful `add` prints the created path to stdout. Warnings go to stderr unless you also pass `--verbose`, which prints install analysis to stdout.

```bash
npx openci-app add anthropics/claude-code --workflow claude-issue-triage --yes
```

For agent-safe structured output:

```bash
npx openci-app add anthropics/claude-code --workflow claude-issue-triage --setup --json
npx openci-app search triage --json
```

When setup cannot fully configure required secrets, `add --setup` still installs the workflow but exits with code `2`. In JSON mode this is reported as `installed_setup_incomplete` or `installed_setup_unavailable`.

## Local Management

OpenCI tracks installed workflows in sidecar files:

```text
.github/workflows/.openci/<workflow>.json
```

This records source, commit SHA, content hash, required secrets, and install time so `list`, `status`, `update`, and `remove` work reliably.

## Private Repos

Public repos work with shorthand like `owner/repo`. For private repos, prefer an explicit git URL such as SSH if that is how your local git is authenticated.

```bash
openci add git@github.com:your-org/private-workflows.git --workflow pr-review
openci add https://github.com/your-org/private-workflows.git --workflow pr-review
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

Requirements: Node.js `>=24`, npm.

```bash
npm install
npm test
npm run build
node dist/index.js --help
```

Search and telemetry endpoints are configured with `OPENCI_SEARCH_URL` and `OPENCI_TELEMETRY_URL`. The hosted product backend and web app now live in the private `openci-platform` repo; this OSS repo ships the CLI only.

## License

[Apache 2.0](LICENSE)
