export function buildSmartScaffold(name: string): Record<string, string> {
  return {
    "metadata.json": JSON.stringify(
      {
        name,
        displayName: `TODO: ${name}`,
        description: "TODO: describe this workflow.",
        version: "1.0.0",
        author: "TODO",
        tags: ["TODO"],
        provider: ["claude", "codex", "glm"],
        runtimes: ["action", "script"],
        runners: ["github-ubuntu", "self-hosted-a8"],
        defaultRuntime: "action",
        defaultRunner: "github-ubuntu",
        smart: true,
        requiredSecrets: {
          claude: ["ANTHROPIC_API_KEY"],
          codex: ["OPENAI_API_KEY"],
          glm: ["GLM_API_KEY"],
        },
        triggers: ["pull_request"],
        stacks: ["any"],
      },
      null,
      2,
    ),
    "openci.config.json": JSON.stringify(
      {
        defaults: {
          provider: "claude",
          runtime: "action",
          runner: "github-ubuntu",
        },
        detect: {
          packageManager: true,
          nodeVersion: true,
          defaultBranch: true,
          validationCommand: true,
          framework: true,
        },
        providerModes: {
          claude: {
            runtime: "action",
          },
          codex: {
            runtime: "action",
          },
          glm: {
            runtime: "script",
            script: {
              env: {
                GLM_API_KEY: "${{ secrets.GLM_API_KEY }}",
              },
              run: "node scripts/run-provider.js glm",
            },
          },
        },
        runners: {
          "github-ubuntu": {
            runsOn: "ubuntu-latest",
          },
          "self-hosted-a8": {
            runsOn: ["self-hosted", "linux", "x64", "a8"],
          },
        },
        substitutions: {
          INSTALL_CMD: {
            npm: "npm ci",
            pnpm: "pnpm install --frozen-lockfile",
            yarn: "yarn install --frozen-lockfile",
            bun: "bun install --frozen-lockfile",
          },
          VALIDATION_CMD: {
            _detect: "validationCommand",
            _default: "npm test",
          },
          TRIGGER_EVENT: {
            _default: "pull_request",
          },
          TARGET_BRANCH: {
            _default: "main",
            _detect: "defaultBranch",
          },
          NODE_VERSION: {
            _default: "20",
            _detect: "nodeVersion",
          },
          FRAMEWORK: {
            _default: "Node.js",
            _detect: "framework",
          },
          PACKAGE_MANAGER: {
            _default: "npm",
            _detect: "packageManager",
          },
        },
      },
      null,
      2,
    ),
    "workflow.yml.tmpl": [
      `name: ${name}`,
      "",
      "on:",
      "  {{TRIGGER_EVENT}}:",
      "    branches: [{{TARGET_BRANCH}}]",
      "",
      "jobs:",
      "  task:",
      "    runs-on: {{RUNS_ON}}",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - name: Install",
      "        run: {{INSTALL_CMD}}",
      "      - name: Validate",
      "        run: {{VALIDATION_CMD}}",
      "      {{PROVIDER_STEP}}",
    ].join("\n"),
    "README.md": [
      `# ${name}`,
      "",
      "TODO: describe what this smart workflow does.",
      "",
      "## Install",
      "",
      "```bash",
      `npx openci add owner/repo --workflow ${name} --provider claude`,
      "```",
    ].join("\n"),
  };
}
