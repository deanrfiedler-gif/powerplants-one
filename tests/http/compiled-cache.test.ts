import assert from "node:assert/strict";
import { test } from "node:test";
import { localConfig } from "../../src/platform/config";

// The maintained HTTP CI job serves the compiled application.
test("compiled public chunks cache while business, error and gateway responses stay private", async () => {
  const origin = localConfig().origin;
  const page = await fetch(`${origin}/customers`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("cache-control") ?? "", /no-store/);
  const html = await page.text();
  const assets = [
    ...new Set(
      html.match(/\/_next\/static\/chunks\/[A-Za-z0-9._-]+\.(?:js|css)/g),
    ),
  ];
  assert.ok(assets.some((p) => p.endsWith(".js")));
  assert.ok(assets.some((p) => p.endsWith(".css")));
  for (const path of assets) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.match(
      response.headers.get("cache-control") ?? "",
      /public.*max-age=31536000.*immutable/,
      path,
    );
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  const head = await fetch(origin + assets[0], { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.match(head.headers.get("cache-control") ?? "", /immutable/);
  const query = await fetch(origin + assets[0] + "?synthetic_probe=1");
  assert.equal(query.status, 200);
  assert.match(query.headers.get("cache-control") ?? "", /immutable/);
  const denied = await fetch(origin + assets[0], {
    headers: { "X-PPO-Local-Gateway": "forged" },
  });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("cache-control"), "no-store");
  const wrongOrigin = await fetch(origin + assets[0], {
    headers: { Origin: "https://remote.example" },
  });
  assert.equal(wrongOrigin.status, 403);
  assert.equal(wrongOrigin.headers.get("cache-control"), "no-store");
  const method = await fetch(origin + assets[0], { method: "POST" });
  assert.ok(method.status >= 400);
  assert.match(method.headers.get("cache-control") ?? "", /no-store/);
  const login = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile: "coordinator" }),
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("cache-control") ?? "", /no-store/);
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  for (const path of [
    "/api/v1/local-session",
    "/api/v1/crm/directory?kind=organisations",
    "/api/v1/shell/context",
    "/customers",
  ]) {
    const response = await fetch(origin + path, {
      headers: { Cookie: cookie },
    });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/, path);
    assert.doesNotMatch(
      response.headers.get("cache-control") ?? "",
      /public|immutable/,
      path,
    );
  }
  for (const path of [
    "/api/v1/local-session",
    "/api/v1/crm/directory?kind=organisations",
    "/brand/powerplants-logo-green-white.png",
    "/_next/static/chunks/absent-synthetic-test.js",
    "/_next/static/chunks/absent-synthetic-test.css",
    "/_next/static/chunks/absent-synthetic-test.map",
    "/_next/static/chunks/%2e%2e%2fprivate.js",
    "/_next/static/chunks/%252e%252e%252fprivate.js",
  ]) {
    const response = await fetch(origin + path);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/, path);
    assert.doesNotMatch(
      response.headers.get("cache-control") ?? "",
      /public|immutable/,
      path,
    );
  }
});
