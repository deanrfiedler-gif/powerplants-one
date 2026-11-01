import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import type { Page, Request, Response } from "@playwright/test";
import { currentResourceRead } from "../helpers/current-resource-read";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}
function read(path = "/api/v1/sales/aftercare/synthetic", method = "GET", status = 200) {
  const headers = deferred<Response | null>(), body = deferred<Error | null>();
  const response = { finished: () => body.promise, status: () => status } as Response;
  const request = { method: () => method, url: () => `http://localhost${path}`, response: () => headers.promise } as Request;
  return { request, response, headers, body };
}
function fixture() {
  const page = new EventEmitter();
  return { page, tracker: currentResourceRead(page as unknown as Page, "/api/v1/sales/aftercare/synthetic") };
}
const turn = () => new Promise<void>(resolve => setImmediate(resolve));

test("readiness follows a newer request that begins while the older body is pending", async () => {
  const { page, tracker } = fixture(), old = read(), current = read();
  page.emit("request", old.request);
  let settled = false;
  const ready = tracker.finished().then(r => { settled = true; return r; });
  old.headers.resolve(old.response);
  await turn();
  page.emit("request", current.request);
  old.body.resolve(null);
  await turn();
  assert.equal(settled, false, "an obsolete HTTP 200 must not start the render deadline");
  current.headers.resolve(current.response);
  await turn();
  assert.equal(settled, false, "response headers alone do not complete a read");
  current.body.resolve(null);
  assert.equal(await ready, current.response);
  tracker.dispose();
  assert.equal(page.listenerCount("request"), 0);
});

test("a current refusal remains the result; a later obsolete success cannot replace it", async () => {
  const { page, tracker } = fixture(), old = read(), current = read(undefined, "GET", 403);
  page.emit("request", old.request);
  page.emit("request", current.request);
  const ready = tracker.finished();
  current.headers.resolve(current.response);
  current.body.resolve(null);
  assert.equal((await ready).status(), 403);
  old.headers.resolve(old.response);
  old.body.resolve(null);
  assert.equal((await tracker.finished()).status(), 403);
  tracker.dispose();
});

test("a newer completed read is usable even while its obsolete predecessor remains stalled", { timeout: 5000 }, async () => {
  const { page, tracker } = fixture(), old = read(), current = read();
  page.emit("request", old.request);
  const ready = tracker.finished();
  page.emit("request", current.request);
  current.headers.resolve(current.response);
  current.body.resolve(null);
  assert.equal(await ready, current.response);
  tracker.dispose();
});

test("other resources and commands do not replace the record GET; failed current reads reject", async () => {
  const { page, tracker } = fixture(), current = read();
  page.emit("request", current.request);
  page.emit("request", read("/api/v1/sales/aftercare/synthetic/options").request);
  page.emit("request", read(undefined, "POST").request);
  const ready = assert.rejects(tracker.finished(), /Current resource read did not complete/);
  current.headers.resolve(null);
  await ready;
  tracker.dispose();
});
