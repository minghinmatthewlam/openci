# OpenCI Repo Notes

- `Done` means local checks pass **and** the pushed GitHub `CI` workflow passes for the current commit.
- Never hardcode machine-specific paths in tests. Use helpers in [test/helpers/paths.ts](/Users/matthewlam/dev/openci/test/helpers/paths.ts).
- Scope CLI flags to the narrowest command that uses them. Do not add root/global flags for command-specific behavior.
- Installed workflow state lives in `.github/workflows/.openci/`. Do not reintroduce a repo-root manifest.
- The CLI installs `.yml`/`.yaml` files from any repo's `.github/workflows/` directory. No metadata.json, no templates, no detection, no provider registry.
