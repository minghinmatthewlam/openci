import { describe, expect, it } from "vitest";
import { CliError } from "../../src/core/errors.js";
import { substituteTemplate } from "../../src/template/substitute.js";

describe("substituteTemplate", () => {
  it("preserves indentation for whole-line multiline placeholders", () => {
    const template = ["with:", "  {{AGENT_EXTRA_ARGS}}"].join("\n");
    const rendered = substituteTemplate(template, {
      AGENT_EXTRA_ARGS: ["model: codex-mini", "reasoning-effort: medium"].join("\n"),
    });

    expect(rendered).toBe(
      ["with:", "  model: codex-mini", "  reasoning-effort: medium"].join("\n"),
    );
  });

  it("replaces inline placeholders", () => {
    const rendered = substituteTemplate("Hello {{NAME}}", { NAME: "world" });
    expect(rendered).toBe("Hello world");
  });

  it("throws on unresolved placeholders", () => {
    expect(() => substituteTemplate("Hello {{NAME}}", {})).toThrow(CliError);
  });
});
