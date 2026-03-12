import type { PackageJsonLike } from "../utils/package-json.js";

const FRAMEWORKS: Array<{ label: string; packages: string[] }> = [
  { label: "Next.js", packages: ["next"] },
  { label: "Nuxt", packages: ["nuxt"] },
  { label: "SvelteKit", packages: ["@sveltejs/kit"] },
  { label: "Svelte", packages: ["svelte"] },
  { label: "Astro", packages: ["astro"] },
  { label: "Remix", packages: ["@remix-run/react", "@remix-run/dev"] },
  { label: "NestJS", packages: ["@nestjs/core"] },
  { label: "Express", packages: ["express"] },
  { label: "Vue", packages: ["vue"] },
  { label: "React", packages: ["react"] },
];

export function detectFramework(packageJson?: PackageJsonLike): string | undefined {
  if (!packageJson) {
    return undefined;
  }

  const dependencies = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {}),
  ]);

  for (const framework of FRAMEWORKS) {
    if (framework.packages.some((pkg) => dependencies.has(pkg))) {
      return framework.label;
    }
  }

  return undefined;
}
