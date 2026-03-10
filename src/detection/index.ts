import { detectDefaultBranch } from './branch.js';
import { detectFramework } from './framework.js';
import { detectNodeVersion } from './node-version.js';
import { detectPackageManager, type PackageManager } from './package-manager.js';
import { detectValidationCommand } from './validation.js';
import { readPackageJson } from '../utils/package-json.js';

export interface DetectionResult {
  packageManager?: PackageManager;
  nodeVersion?: string;
  defaultBranch?: string;
  framework?: string;
  validationCommand?: string;
  warnings: string[];
}

export interface DetectionOptions {
  packageManager?: boolean;
  nodeVersion?: boolean;
  defaultBranch?: boolean;
  framework?: boolean;
  validationCommand?: boolean;
}

function warningMessage(key: string, error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return `Failed to detect ${key}: ${detail}`;
}

export async function detectRepo(root: string, enabled: DetectionOptions): Promise<DetectionResult> {
  const result: DetectionResult = {
    warnings: [],
  };

  let packageJson = undefined;
  try {
    packageJson = await readPackageJson(root);
  } catch (error) {
    result.warnings.push(warningMessage('package.json', error));
  }

  if (enabled.packageManager || enabled.validationCommand) {
    try {
      const packageManager = await detectPackageManager(root);
      if (packageManager) {
        result.packageManager = packageManager;
      }
    } catch (error) {
      result.warnings.push(warningMessage('package manager', error));
    }
  }

  if (enabled.nodeVersion) {
    try {
      const nodeVersion = await detectNodeVersion(root, packageJson);
      if (nodeVersion) {
        result.nodeVersion = nodeVersion;
      }
    } catch (error) {
      result.warnings.push(warningMessage('Node version', error));
    }
  }

  if (enabled.defaultBranch) {
    try {
      const defaultBranch = await detectDefaultBranch(root);
      if (defaultBranch) {
        result.defaultBranch = defaultBranch;
      }
    } catch (error) {
      result.warnings.push(warningMessage('default branch', error));
    }
  }

  if (enabled.framework) {
    try {
      const framework = detectFramework(packageJson);
      if (framework) {
        result.framework = framework;
      }
    } catch (error) {
      result.warnings.push(warningMessage('framework', error));
    }
  }

  if (enabled.validationCommand && result.packageManager) {
    try {
      const validationCommand = detectValidationCommand(packageJson, result.packageManager);
      if (validationCommand) {
        result.validationCommand = validationCommand;
      }
    } catch (error) {
      result.warnings.push(warningMessage('validation command', error));
    }
  }

  return result;
}
