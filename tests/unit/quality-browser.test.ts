import assert from "node:assert/strict";
import { test } from "node:test";
import { call } from "../helpers/quality-browser";

test("quality-browser call retries one transient socket reset before succeeding", async () => {
  let attempts = 0;
  const waits: number[] = [];
  const response = {
    json: async () => ({ ok: true }),
    ok: () => true,
    headers: () => ({ "cache-control": "private, no-store" }),
  };
  const page = {
    request: {
      fetch: async () => {
        attempts += 1;
        if (attempts === 1)
          throw Object.assign(new Error("apiRequestContext.fetch: socket hang up"), { code: "ECONNRESET" });
        return response;
      },
    },
    waitForTimeout: async (ms: number) => {
      waits.push(ms);
    },
  };

  assert.deepEqual(await call(page as never, "local-session", { profile: "coordinator" }), { ok: true });
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [250]);
});

test("quality-browser call retries the Playwright socket hang up shape without a code field", async () => {
  let attempts = 0;
  const waits: number[] = [];
  const response = {
    json: async () => ({ ok: true }),
    ok: () => true,
    headers: () => ({ "cache-control": "private, no-store" }),
  };
  const page = {
    request: {
      fetch: async () => {
        attempts += 1;
        if (attempts === 1)
          throw new Error("apiRequestContext.fetch: socket hang up");
        return response;
      },
    },
    waitForTimeout: async (ms: number) => {
      waits.push(ms);
    },
  };

  assert.deepEqual(await call(page as never, "local-session", { profile: "coordinator" }), { ok: true });
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [250]);
});

test("quality-browser call does not retry unrelated request errors", async () => {
  let attempts = 0;
  const waits: number[] = [];
  const page = {
    request: {
      fetch: async () => {
        attempts += 1;
        throw new Error("synthetic socket hang up");
      },
    },
    waitForTimeout: async (ms: number) => {
      waits.push(ms);
    },
  };

  await assert.rejects(
    () => call(page as never, "local-session", { profile: "coordinator" }),
    /synthetic socket hang up/,
  );
  assert.equal(attempts, 1);
  assert.deepEqual(waits, []);
});
