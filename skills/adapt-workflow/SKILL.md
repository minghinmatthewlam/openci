---
name: adapt-workflow
description: Adapt an installed GitHub Actions workflow to work in the current repo. Use this skill whenever a user installs a workflow via openci and needs it customized — when they say "adapt this workflow", "make this workflow work in my repo", "fix this workflow for my project", "/adapt-workflow", or when a workflow has repo-specific guards, hardcoded values, or missing scripts that need to be resolved. Also triggers when a user asks about customizing or modifying an installed CI workflow.
---

# Adapt Workflow

Adapt a GitHub Actions workflow installed via OpenCI to work in the current repo.

## When to use

A user has run `openci add <source> --workflow <name>` and the installed workflow contains repo-specific configuration that won't work as-is. Common issues: repository guards, hardcoded usernames, custom runners, missing scripts, wrong package manager commands.

## Arguments

`/adapt-workflow <workflow-name>`

The workflow-name is the stem name (no extension) matching a file in `.github/workflows/`.

## How it works

### Phase 1: Locate and load

1. Find `.github/workflows/<name>.yml` (or `.yaml`). If it doesn't exist, tell the user to install it first with `openci add`.
2. Read the sidecar at `.github/workflows/.openci/<name>.json` if it exists. This contains:
   - `source` — the repo it was installed from (e.g., `openai/codex`)
   - `workflow` — the workflow filename stem
   - `commit` — the commit SHA at install time
3. Read the workflow YAML content.

### Phase 2: Analyze the workflow for adaptation issues

Scan the YAML for these patterns:

**Repository guards** — `if:` conditions that lock the workflow to a specific repo:
```yaml
if: github.repository == 'openai/codex'
```
These completely prevent the workflow from running in any other repo.

**Hardcoded usernames** — allowlists baked into the workflow:
```yaml
env:
  ALLOWED_USERS: "mistercrunch,rusackas"
```
Or in `if:` conditions checking `github.actor`.

**Custom runners** — non-standard `runs-on:` values:
```yaml
runs-on: vscode-large-runners
```
These reference runners that only exist in the source org's GitHub environment.

**Missing scripts** — `run:` steps referencing files that don't exist locally:
```yaml
run: bun run scripts/sweep.ts
run: ./build/azure-pipelines/linux/setup-env.sh
```
Check if the referenced file actually exists in the user's repo. If not, it's a problem.

**Package manager mismatches** — workflow uses a different package manager than the repo:
```yaml
run: pnpm install --frozen-lockfile
```
But the repo has `package-lock.json` (npm) not `pnpm-lock.yaml`.

**Hardcoded path filters** — trigger paths specific to the source repo:
```yaml
on:
  pull_request:
    paths:
      - 'autogpt_platform/**'
```

**Provider-specific configuration** — GCP project IDs, custom env vars, org-specific secrets that the user needs to set up.

### Phase 3: Understand the user's repo

Read the repo context to inform adaptations:

- `package.json` — package manager (npm/pnpm/yarn/bun), scripts, dependencies, framework
- Lock files — `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`
- `.nvmrc` or `package.json` engines — Node version
- `git remote get-url origin` — the user's GitHub org/repo for replacing guards
- Existing `.github/workflows/` — patterns already in use (runners, triggers, setup steps)
- Directory structure — what languages, frameworks, build tools are present

### Phase 4: Apply adaptations

For each issue found, apply the appropriate fix:

**Repository guards** — Remove the `if:` condition entirely, or replace with the user's repo:
```yaml
# Before
if: github.repository == 'openai/codex'
# After — just remove the line
```

**Hardcoded usernames** — Replace with the repo owner's GitHub username (from git remote), or ask the user who should have access.

**Custom runners** — Replace with `ubuntu-latest` unless the user has self-hosted runners configured.

**Missing scripts** — This is the most complex case. Use the sidecar's `source` field to identify the source repo, then:
1. Fetch the missing script from the source repo (e.g., `gh api repos/anthropics/claude-code/contents/scripts/sweep.ts`)
2. Read and understand what the script does
3. Decide: can the logic be inlined into the workflow step, or should we create the script locally?
4. For simple scripts — rewrite the `run:` step inline
5. For complex scripts — create the file locally with adaptations for the user's repo

**Package manager** — Swap commands to match the user's package manager:
| From | To (npm) | To (pnpm) | To (yarn) | To (bun) |
|------|----------|-----------|-----------|----------|
| `npm ci` | keep | `pnpm install --frozen-lockfile` | `yarn install --frozen-lockfile` | `bun install --frozen-lockfile` |
| `npm run build` | keep | `pnpm run build` | `yarn build` | `bun run build` |
| `npm test` | keep | `pnpm test` | `yarn test` | `bun test` |

**Path filters** — Remove source-repo-specific paths, or map to equivalent paths in the user's repo if obvious.

**Provider config** — Add comments noting what the user needs to configure (GCP project, API keys, etc.) rather than guessing values.

### Phase 5: Report

After making changes, show a clear summary:

```
Adapted issue-labeler.yml for your repo:

✓ Removed repository guard (was locked to openai/codex)
✓ Removed Codex-specific label taxonomy, replaced with generic labels
✓ Swapped npm ci → pnpm install --frozen-lockfile

Remaining setup:
  • Set secret CODEX_OPENAI_API_KEY: gh secret set CODEX_OPENAI_API_KEY
```

## Important guidelines

- Always read the full workflow YAML before making changes — understand the workflow's purpose first.
- When fetching scripts from source repos, use the GitHub API or `gh` CLI rather than cloning the entire repo.
- Preserve the workflow's core logic and intent. The goal is to make it work in this repo, not to rewrite it from scratch.
- If something can't be adapted automatically (e.g., a complex custom script with deep repo-specific dependencies), explain what the user needs to do manually rather than generating a broken adaptation.
- When in doubt about a value (username, project ID, runner label), ask the user rather than guessing.
- After adaptation, the workflow should be ready to commit and push — no further manual edits required for the common case.
