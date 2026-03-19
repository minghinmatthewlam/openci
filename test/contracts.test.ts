import { describe, expect, it } from "vitest";
import { createOpenCiApiClient, TelemetryInstallEventSchema } from "../src/contracts/index.js";
import { startHttpServer } from "./helpers/http.js";

describe("@openci/contracts", () => {
  it("accepts destinationRepo in telemetry payloads", () => {
    expect(
      TelemetryInstallEventSchema.parse({
        event: "install_success",
        slug: "github/acme/workflows/pr-review",
        cliVersion: "1.2.3",
        dateBucket: "2026-03-18",
        destinationRepo: "acme/target",
      }),
    ).toEqual({
      event: "install_success",
      slug: "github/acme/workflows/pr-review",
      cliVersion: "1.2.3",
      dateBucket: "2026-03-18",
      destinationRepo: "acme/target",
    });
  });

  it("trims the base url before issuing search and telemetry requests", async () => {
    const server = await startHttpServer(async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.method === "GET" && req.url === "/api/search?q=triage") {
        res.end(
          JSON.stringify({
            query: "triage",
            count: 0,
            results: [],
          }),
        );
        return;
      }

      if (req.method === "POST" && req.url === "/api/telemetry/install") {
        res.statusCode = 204;
        res.end();
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    });

    const client = createOpenCiApiClient({
      baseUrl: `  ${server.url}/  `,
    });

    await expect(client.search("triage")).resolves.toEqual({
      query: "triage",
      count: 0,
      results: [],
    });

    await expect(
      client.trackInstall({
        event: "install_success",
        slug: "github/acme/workflows/pr-review",
        cliVersion: "1.2.3",
        dateBucket: "2026-03-18",
        destinationRepo: "acme/target",
      }),
    ).resolves.toBeUndefined();

    expect(server.requests).toHaveLength(2);
    expect(server.requests[0]!.url).toBe("/api/search?q=triage");
    expect(server.requests[1]!.url).toBe("/api/telemetry/install");
    expect(JSON.parse(server.requests[1]!.body)).toEqual({
      event: "install_success",
      slug: "github/acme/workflows/pr-review",
      cliVersion: "1.2.3",
      dateBucket: "2026-03-18",
      destinationRepo: "acme/target",
    });
  });
});
