import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import next from "next";
import { localConfig } from "../src/platform/config";
const config = localConfig(); // Validate before preparing Next or opening any socket.
process.env.PPO_LOCAL_GATEWAY = randomBytes(32).toString("hex");
const app = next({ dev: true, hostname: "127.0.0.1", port: config.port });
await app.prepare();
const handler = app.getRequestHandler();
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
  req.headers["x-ppo-local-gateway"] = process.env.PPO_LOCAL_GATEWAY;
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  void handler(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500);
    res.end("Unable to load this page.");
  });
});
server.requestTimeout = 15000;
server.listen(config.port, "127.0.0.1", () =>
  console.log(`Powerplants One — local synthetic only — ${config.origin}`),
);
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () =>
    server.close(() => {
      void app.close().then(() => process.exit(0));
    }),
  );
