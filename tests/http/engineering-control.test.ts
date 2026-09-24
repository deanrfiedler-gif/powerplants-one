import assert from "node:assert/strict";
import { test } from "node:test";
import {
  command,
  saveFields,
  basisContent,
  seedControlContext,
} from "../helpers/engineering-control";
import type { SignIn } from "../helpers/engineering-materials";
const origin = process.env.PPO_HTTP_ORIGIN ?? "http://127.0.0.1:3000";
if (new URL(origin).hostname !== "127.0.0.1")
  throw Error("Synthetic loopback only");
const cookies = new Map<string, string>();
const signIn: SignIn = async (profile) => {
  if (!cookies.has(profile)) {
    const r = await fetch(`${origin}/api/v1/local-session`, {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    assert.equal(r.status, 200);
    cookies.set(profile, r.headers.get("set-cookie")!.split(";")[0]);
  }
  return async (path, body) => {
    const r = await fetch(`${origin}/api/v1/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        cookie: cookies.get(profile)!,
        origin,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    assert.equal(r.headers.get("cache-control"), "private, no-store");
    return { status: r.status, body: await r.json() };
  };
};
test("native Engineering HTTP contract: private reads, origin/type guards, exact replay and wrong-company denial", async () => {
  const s = await seedControlContext(signIn, " native HTTP"),
    author = await signIn("materials-author"),
    viewer = await signIn("materials-viewer"),
    other = await signIn("second-company"),
    original = command(saveFields("basis", basisContent(s.source)));
  const first = await author(s.base, original),
    again = await author(s.base, original);
  assert.equal(first.status, 201, JSON.stringify(first.body));
  assert.equal(again.status, 200);
  assert.deepEqual(again.body, first.body);
  assert.equal(
    (await author(s.base, { ...original, title: "Changed retry" })).status,
    409,
  );
  assert.equal((await author(s.base + "?colour=green")).status, 422);
  assert.equal(
    (await viewer(s.base, command(saveFields("basis", basisContent(s.source)))))
      .status,
    403,
  );
  assert.equal((await other(s.base)).status, 404);
  const url = `${origin}/api/v1/${s.base}`,
    cookie = cookies.get("materials-author")!;
  assert.equal((await fetch(url)).status, 401);
  assert.equal(
    (
      await fetch(url, {
        method: "POST",
        headers: { cookie, "Content-Type": "application/json" },
        body: JSON.stringify(original),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(url, {
        method: "POST",
        headers: { cookie, origin, "Content-Type": "text/plain" },
        body: "SYN",
      })
    ).status,
    422,
  );
  assert.equal(
    (await author(`operations/${original.operation_id}`)).status,
    200,
  );
});
