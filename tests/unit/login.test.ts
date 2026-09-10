import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer, request } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import * as oidc from "openid-client";
import { demoGateway } from "../../src/platform/demo-gateway";
import { AppError } from "../../src/platform/errors";
import { exchangeDemoAuthorization } from "../../src/platform/demo-auth";
import { loginFailure, loginState, renderLoginPage } from "../../src/login/login-page";

const origin = "https://ppo-login.example.invalid";
async function fixture(run: (f: Awaited<ReturnType<typeof start>>) => Promise<void>) {
  const f = await start();
  try { await run(f); } finally { f.server.closeAllConnections(); await new Promise<void>(resolve => f.server.close(() => resolve())); }
}
async function start() {
  let beginError: unknown, finishError: unknown, beginCount = 0, appCount = 0;
  let callbackTokens: unknown[] = [], ended: string | undefined;
  const gateway = demoGateway({
    origin, gatewayKey: "synthetic-gateway", sessionCookie: "__Host-ppo_session", loginCookie: "__Host-ppo_login",
    beginLogin: async () => { beginCount++; if (beginError) throw beginError; return { token: "a".repeat(64), url: "https://microsoft.example.invalid/authorize?state=synthetic" }; },
    finishLogin: async (_url, login, session) => { callbackTokens = [login, session]; if (finishError) throw finishError; return "b".repeat(64); },
    endSession: async token => { ended = token; },
    resolveIdentity: async token => { if (token !== "valid") throw new AppError(401, "AuthenticationRequired", "Internal fixture diagnostic"); return {}; },
    handleApplication: async (req, res) => { appCount++; assert.equal(req.headers["x-ppo-local-gateway"], "synthetic-gateway"); res.end("Synthetic authorised application"); },
  });
  const server = createServer((req, res) => { void gateway(req, res).catch(() => { res.writeHead(503); res.end("Test handler error"); }); });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const port = (server.address() as AddressInfo).port;
  const call = (path: string, method = "GET", headers: Record<string, string | undefined> = {}) => new Promise<{ status: number; headers: import("node:http").IncomingHttpHeaders; body: string }>((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port, path, method, headers: { host: new URL(origin).host, "x-forwarded-proto": "https", ...headers } }, res => {
      let body = ""; res.setEncoding("utf8"); res.on("data", value => { body += value; });
      res.on("end", () => resolve({ status: res.statusCode!, headers: res.headers, body }));
    }); req.on("error", reject); req.end();
  });
  return { server, call, failBegin: (error: unknown) => { beginError = error; }, failFinish: (error: unknown) => { finishError = error; },
    counts: () => ({ beginCount, appCount }), callback: () => callbackTokens, ended: () => ended };
}

