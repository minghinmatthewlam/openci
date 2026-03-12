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
        provider: ["claude", "codex"],
        smart: true,
        requiredSecrets: {
          claude: ["ANTHROPIC_API_KEY"],
          codex: ["OPENAI_API_KEY"],
        },
        triggers: ["pull_request"],
        stacks: ["any"],
      },
      null,
      2,
    ),
    "openci.config.json": JSON.stringify(
      {
        detect: {
          packageManager: true,
          nodeVersion: true,
          defaultBranch: true,
          validationCommand: true,
          framework: true,
        },
        providers: {
          claude: {
            AGENT_ACTION: "anthropics/claude-code-action@v1",
            AGENT_AUTH_KEY: "anthropic_api_key",
            AGENT_SECRET_NAME: "ANTHROPIC_API_KEY",
            AGENT_EXTRA_ARGS: "model: claude-sonnet-4-6",
          },
          codex: {
            AGENT_ACTION: "openai/codex-action@v1",
            AGENT_AUTH_KEY: "openai-api-key",
            AGENT_SECRET_NAME: "OPENAI_API_KEY",
            AGENT_EXTRA_ARGS: "model: codex-mini",
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
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - name: Install",
      "        run: {{INSTALL_CMD}}",
      "      - name: Validate",
      "        run: {{VALIDATION_CMD}}",
      "      - uses: {{AGENT_ACTION}}",
      "        with:",
      "          {{AGENT_AUTH_KEY}}: ${{ secrets.{{AGENT_SECRET_NAME}} }}",
      "          {{AGENT_EXTRA_ARGS}}",
      "          prompt: TODO",
    ].join("\n"),
    "README.md": [
      `# ${name}`,
      "",
      "TODO: describe what this workflow does.",
      "",
      "## Install",
      "",
      "```bash",
      `npx openci add ${name}`,
      "```",
    ].join("\n"),
  };
}
