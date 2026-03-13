import { describe, expect, it } from "vitest";
import { extractSecrets } from "../../src/analyze/secrets.js";

describe("extractSecrets", () => {
  it("extracts secrets from workflow YAML", () => {
    const yaml = `
steps:
  - uses: some-action@v1
    with:
      api_key: \${{ secrets.MY_API_KEY }}
      token: \${{ secrets.DEPLOY_TOKEN }}
`;
    expect(extractSecrets(yaml)).toEqual(["DEPLOY_TOKEN", "MY_API_KEY"]);
  });

  it("excludes GITHUB_TOKEN", () => {
    const yaml = `
steps:
  - uses: some-action@v1
    with:
      token: \${{ secrets.GITHUB_TOKEN }}
      api_key: \${{ secrets.MY_KEY }}
`;
    expect(extractSecrets(yaml)).toEqual(["MY_KEY"]);
  });

  it("returns empty array when no secrets", () => {
    const yaml = `
steps:
  - run: echo "hello"
`;
    expect(extractSecrets(yaml)).toEqual([]);
  });

  it("deduplicates secrets", () => {
    const yaml = `
steps:
  - uses: a@v1
    with:
      key: \${{ secrets.API_KEY }}
  - uses: b@v1
    with:
      key: \${{ secrets.API_KEY }}
`;
    expect(extractSecrets(yaml)).toEqual(["API_KEY"]);
  });

  it("handles whitespace variations in expression syntax", () => {
    const yaml = `
key1: \${{secrets.A}}
key2: \${{  secrets.B  }}
key3: \${{ secrets.C }}
`;
    expect(extractSecrets(yaml)).toEqual(["A", "B", "C"]);
  });
});
