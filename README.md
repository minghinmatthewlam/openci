<div align="center">

<pre>
 ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║
╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗██║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝
</pre>

**AI-powered GitHub Actions workflows. One CLI.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)

[Quick Start](#quick-start) · [Commands](#commands) · [Workflow Types](#workflow-types) · [Create Workflows](#creating-workflows) · [FAQ](#faq)

</div>

---

OpenCI is an open-source CLI for installing AI-powered GitHub Actions workflows from official, local, and git-based sources.

```bash
npx openci add minghinmatthewlam/openci --workflow pr-review
```

## Why OpenCI

GitHub Actions workflows for AI agents are useful, but annoying to wire up repeatedly.

OpenCI gives you:
- a consistent install flow for official, private, and local workflow sources
- smart workflow rendering for provider, runtime, runner, package manager, and branch
- local management metadata so installed workflows can be listed, inspected, and updated

## Quick Start

Install an official workflow:

```bash
npx openci add minghinmatthewlam/openci --workflow pr-review
```

From a private repo:

```bash
npx openci add your-org/private-workflows --workflow pr-review
```

From a local directory:

```bash
npx openci add ./workflows --workflow pr-review
```

Check what's installed:

```bash
npx openci list
npx openci status
```

Update installed workflows:

```bash
npx openci update
```

## Commands

### `add`

Install a workflow into your repo. The argument after `add` is the source:

```bash
openci add <source> --workflow <name>
```

Supported sources:
- **GitHub shorthand:** `owner/repo`
- **Git URL:** `git@github.com:owner/repo.git`, `https://github.com/owner/repo.git`
- **Local path:** `./workflows`, `../shared-workflows`, `/abs/path`

Flags:

| Flag | Description |
|------|-------------|
| `--workflow <name>` | Select a workflow from a multi-workflow source |
| `--provider <name>` | Provider: `claude`, `codex`, `glm`, `custom` |
| `--runtime <name>` | Runtime: `action`, `script` |
| `--runner <name>` | Override the workflow runner |
| `--model <name>` | Override the default model |
| `--trigger <event>` | Override smart workflow trigger |
| `--branch <name>` | Override smart workflow branch |
| `--yes` | Non-interactive mode |
| `--dry-run` | Print target path without writing files |
| `--verbose` | Show detection and render details |

### `search`

Search official workflow metadata:

```bash
npx openci search review
```

### `list`

Show locally installed workflows:

```bash
npx openci list
```

### `status`

Show workflow health and filesystem state — what's installed, source/provider/version, missing files, untracked workflows:

```bash
npx openci status
```

### `update`

Refresh installed workflows from their recorded source metadata. Pass names to update specific workflows, or omit to update all:

```bash
npx openci update
npx openci update pr-review
npx openci update pr-review security-scan
```

### `info`

Inspect an official workflow:

```bash
npx openci info pr-review
```

### `create`

Scaffold a new workflow. Add `--smart` for templated workflows with detection:

```bash
npx openci create my-workflow --yes
npx openci create my-workflow --smart --yes
```

### `init`

Planned for a future release.

## Workflow Types

OpenCI supports two workflow types:
- **Workflows** — copied as-is
- **Smart workflows** — rendered from templates with local repo detection

### Workflows

Best when the stack is fixed, the workflow is opinionated, or no AI provider is needed:

```text
workflows/my-workflow/
├── metadata.json
├── workflow.yml
└── README.md
```

### Smart workflows

Use `workflow.yml.tmpl` + `openci.config.json` for auto-detection and substitution:

```text
workflows/my-workflow/
├── metadata.json
├── openci.config.json
├── workflow.yml.tmpl
└── README.md
```

Typical substitutions: provider, runtime, runner, package manager install command, validation command, target branch.

Use smart workflows when one definition should adapt to multiple repos or providers.

## Install Sources

### GitHub shorthand (recommended)

```bash
npx openci add owner/repo --workflow pr-review
```

### Private repos

Supported through normal git credentials (SSH keys, configured credentials). OpenCI does not prompt for credentials — if `git clone` fails, the install fails with the clone error.

```bash
npx openci add owner/private-workflows --workflow pr-review
npx openci add git@github.com:owner/private-workflows.git --workflow pr-review
```

### Git URL

```bash
npx openci add https://github.com/owner/repo.git --workflow pr-review
npx openci add git@github.com:owner/repo.git --workflow pr-review
```

Git sources are cloned to a temp directory and cleaned up after install.

### Local source

```bash
npx openci add ./workflows --workflow pr-review
```

Local sources are useful for development, testing before publishing, and internal shared directories.

## Non-Interactive / Agent Usage

In `--yes` mode, the CLI never prompts. Successful `add` prints only the created path to stdout; warnings go to stderr.

```bash
npx openci add minghinmatthewlam/openci --workflow pr-review --provider claude --yes
```

Override runtime and runner for script-based or self-hosted workflows:

```bash
npx openci add minghinmatthewlam/openci --workflow security-scan --provider glm --runtime script --runner self-hosted-a8 --yes
```

## Local Management

OpenCI stores per-workflow sidecar metadata at:

```text
.github/workflows/.openci/<workflow>.json
```

This records source, provider, runtime, runner, version, and install time so `list`, `status`, and `update` work reliably.

## Creating Workflows

### Start with a regular workflow

If you're new to workflow authoring, start with a copied-as-is workflow:

```bash
npx openci create my-workflow --yes
```

### Move to smart workflows when needed

```bash
npx openci create my-workflow --smart --yes
```

### Contributor loop

1. Scaffold a workflow
2. Edit the generated files
3. Dry-run install locally: `npx openci add . --workflow my-workflow --dry-run --yes`
4. Run the test suite
5. Publish or submit changes

## Official Workflow Directory

The web directory lives in [`web/`](web/) and provides:
- official workflow homepage with filtering
- workflow detail pages
- CLI and FAQ docs

It is fully OSS with no telemetry, hosted search, or external dependencies.

## Development

Requirements: Node.js `>=20`, npm. Version pinned to [`24.14.0`](.nvmrc) in `.nvmrc`.

### CLI

```bash
npm install
npm run lint:actions
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
node dist/index.js --help
```

### Web app

```bash
npm --prefix web ci
npm --prefix web run test
npm --prefix web run build
npm --prefix web run dev
```

## Publishing

Published as [`openci`](https://www.npmjs.com/package/openci) on npm via the `bin` entry in [`package.json`](package.json).

Before publishing:

```bash
npm run lint:actions && npm run lint && npm run format:check && npm run typecheck && npm test && npm run build && npm pack --dry-run
```

CI and release workflows:
- [ci.yml](.github/workflows/ci.yml)
- [release.yml](.github/workflows/release.yml) — uses npm trusted publishing with provenance

Code is linted with `actionlint` (workflows) and `oxlint`/`oxfmt` (project).

## FAQ

**What providers are supported?**
Claude, Codex, GLM, and custom. Each workflow declares supported providers in its metadata.

**Can I use private repos?**
Yes. Any repo your local `git clone` can access works — SSH keys, HTTPS credentials, etc.

**Where is metadata stored?**
In `.github/workflows/.openci/<workflow>.json`, alongside the installed workflow files.

**What's the difference between action and script runtimes?**
Action runtime uses a GitHub Action (e.g., `uses: anthropics/claude-code-action`). Script runtime runs the agent via shell commands — useful for self-hosted runners or custom setups.

## Contributing

Open an issue on [GitHub](https://github.com/minghinmatthewlam/openci/issues) for bugs and feature requests.

## License

[Apache 2.0](LICENSE)
