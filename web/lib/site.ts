export const docsSections = [
  { label: "Overview", href: "/docs" },
  { label: "CLI", href: "/docs/cli" },
  { label: "FAQ", href: "/docs/faq" },
];

export function buildInstallCommand(source: string, workflow: string): string {
  return `npx openci-app add ${source} --workflow ${workflow}`;
}
