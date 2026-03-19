import { chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface FakeGhOptions {
  auth?: boolean;
  secrets?: string[];
  failSetSecrets?: string[];
  logPath?: string;
}

export async function createFakeGh(dir: string, options: FakeGhOptions = {}): Promise<string> {
  await mkdir(dir, { recursive: true });
  const scriptPath = join(dir, "gh");
  const auth = options.auth === false ? "1" : "0";
  const secrets = JSON.stringify(options.secrets ?? []);
  const failSet = JSON.stringify(options.failSetSecrets ?? []);
  const logPath = options.logPath ? JSON.stringify(options.logPath) : "undefined";

  const script = `#!/bin/sh
AUTH_FAIL=${auth}
SECRETS='${secrets}'
FAIL_SET='${failSet}'
LOG_PATH=${logPath}

if [ "$1" = "--version" ]; then
  echo "gh version test"
  exit 0
fi

if [ "$1" = "auth" ] && [ "$2" = "status" ]; then
  if [ "$AUTH_FAIL" = "1" ]; then
    exit 1
  fi
  exit 0
fi

if [ "$1" = "auth" ] && [ "$2" = "token" ]; then
  echo "fake-token"
  exit 0
fi

if [ "$1" = "secret" ] && [ "$2" = "list" ]; then
  node -e "for (const secret of JSON.parse(process.argv[1])) console.log(secret)" "$SECRETS"
  exit 0
fi

if [ "$1" = "secret" ] && [ "$2" = "set" ]; then
  SECRET_NAME="$3"
  if node -e "process.exit(JSON.parse(process.argv[1]).includes(process.argv[2]) ? 0 : 1)" "$FAIL_SET" "$SECRET_NAME"; then
    exit 1
  fi
  if [ "$4" = "--body" ]; then
    VALUE="$5"
  else
    VALUE=$(cat)
  fi
  if [ "$LOG_PATH" != "undefined" ]; then
    printf "%s=%s\\n" "$SECRET_NAME" "$VALUE" >> "$LOG_PATH"
  fi
  exit 0
fi

exit 1
`;

  await writeFile(scriptPath, script, "utf8");
  await chmod(scriptPath, 0o755);
  return scriptPath;
}

export async function createFakeGhEnv(options: FakeGhOptions = {}): Promise<{
  env: NodeJS.ProcessEnv;
  logPath: string;
}> {
  const binDir = await mkdtemp(join(tmpdir(), "openci-fake-gh-"));
  const logPath = options.logPath ?? join(binDir, "set-secrets.log");
  await createFakeGh(binDir, { ...options, logPath });
  return {
    logPath,
    env: {
      PATH: `${binDir}:${process.env.PATH ?? ""}`,
    },
  };
}
