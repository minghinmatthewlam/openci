# AI Issue Resolver

Converts labeled issues into draft pull requests using an AI coding agent.

## Workflow

- Watches for issues labeled `ai-fix`
- Creates a working branch
- Drafts a fix plan and implementation
- Opens a draft pull request for human review

## Install

```bash
npx openci add ai-issue-resolver --provider codex
```
