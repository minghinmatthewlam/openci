import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerListCommand } from "./commands/list.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerUpdateCommand } from "./commands/update.js";
import { CLI_VERSION } from "./version.js";

export function buildCli(version = CLI_VERSION): Command {
  const program = new Command();
  program
    .name("openci")
    .description("Install GitHub Actions workflows from any repo")
    .version(version)
    .showHelpAfterError();

  registerAddCommand(program);
  registerSearchCommand(program);
  registerListCommand(program);
  registerStatusCommand(program);
  registerUpdateCommand(program);
  registerRemoveCommand(program);
  registerDoctorCommand(program);

  return program;
}
