import https from "node:https";
import { getCACertificates } from "node:tls";
import { AdapterError } from "../model";

export const anthropicMessagesURL = "https://api.anthropic.com/v1/messages";
export type ClaudeTransport = (url: string, init: RequestInit) => Promise<Response>;
const maxResponseBytes = 131_072;

// Owned Node HTTPS connection: no global fetch dispatcher, environment proxy, redirects,
// custom CA or inherited agent. SDK never receives an unrestricted transport.
export const anthropicHTTPS: ClaudeTransport = async (url, init) => {
  if (url !== anthropicMessagesURL || init.method !== "POST" || typeof init.body !== "string")
    throw new AdapterError("Unavailable");
  if (init.signal?.aborted) throw new AdapterError("Timeout");
  return new Promise<Response>((resolve, reject) => {
    const req = https.request(anthropicMessagesURL, {
      method: "POST", headers: Object.fromEntries(new Headers(init.headers)),
      ca: getCACertificates("bundled"), agent: false, rejectUnauthorized: true, minVersion: "TLSv1.2", signal: init.signal ?? undefined,
    }, res => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      res.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > maxResponseBytes) { res.destroy(); req.destroy(); reject(new AdapterError("MalformedOutput", null, true)); }
        else chunks.push(chunk);
      });
      res.on("error", () => reject(new AdapterError("Unavailable", null, true)));
      res.on("end", () => {
        const status = res.statusCode ?? 502;
        const headers = new Headers();
        // No response identifiers, cookies or diagnostic headers are forwarded or persisted.
        headers.set("content-type", String(res.headers["content-type"] ?? "application/json"));
        if (res.headers["retry-after"]) headers.set("retry-after", String(res.headers["retry-after"]));
        try { resolve(new Response(Buffer.concat(chunks), { status, headers })); }
        catch { reject(new AdapterError("MalformedOutput", null, true)); }
      });
    });
    req.on("error", () => reject(new AdapterError(init.signal?.aborted ? "Timeout" : "Unavailable", null, true)));
    req.end(init.body);
  });
};