test("public login and protected routes retain distinct HTTP and access boundaries", async () => fixture(async f => {
  const login = await f.call("/login?returnTo=https://attacker.invalid&status=%3Cscript%3E");
  assert.equal(login.status, 200); assert.match(login.body, /Welcome back/);
  assert.doesNotMatch(login.body, /attacker.invalid|<script>\s*alert|Design preview|Choose a demonstration identity/);
  const policy = login.headers["content-security-policy"]; assert.ok(typeof policy === "string");
  assert.match(policy, /script-src 'sha256-/);
  assert.doesNotMatch(policy, /unsafe-inline/);
  assert.match(policy, /form-action 'self' https:\/\/login\.microsoftonline\.com; frame-ancestors 'none'/);
  assert.equal(login.headers["cache-control"], "private, no-store");
  const protectedPage = await f.call("/crm/opportunities"); assert.equal(protectedPage.status, 401); assert.match(protectedPage.body, /Welcome back/);
  const expired = await f.call("/crm/opportunities", "GET", { cookie: "__Host-ppo_session=expired" });
  assert.equal(expired.status, 401); assert.match(expired.body, /Your session has expired/);
  const api = await f.call("/api/v1/crm/opportunities"); assert.equal(api.status, 401); assert.equal(JSON.parse(api.body).code, "AuthenticationRequired");
  assert.equal(f.counts().appCount, 0);
  assert.equal((await f.call("/crm/opportunities", "GET", { cookie: "__Host-ppo_session=valid" })).body, "Synthetic authorised application");
  for (const [path, method] of [["/offline/index.html", "GET"], ["/sw.js", "GET"], ["/api/v1/local-session", "POST"]])
    assert.equal((await f.call(path, method, { cookie: "__Host-ppo_session=valid", origin })).status, 403);
  assert.equal(f.counts().appCount, 1);
  for (const headers of [{ host: "attacker.invalid" }, { "x-ppo-local-gateway": "forged" }, { "x-forwarded-proto": "http" }])
    assert.equal((await f.call("/login", "GET", headers)).status, 403);
}));

test("native Microsoft handoff, callback and logout preserve fixed destinations and secure cookies", async () => fixture(async f => {
  const begin = await f.call("/auth/login?returnTo=https://attacker.invalid");
  assert.equal(begin.status, 302); assert.equal(begin.headers.location, "https://microsoft.example.invalid/authorize?state=synthetic");
  assert.match(begin.headers["set-cookie"]![0], /Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
  const callback = await f.call("/auth/callback?code=synthetic", "GET", { cookie: "__Host-ppo_login=attempt; __Host-ppo_session=previous", "sec-fetch-site": "cross-site" });
  assert.deepEqual(f.callback(), ["attempt", "previous"]);
  assert.equal(callback.status, 303); assert.equal(callback.headers.location, origin + "/crm/opportunities");
  assert.match(callback.headers["set-cookie"]![0], /Max-Age=0/); assert.match(callback.headers["set-cookie"]![1], /Max-Age=3600/);
  assert.equal((await f.call("/auth/logout", "POST", { origin: "https://attacker.invalid" })).status, 403);
  const logout = await f.call("/auth/logout", "POST", { origin, cookie: "__Host-ppo_session=valid" });
  assert.equal(f.ended(), "valid"); assert.equal(logout.status, 303); assert.equal(logout.headers.location, origin + "/login");
  assert.match(logout.headers["set-cookie"]![0], /Max-Age=0/);
}));

test("callback failures become bounded recovery pages without reflecting provider details", async () => fixture(async f => {
  for (const [error, state] of [
    [new AppError(403, "DemoAccessDenied", "private tester details"), "denied"],
    [new AppError(401, "LoginExpired", "private attempt"), "expired"],
    [new AppError(401, "LoginCancelled", "private description"), "cancelled"],
    [new Error("secret provider or database details"), "unavailable"],
  ] as const) {
    f.failFinish(error);
    const response = await f.call("/auth/callback?error=access_denied&error_description=SECRET&code=SECRET");
    assert.equal(response.status, 303); assert.equal(response.headers.location, `${origin}/login?status=${state}`);
    assert.match(response.headers["set-cookie"]![0], /Max-Age=0/);
    assert.doesNotMatch(response.body + response.headers.location, /SECRET|private|secret provider/);
    const page = await f.call(`/login?status=${state}`); assert.equal(page.status, 200);
    assert.match(page.body, state === "denied" ? /Use another Microsoft account/ : /Sign in|Sign-in/);
  }
  f.failBegin(new Error("SECRET endpoint failure"));
  const unavailable = await f.call("/auth/login"); assert.equal(unavailable.status, 503);
  assert.match(unavailable.body, /Try again with Microsoft/); assert.doesNotMatch(unavailable.body, /SECRET/);
}));

test("login rate boundary still limits provider attempts and offers honest recovery", async () => fixture(async f => {
  for (let i = 0; i < 30; i++) assert.equal((await f.call("/auth/login")).status, 302);
  const limited = await f.call("/auth/login"); assert.equal(limited.status, 429);
  assert.equal(limited.headers["retry-after"], "600"); assert.match(limited.body, /wait 10 minutes/);
  assert.equal(f.counts().beginCount, 30);
}));

test("only state-validated provider cancellation receives cancelled presentation", async () => {
  const config = new oidc.Configuration({ issuer: "https://identity.example.invalid", authorization_endpoint: "https://identity.example.invalid/authorize", token_endpoint: "https://identity.example.invalid/token" }, "synthetic-client");
  const checks = { expectedState: "expected-state", expectedNonce: "synthetic-nonce", pkceCodeVerifier: "synthetic-verifier", idTokenExpected: true };
  await assert.rejects(exchangeDemoAuthorization(config, new URL("https://ppo.example.invalid/auth/callback?error=access_denied&state=expected-state"), checks), error => loginFailure(error) === "cancelled");
  for (const query of ["error=access_denied&state=wrong", "error=access_denied", "error=server_error&state=expected-state"])
    await assert.rejects(exchangeDemoAuthorization(config, new URL(`https://ppo.example.invalid/auth/callback?${query}`), checks), error => loginFailure(error) === "unavailable");
});

test("local entry keeps Microsoft disabled; query states cannot inject markup or authority", () => {
  const local = renderLoginPage("ready", true);
  assert.match(local, /Local prototype · Fictional records/); assert.match(local, /href="\/work">Open local prototype/);
  assert.match(local, /id="sign-in"[^>]+ disabled/); assert.doesNotMatch(local, /Design preview|{{[A-Z_]+}}/);
  for (const query of ["status=__proto__", "status=denied&status=ready", "status=%3Cscript%3E"])
    assert.equal(loginState(new URLSearchParams(query)), "ready");
  assert.equal(loginState(new URLSearchParams("status=denied")), "denied");
});
