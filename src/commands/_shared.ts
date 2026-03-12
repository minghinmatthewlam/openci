import type { Command } from "commander";
import { CliError } from "../core/errors.js";

export function registerPlaceholderCommand(
  program: Command,
  config: {
    name: string;
    description: string;
    argument?: string;
    implementationMessage?: string;
    exitCode?: number;
  },
): void {
  const command = program.command(config.name).description(config.description);

  if (config.argument) {
    command.argument(config.argument);
  }

  command.action(async () => {
    throw new CliError(
      config.implementationMessage ?? `${config.name} is not implemented yet`,
      config.exitCode ?? 1,
    );
  });
}
