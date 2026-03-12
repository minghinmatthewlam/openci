import type { RegistryEntry } from "./registry";

export const docsSections = [
  { label: "Overview", href: "/docs" },
  { label: "CLI", href: "/docs#cli" },
  { label: "FAQ", href: "/docs#faq" },
];

const OFFICIAL_SOURCE = "minghinmatthewlam/openci";

export function buildInstallCommand(workflow: RegistryEntry): string {
  const source = workflow.repository ?? OFFICIAL_SOURCE;
  const parts = ["npx", "openci", "add", source, "--workflow", workflow.name];

  if (workflow.provider.length > 0) {
    parts.push("--provider", workflow.provider[0]);
  }
  if (workflow.defaultRuntime && workflow.defaultRuntime !== "action") {
    parts.push("--runtime", workflow.defaultRuntime);
  }
  if (
    workflow.defaultRunner &&
    !["github-ubuntu", "ubuntu-latest"].includes(workflow.defaultRunner)
  ) {
    parts.push("--runner", workflow.defaultRunner);
  }

  return parts.join(" ");
}
