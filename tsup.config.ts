import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  define: {
    __OPENCI_VERSION__: JSON.stringify(pkg.version),
  },
});
