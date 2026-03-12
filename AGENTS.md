# OpenCI Repo Notes

- `Done` means local checks pass **and** the pushed GitHub `CI` workflow passes for the current commit.
- Never hardcode machine-specific paths in tests. Use helpers in [test/helpers/paths.ts](/Users/matthewlam/dev/openci/test/helpers/paths.ts).
- Keep the official CLI source data in sync: [registry.json](/Users/matthewlam/dev/openci/registry.json) and [workflows](/Users/matthewlam/dev/openci/workflows).
- Keep the web directory data in sync with the official source: [registry.json](/Users/matthewlam/dev/openci/web/data/registry/registry.json) and [workflows](/Users/matthewlam/dev/openci/web/data/registry/workflows).
- Do not document or render install commands the repo cannot actually serve from top-level [workflows](/Users/matthewlam/dev/openci/workflows).
- Scope CLI flags to the narrowest command that uses them. Do not add root/global flags for command-specific behavior.
- Installed workflow state lives in `.github/workflows/.openci/`. Do not reintroduce a repo-root manifest.
- In user-facing docs, present regular workflows first and smart workflows second.
