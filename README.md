# OpenCI

OpenCI is a CLI for discovering and installing AI-agent GitHub Actions workflows.

## Usage

Run it directly with `npx`:

```bash
npx openci add ai-pr-review
```

Common commands:

```bash
openci list
openci search review
openci info ai-pr-review
openci add ai-pr-review --provider codex
openci add ai-pr-review --model codex-mini --yes
openci add ai-pr-review --from ./workflows --yes
openci status
openci create my-workflow --smart --yes
```

## Flags

- `--provider <name>` selects the AI provider. Supported launch providers are `claude` and `codex`.
- `--model <name>` overrides the provider default model. For smart workflows, OpenCI infers the provider from the model when `--provider` is omitted.
- `--trigger <event>` and `--branch <name>` override smart workflow placeholders.
- `--from <source>` installs from the official registry, a local path, or a GitHub repo like `acme/workflows#ai-pr-review`.
- `--yes` enables non-interactive mode. For `add` and `create`, stdout contains only the created target path.
- `--dry-run` shows the target path without writing files.
- `--verbose` prints detection and substitution details to stderr.

## Local Contributor Flow

Scaffold a workflow:

```bash
npx openci create my-workflow --smart --yes
```

Test it locally without cloning another repo:

```bash
npx openci add my-workflow --from . --dry-run --yes
```

## Development

Requirements:

- Node.js `>=20`
- npm

Contributor guidance is pinned to Node `24.14.0` in [`.nvmrc`](/Users/matthewlam/dev/openci/.nvmrc).

Commands:

```bash
npm install
npm run typecheck
npm test
npm run build
node dist/index.js --help
```

## Publishing

The package is configured for `npx openci` via the `bin` entry in [`package.json`](/Users/matthewlam/dev/openci/package.json). Before publishing:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

The release workflow uses npm trusted publishing with provenance.
