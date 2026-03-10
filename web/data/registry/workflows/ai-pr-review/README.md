# AI Pull Request Review

Adds an AI-powered review workflow to every pull request.

## What it does

1. Checks out the repository.
2. Detects your package manager, framework, and default branch.
3. Runs validation commands before handing the diff to an AI coding agent.
4. Publishes actionable review feedback inside the pull request.

## Best for

- Teams that want automated PR review on every change
- Repositories that already run linting and tests in CI
- Organizations comparing Claude and Codex side by side

## Install

```bash
npx openci add ai-pr-review --provider claude
```
