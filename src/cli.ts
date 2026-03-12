import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerCreateCommand } from "./commands/create.js";
import { registerInfoCommand } from "./commands/info.js";
import { registerListCommand } from "./commands/list.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerUpdateCommand } from "./commands/update.js";

declare const __OPENCI_VERSION__: string;
const CLI_VERSION = typeof __OPENCI_VERSION__ !== "undefined" ? __OPENCI_VERSION__ : "0.0.0-dev";

export function buildCli(version = CLI_VERSION): Command {
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
  registerCreateCommand(program);

  return program;
}
