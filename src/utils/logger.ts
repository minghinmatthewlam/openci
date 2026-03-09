import pc from 'picocolors';

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
  machineResult(message: string): void;
  debug(message: string): void;
}

export interface LoggerOptions {
  yes?: boolean;
  verbose?: boolean;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
}

function writeLine(stream: NodeJS.WriteStream, message: string): void {
  stream.write(`${message}\n`);
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const infoStream = options.yes ? stderr : stdout;

  return {
    info(message) {
      writeLine(infoStream, message);
    },
    warn(message) {
      writeLine(stderr, pc.yellow(message));
    },
    error(message) {
      writeLine(stderr, pc.red(message));
    },
    success(message) {
      writeLine(infoStream, pc.green(message));
    },
    machineResult(message) {
      writeLine(stdout, message);
    },
    debug(message) {
      if (options.verbose) {
        writeLine(stderr, pc.dim(message));
      }
    },
  };
}
