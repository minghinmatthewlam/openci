import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

export interface CapturedRequest {
  method: string;
  url: string;
  body: string;
}

export interface TestHttpServer {
  close(): Promise<void>;
  requests: CapturedRequest[];
  url: string;
}

export async function startHttpServer(
  handler: (
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
    body: string,
    requests: CapturedRequest[],
  ) => void | Promise<void>,
): Promise<TestHttpServer> {
  const requests: CapturedRequest[] = [];
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks).toString("utf8");
    requests.push({
      method: req.method ?? "GET",
      url: req.url ?? "/",
      body,
    });
    await handler(req, res, body, requests);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test HTTP server.");
  }

  return {
    requests,
    url: `http://127.0.0.1:${address.port}`,
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    },
  };
}
