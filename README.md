# OpenCI

OpenCI is an open-source CLI for installing AI-powered GitHub Actions workflows from official, local, and git-based sources.

It is source-first:

```bash
npx openci add minghinmatthewlam/openci --workflow pr-review
```

The current scope is intentionally simple:
- source-first workflow installs
- local workflow management (`list`, `status`, `update`)
- workflow and smart workflow support
- a lightweight OSS web directory in [`web/`](/Users/matthewlam/dev/openci/web) for official workflows only

## Why OpenCI

GitHub Actions workflows for AI agents are useful, but they are also annoying to wire up repeatedly.

OpenCI gives you:
- a consistent install flow for official/public, private, and local workflow sources
- smart workflow rendering for common substitutions like provider, runtime, runner, package manager, validation command, and branch
- local management metadata so installed workflows can be listed, inspected, and updated later

## Quick Start

Install from a git/GitHub source:

```bash
npx openci add minghinmatthewlam/openci --workflow pr-review
```

Install from a private repo:

```bash
npx openci add your-org/private-workflows --workflow pr-review
```

Install from a local workflows directory:

```bash
npx openci add ./workflows --workflow pr-review
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

OpenCI supports two workflow types:
- **workflows**: copied as-is
- **smart workflows**: rendered from templates with local repo detection

If you are new to OpenCI workflow authoring, start with a regular **workflow** first.

### Workflows

Workflows are copied as-is.

They are best when:
- the stack is fixed
- the workflow is intentionally opinionated
- you do not need auto-detection
- the workflow may not need any AI provider at all, such as routing or review-gating flows

Typical files:

```text
workflows/my-workflow/
├── metadata.json
├── workflow.yml
└── README.md
```

### Smart workflows

Smart workflows use:
- `workflow.yml.tmpl`
- `openci.config.json`

OpenCI detects local repo characteristics and renders the final YAML before writing it to `.github/workflows/`.

Typical smart substitutions include:
- provider, runtime, and runner
- package manager install command
- validation command
- target branch
- prompt/provider-specific details

Typical files:

```text
workflows/my-workflow/
├── metadata.json
├── openci.config.json
├── workflow.yml.tmpl
└── README.md
```

Use smart workflows when you want one workflow definition to adapt to multiple repos or providers. Use a regular workflow when you want the simplest, most explicit setup.

## Install Sources

### GitHub shorthand

```bash
npx openci add owner/repo --workflow pr-review
```

This is the primary source form to optimize for in docs and onboarding. It matches the most common public install flow and keeps the command short.

### Private repos

Private repos are supported through normal git credentials:
- SSH keys
- configured git credentials
- any auth flow your local git already uses

These can both work for private repos, depending on local git auth setup:

```bash
npx openci add owner/private-workflows --workflow pr-review
npx openci add git@github.com:owner/private-workflows.git --workflow pr-review
```

OpenCI does not prompt for credentials itself. If `git clone` cannot access the repo, the install fails with the clone error.

### Git URL

```bash
npx openci add https://github.com/owner/repo.git --workflow pr-review
npx openci add git@github.com:owner/repo.git --workflow pr-review
```

Git sources are cloned to a temporary directory and cleaned up automatically after install/update.

### Local source

```bash
npx openci add ./workflows --workflow pr-review
```

This is the easiest workflow for:
- local development
- testing a workflow before publishing it
- internal/shared directories on your machine

## Local Management

OpenCI stores per-workflow sidecar metadata next to installed workflows:

```text
.github/workflows/.openci/<workflow>.json
```

That metadata records the workflow source, provider, runtime, runner, version, and install time so local management commands can work reliably.

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
npx openci update pr-review
```

## Other Useful Commands

Search official workflow metadata:

```bash
npx openci search review
```

At the current phase, `search` is intentionally lightweight. It searches the official static metadata only and is not yet backed by a broader ingest/search service.

Inspect an official workflow:

```bash
npx openci info pr-review
```

Scaffold a new workflow:

```bash
npx openci create my-workflow --smart --yes
```

`create` generates the starter files for a new workflow in `workflows/<name>/`. By default it creates the simplest copied-as-is workflow. Add `--smart` if you need templating, runtime/provider configuration, and local detection.

`init` exists as a stub right now and is not implemented yet.

## Flags

### `add`

- `--workflow <name>`: select a workflow from a multi-workflow source
- `--provider <name>`: choose a supported provider such as `claude`, `codex`, `glm`, or `custom`
- `--runtime <name>`: override the provider runtime (`action`, `script`)
- `--runner <name>`: override the workflow runner
- `--model <name>`: override the default model
- `--trigger <event>`: override smart workflow trigger placeholder
- `--branch <name>`: override smart workflow branch placeholder
- `--yes`: non-interactive mode
- `--dry-run`: print target path without writing files
- `--verbose`: show detection/render details

### `create`

- default: scaffold a copied-as-is workflow
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
npx openci add minghinmatthewlam/openci --workflow pr-review --provider claude --yes
```

Script-runtime and self-hosted workflows can override runtime and runner directly:

```bash
npx openci add minghinmatthewlam/openci --workflow security-scan --provider glm --runtime script --runner self-hosted-a8 --yes
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

### Start with a regular workflow

If you are learning the format or publishing a single opinionated workflow, start here:

```bash
npx openci create my-workflow --yes
```

That gives you the simplest possible structure to edit and test.

### Move to smart workflows when needed

If you need local detection and templating:

```bash
npx openci create my-workflow --smart --yes
```

Smart workflows are more powerful, but they also require more files and more testing.

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

The npm package is published as `openci` and exposes the CLI through the `bin` entry in [`package.json`](/Users/matthewlam/dev/openci/package.json).

Before publishing:

```bash
npm run lint:actions
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

The repository also includes:
- CI workflow in [ci.yml](/Users/matthewlam/dev/openci/.github/workflows/ci.yml)
- release workflow in [release.yml](/Users/matthewlam/dev/openci/.github/workflows/release.yml)

The release workflow uses npm trusted publishing with provenance.
Workflow files are linted with `actionlint`, and project code is linted/formatted with `oxlint` and `oxfmt`.
