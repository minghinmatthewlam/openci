# OpenCI

OpenCI is an open-source CLI for installing AI-powered GitHub Actions workflows from official, local, and git-based sources.

It is source-first:

```bash
npx openci add ./workflows --workflow ai-pr-review
```

The current scope is intentionally simple:
- source-first workflow installs
- local workflow management (`list`, `status`, `update`)
- smart and basic workflow support
- a lightweight OSS web directory in [`web/`](/Users/matthewlam/dev/openci/web) for official workflows only

## Why OpenCI

GitHub Actions workflows for AI agents are useful, but they are also annoying to wire up repeatedly.

OpenCI gives you:
- a consistent install flow for official, local, public, and private workflow sources
- smart workflow rendering for common substitutions like provider, package manager, validation command, and branch
- local management metadata so installed workflows can be listed, inspected, and updated later

## Quick Start

Install from a local or official-style workflows directory:

```bash
npx openci add ./workflows --workflow ai-pr-review
```

Install from a git/GitHub source:

```bash
npx openci add minghinmatthewlam/openci --workflow ai-pr-review
```

Install from a private repo over SSH:

```bash
npx openci add git@github.com:your-org/private-workflows.git --workflow ai-pr-review
```

Inspect what is installed in the current repo:

```bash
npx openci list
npx openci status
```

Refresh installed workflows from their recorded source metadata:

```bash
npx openci update
```

## Command Model

OpenCI is source-first.

That means the thing after `add` is the source:

```bash
openci add <source> --workflow <name>
```

Supported source forms:
- local path: `./workflows`, `../shared-workflows`, `/abs/path`
- GitHub shorthand: `owner/repo`
- git URL: `git@github.com:owner/repo.git`, `https://github.com/owner/repo.git`, `file:///path/to/repo`

If a source contains multiple workflows, use `--workflow <name>` to select one.

## Workflow Types

### Basic workflows

Basic workflows are copied as-is.

They are best when:
- the stack is fixed
- the workflow is intentionally opinionated
- you do not need auto-detection

### Smart workflows

Smart workflows use:
- `workflow.yml.tmpl`
- `openci.config.json`

OpenCI detects local repo characteristics and renders the final YAML before writing it to `.github/workflows/`.

Typical smart substitutions include:
- provider action and secret
- package manager install command
- validation command
- target branch
- prompt/provider-specific details

## Install Sources

### Local source

```bash
npx openci add ./workflows --workflow ai-pr-review
```

This is the easiest workflow for:
- local development
- testing a workflow before publishing it
- internal/shared directories on your machine

### GitHub shorthand

```bash
npx openci add owner/repo --workflow ai-pr-review
```

### Git URL

```bash
npx openci add https://github.com/owner/repo.git --workflow ai-pr-review
npx openci add git@github.com:owner/repo.git --workflow ai-pr-review
```

Git sources are cloned to a temporary directory and cleaned up automatically after install/update.

### Private repos

Private repos are supported through normal git credentials:
- SSH keys
- configured git credentials
- any auth flow your local git already uses

OpenCI does not prompt for credentials itself. If `git clone` cannot access the repo, the install fails with the clone error.

## Local Management

OpenCI stores per-workflow sidecar metadata next to installed workflows:

```text
.github/workflows/.openci/<workflow>.json
```

That metadata records the workflow source, provider, version, and install time so local management commands can work reliably.

### `list`

Shows locally installed workflows in the current repo:

```bash
npx openci list
```

### `status`

Shows local workflow health and filesystem state:

```bash
npx openci status
```

This is the command to use when you want to know:
- what is installed
- which source/provider/version each workflow came from
- whether a workflow file is missing
- whether there are untracked workflow files in `.github/workflows/`

### `update`

Refreshes installed workflows from their recorded source metadata:

```bash
npx openci update
npx openci update ai-pr-review
```

## Other Useful Commands

Search official workflow metadata:

```bash
npx openci search review
```

Inspect an official workflow:

```bash
npx openci info ai-pr-review
```

Scaffold a new workflow:

```bash
npx openci create my-workflow --smart --yes
```

`init` exists as a stub right now and is not implemented yet.

## Flags

### `add`

- `--workflow <name>`: select a workflow from a multi-workflow source
- `--provider <name>`: choose provider (`claude`, `codex`)
- `--model <name>`: override the default model
- `--trigger <event>`: override smart workflow trigger placeholder
- `--branch <name>`: override smart workflow branch placeholder
- `--yes`: non-interactive mode
- `--dry-run`: print target path without writing files
- `--verbose`: show detection/render details

### `create`

- `--basic`: scaffold a basic workflow
- `--smart`: scaffold a smart workflow
- `--yes`: skip prompts

## Non-Interactive / Agent Usage

OpenCI is designed to work well in non-interactive environments.

In `--yes` mode:
- it never prompts
- successful `add` prints only the created workflow path to stdout
- warnings and secret setup hints go to stderr

Example:

```bash
npx openci add ./workflows --workflow ai-pr-review --provider claude --yes
```

## Official Workflow Directory

The lightweight OSS directory app lives in [`web/`](/Users/matthewlam/dev/openci/web).

It currently provides:
- official workflow homepage
- workflow detail pages
- docs
- simple static filtering over official workflows

It intentionally does **not** depend on:
- telemetry-backed rankings
- audits
- hosted search APIs

That keeps the first public web experience fully OSS and easy to run locally.

## Contributor Workflow

Create a workflow scaffold:

```bash
npx openci create my-workflow --smart --yes
```

Test it locally from the workflow source root:

```bash
npx openci add . --workflow my-workflow --dry-run --yes
```

Recommended contributor loop:
1. scaffold a workflow
2. edit the generated files
3. dry-run install it locally
4. run the test suite
5. then publish or submit changes

## Development

Requirements:
- Node.js `>=20`
- npm

Contributor guidance is pinned to [`24.14.0`](/Users/matthewlam/dev/openci/.nvmrc) in `.nvmrc`.

### CLI

```bash
npm install
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

The npm package is published as `openci` and exposes the CLI through the `bin` entry in [`package.json`](/Users/matthewlam/dev/openci/package.json).

Before publishing:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

The repository also includes:
- CI workflow in [ci.yml](/Users/matthewlam/dev/openci/.github/workflows/ci.yml)
- release workflow in [release.yml](/Users/matthewlam/dev/openci/.github/workflows/release.yml)

The release workflow uses npm trusted publishing with provenance.
