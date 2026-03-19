import { execFileSync } from "node:child_process";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function installFakeGh(
  binDir: string,
): Promise<{ logPath: string; pathValue: string }> {
  await mkdir(binDir, { recursive: true });
  const scriptPath = join(binDir, "gh");
  const logPath = join(binDir, "gh-set.log");

  const script = `#!/bin/sh
if [ "$1" = "--version" ]; then
  exit 0
fi

if [ "$1" = "auth" ] && [ "$2" = "status" ]; then
  if [ "$OPENCI_FAKE_GH_AUTH" = "0" ]; then
    exit 1
  fi
  exit 0
fi

if [ "$1" = "secret" ] && [ "$2" = "list" ]; then
  printf "%s\\n" "$OPENCI_FAKE_GH_SECRETS"
  exit 0
fi

if [ "$1" = "secret" ] && [ "$2" = "set" ]; then
  value=""
  if [ "$4" = "--body" ]; then
    value="$5"
  elif [ ! -t 0 ]; then
    IFS= read -r value
  fi
  printf "%s=%s\\n" "$3" "$value" >> "$OPENCI_FAKE_GH_SET_LOG"
  exit 0
fi

exit 1
`;

  await writeFile(scriptPath, script, "utf8");
  await chmod(scriptPath, 0o755);
  return {
    logPath,
    pathValue: `${binDir}:${process.env.PATH ?? ""}`,
  };
}

export async function installGitOnly(binDir: string): Promise<string> {
  await mkdir(binDir, { recursive: true });
  const scriptPath = join(binDir, "git");
  const gitPath = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  await writeFile(
    scriptPath,
    `#!/bin/sh
exec "${gitPath}" "$@"
`,
    "utf8",
  );
  await chmod(scriptPath, 0o755);
  return `${binDir}`;
}
