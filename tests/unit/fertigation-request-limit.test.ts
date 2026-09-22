import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import type { AddressInfo } from "node:net";
import {
  requireFertigationBodyLength,
  readFertigationJson,
  REJECTION_DRAIN_BYTES,
} from "../../src/estimating/fertigation/request-limit";
import { PORTABLE_BYTES } from "../../src/estimating/fertigation/portable-limits";
const ordinary = 2 * 1024 * 1024;
const code = (wanted: string) => (e: unknown) =>
  (e as { code?: string }).code === wanted;
function bodyStream(parts: Uint8Array[]) {
  let pulled = 0,
    cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(c) {
      const part = parts[pulled++];
      if (part) c.enqueue(part);
      else c.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  return { body, state: () => ({ pulled, cancelled }) };
}
test("FN-T41 native reader drains known and chunked oversized uploads without retaining or cancelling their response transport", async () => {
  for (const declared of [true, false]) {
    const source = bodyStream([
      new Uint8Array(1_000_000),
      new Uint8Array(1_000_000),
      new Uint8Array(1_000_000),
    ]);
    await assert.rejects(
      readFertigationJson(
        {
          headers: new Headers(declared ? { "content-length": "3000000" } : {}),
          body: source.body,
        },
        ordinary,
      ),
      code("PayloadTooLarge"),
    );
    assert.deepEqual(source.state(), { pulled: 4, cancelled: false });
    assert.equal(source.body.locked, false);
  }
  const valid = bodyStream([Buffer.from('{"zero":0}')]);
  assert.deepEqual(
    await readFertigationJson(
      { headers: new Headers(), body: valid.body },
      ordinary,
    ),
    { zero: 0 },
  );
  const malformed = bodyStream([Buffer.from("{broken")]);
  await assert.rejects(
    readFertigationJson(
      { headers: new Headers(), body: malformed.body },
      ordinary,
    ),
    code("InvalidJson"),
  );
  assert.equal(malformed.state().cancelled, false);
});
test("FN-T41 excessive transport is cancelled at the hard discard ceiling without accepting bytes", async () => {
  const source = bodyStream([
    new Uint8Array(REJECTION_DRAIN_BYTES + 1),
    new Uint8Array(1),
  ]);
  await assert.rejects(
    readFertigationJson(
      { headers: new Headers(), body: source.body },
      ordinary,
    ),
    code("PayloadTooLarge"),
  );
  assert.equal(source.state().cancelled, true);
  assert.equal(source.body.locked, false);
});
test(
  "FN-T41 stalled native upload deadline cancels its pending read and releases the stream lock",
  { timeout: 12000 },
  async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    });
    await assert.rejects(
      readFertigationJson({ headers: new Headers(), body }, ordinary),
      code("PayloadReadTimeout"),
    );
    assert.equal(cancelled, true);
    assert.equal(body.locked, false);
  },
);
test("FN-T41 native HTTP rejects 2-9 MiB uploads with complete actionable JSON before closing the connection", async () => {
  const server = createServer((req, res) => {
    void (async () => {
      const headers = new Headers();
      if (req.headers["content-length"])
        headers.set("content-length", req.headers["content-length"]);
      try {
        await readFertigationJson(
          { headers, body: Readable.toWeb(req) as ReadableStream<Uint8Array> },
          req.url === "/portable" ? PORTABLE_BYTES : ordinary,
        );
        res.writeHead(200);
        res.end("{}");
      } catch (error) {
        const e = error as { status: number; code: string; message: string },
          body = JSON.stringify({ code: e.code, message: e.message });
        res.writeHead(e.status, {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
          connection: "close",
        });
        res.end(body);
      }
    })();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    for (const [path, size] of [
      ["/ordinary", 2_202_567],
      ["/ordinary", 3_874_545],
      ["/portable", PORTABLE_BYTES + 1],
    ] as const) {
      const response = await fetch(origin + path, {
        method: "POST",
        headers: { "content-type": "application/json", connection: "close" },
        body: "x".repeat(size),
      });
      assert.equal(response.status, 422);
      const body = await response.json();
      assert.equal(body.code, "PayloadTooLarge");
      assert.match(body.message, /Reduce the file or scope/);
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
});
test("FN-T41 native declared body bounds distinguish ordinary and portable commands before opening the stream", () => {
  for (const cap of [ordinary, PORTABLE_BYTES]) {
    assert.doesNotThrow(() => requireFertigationBodyLength(String(cap), cap));
    assert.throws(
      () => requireFertigationBodyLength(String(cap + 1), cap),
      code("PayloadTooLarge"),
    );
  }
  assert.throws(
    () => requireFertigationBodyLength(String(ordinary + 1), ordinary),
    code("PayloadTooLarge"),
  );
  assert.doesNotThrow(() =>
    requireFertigationBodyLength(String(ordinary + 1), PORTABLE_BYTES),
  );
});
test("FN-T41 missing content length keeps streamed validation; malformed declarations cannot bypass preflight", () => {
  assert.doesNotThrow(() => requireFertigationBodyLength(null, ordinary));
  assert.doesNotThrow(() => requireFertigationBodyLength("0", ordinary));
  for (const length of [
    "",
    "-1",
    "0.1",
    "Infinity",
    "NaN",
    "1e3",
    "+1",
    "1,2",
    "9007199254740992",
  ])
    assert.throws(
      () => requireFertigationBodyLength(length, ordinary),
      code("InvalidContentLength"),
    );
});
