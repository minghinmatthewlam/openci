import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerListCommand } from "./commands/list.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerUpdateCommand } from "./commands/update.js";

declare const __OPENCI_VERSION__: string;
const CLI_VERSION = typeof __OPENCI_VERSION__ !== "undefined" ? __OPENCI_VERSION__ : "0.0.0-dev";

export function buildCli(version = CLI_VERSION): Command {
  const program = new Command();
  program
    .name("openci")
    .description("Install GitHub Actions workflows from any repo")
    .version(version)
    .showHelpAfterError();

  registerAddCommand(program);
  registerListCommand(program);
  registerStatusCommand(program);
  registerUpdateCommand(program);
  registerRemoveCommand(program);
  registerDoctorCommand(program);

  return program;
}
