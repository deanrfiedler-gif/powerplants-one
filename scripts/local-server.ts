import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { localConfig } from "../src/platform/config";
import { proofDiagnosticsEnabled, proofEvent, proofPath, proofRequest as withProofRequest } from "../src/platform/proof-diagnostics";
import { runtimeSampler } from "../src/platform/proof-runtime";
const config = localConfig(); // Refuse unsafe configuration before build work or Next initialisation.
// Keep every process restart cold while allowing Turbopack to evict compiler
// memory to disk during this process. This path contains only derived dev
// compilation data; database records and retained evidence live elsewhere.
await rm(join(process.cwd(), ".next", "dev", "cache", "turbopack"), {
  recursive: true,
  force: true,
});
await import("./build-offline");
const { default: next } = await import("next");
process.env.PPO_LOCAL_GATEWAY = randomBytes(32).toString("hex");
const app = next({ dev: true, hostname: "127.0.0.1", port: config.port });
await app.prepare();
const handler = app.getRequestHandler();
let proofRequest = 0;
const server = createServer((req, res) => {
  const peer = req.socket.remoteAddress;
  if (
    !["127.0.0.1", "::ffff:127.0.0.1"].includes(peer ?? "") ||
    req.headers.host !== `127.0.0.1:${config.port}` ||
    Object.keys(req.headers).some(
      (h) =>
        h === "forwarded" ||
        h.startsWith("x-forwarded-") ||
        h === "x-ppo-local-gateway",
    ) ||
    (req.headers["sec-fetch-site"] &&
      !["same-origin", "none"].includes(
        String(req.headers["sec-fetch-site"]),
      )) ||
    (req.headers.origin && req.headers.origin !== config.origin)
  ) {
    res.writeHead(403, {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store",
    });
    res.end("Local synthetic access only.");
    return;
  }
  const requestId = ++proofRequest;
  const received = performance.now();
  const path = proofPath(req.url ?? "/other");
  proofEvent("http-received", { request_id: requestId, path, method: req.method === "GET" ? "GET" : req.method === "POST" ? "POST" : "other" });
  res.once("finish", () => proofEvent("http-finished", { request_id: requestId, path, elapsed_ms: performance.now() - received, status: res.statusCode }));
  res.once("close", () => { if (!res.writableFinished) proofEvent("http-closed-incomplete", { request_id: requestId, path, elapsed_ms: performance.now() - received }); });
  req.headers["x-ppo-local-gateway"] = process.env.PPO_LOCAL_GATEWAY;
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  void withProofRequest({ request_id: requestId, path }, () => handler(req, res)).catch(() => {
    proofEvent("http-handler-rejected", { request_id: requestId, path, elapsed_ms: performance.now() - received });
    if (!res.headersSent) res.writeHead(500);
    res.end("Unable to load this page.");
  });
});
server.requestTimeout = 15000;
if (proofDiagnosticsEnabled()) {
  const sample = runtimeSampler();
  const heartbeat = setInterval(() => proofEvent("server-runtime", sample()), 2000);
  heartbeat.unref();
  server.once("close", () => clearInterval(heartbeat));
}
server.listen(config.port, "127.0.0.1", () =>
  console.log(`Powerplants One — local synthetic only — ${config.origin}`),
);
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () =>
    server.close(() => {
      void app.close().then(() => process.exit(0));
    }),
  );
