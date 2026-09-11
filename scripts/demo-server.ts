import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { demoConfig } from "../src/platform/demo-config";
import { demoGateway } from "../src/platform/demo-gateway";
import { beginDemoLogin, finishDemoLogin, loginCookie } from "../src/platform/demo-auth";
import { endSession, resolveIdentity, sessionCookie } from "../src/platform/identity";
import { closeDatabase } from "../src/platform/database";
import { AppError } from "../src/platform/errors";

const config = demoConfig();
process.env.PPO_LOCAL_GATEWAY = randomBytes(32).toString("hex");
const { default: next } = await import("next");
const app = next({ dev: false, hostname: "0.0.0.0", port: config.port });
await app.prepare();
const handler = app.getRequestHandler();
const gateway = demoGateway({
  origin: config.origin, gatewayKey: process.env.PPO_LOCAL_GATEWAY,
  sessionCookie, loginCookie, beginLogin: beginDemoLogin, finishLogin: finishDemoLogin,
  endSession, resolveIdentity, handleApplication: handler,
});
const server = createServer((req, res) => {
  void gateway(req, res).catch(error => {
    if (!res.headersSent) res.writeHead(error instanceof AppError ? error.status : 503, { "Content-Type": "text/plain" });
    res.end("Unable to complete this request. Return to the demo and try again, or contact its owner.");
    // OAuth URLs, tokens, SQL, connection strings and error objects never enter logs.
    console.error("PPO demo request could not complete.");
  });
});
server.requestTimeout = 15000;
server.listen(config.port, "0.0.0.0", () => console.log("Powerplants One private demo listening."));
for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => {
  server.close(() => { void app.close().then(closeDatabase).then(() => process.exit(0)); });
});
