export function hasTimeout(yamlContent: string): boolean {
  return /timeout-minutes:/m.test(yamlContent);
}
