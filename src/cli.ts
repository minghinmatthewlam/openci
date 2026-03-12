import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerCreateCommand } from "./commands/create.js";
import { registerInfoCommand } from "./commands/info.js";
import { registerInitCommand } from "./commands/init.js";
import { registerListCommand } from "./commands/list.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerUpdateCommand } from "./commands/update.js";

export function buildCli(version = "0.1.0"): Command {
  const program = new Command();

  program
    .name("openci")
    .description("Discover and install AI-powered GitHub Actions workflows")
    .version(version)
    .showHelpAfterError();

  registerAddCommand(program);
  registerSearchCommand(program);
  registerListCommand(program);
  registerInfoCommand(program);
  registerStatusCommand(program);
  registerUpdateCommand(program);
  registerInitCommand(program);
  registerCreateCommand(program);

  return program;
}
