import { describe, expect, it } from "vitest";
import { detectProvider } from "../../src/analyze/provider.js";

describe("detectProvider", () => {
  it("detects Claude code action", () => {
    const yaml = `
steps:
  - uses: anthropics/claude-code-action@v1
    with:
      model: claude-sonnet-4-20250514
`;
    const result = detectProvider(yaml);
    expect(result).toEqual({
      name: "Claude",
      action: "anthropics/claude-code-action@v1",
      model: "claude-sonnet-4-20250514",
    });
  });

  it("detects Claude security review", () => {
    const yaml = `
steps:
  - uses: anthropics/claude-code-security-review@v1
`;
    const result = detectProvider(yaml);
    expect(result?.name).toBe("Claude");
  });

  it("detects Codex action", () => {
    const yaml = `
steps:
  - uses: openai/codex-action@v1
`;
    const result = detectProvider(yaml);
    expect(result?.name).toBe("Codex");
  });

  it("detects Gemini action", () => {
    const yaml = `
steps:
  - uses: google-github-actions/run-gemini-cli@v1
    with:
      model: gemini-2.5-pro
`;
    const result = detectProvider(yaml);
    expect(result?.name).toBe("Gemini");
    expect(result?.model).toBe("gemini-2.5-pro");
  });

  it("returns undefined for non-AI workflows", () => {
    const yaml = `
steps:
  - uses: actions/checkout@v4
  - run: npm test
`;
    expect(detectProvider(yaml)).toBeUndefined();
  });

  it("detects model from --model flag", () => {
    const yaml = `
steps:
  - uses: anthropics/claude-code-action@v1
    with:
      direct_prompt: "--model claude-opus-4-20250514 review this"
`;
    const result = detectProvider(yaml);
    expect(result?.model).toBe("claude-opus-4-20250514");
  });
});
