import { test } from "node:test";
import assert from "node:assert/strict";
import { netlogMetadata } from "../../scripts/netlog-metadata";

test("NetLog metadata keeps socket linkage and timings while excluding sensitive and unknown fields", () => {
  const secret = "PRIVATE_CANARY";
  const result = netlogMetadata({
    constants: { logEventTypes: { URL_REQUEST_START_JOB: 1, SOCKET_BYTES_RECEIVED: 2 }, logSourceType: { URL_REQUEST: 1, SOCKET: 2 }, logEventPhase: { PHASE_BEGIN: 1 }, timeTickOffset: "1234", clientInfo: { command_line: secret } },
    events: [
      { type: 1, phase: 1, time: "25", source: { id: 10, type: 1 }, params: { url: `http://127.0.0.1:3000/_next/static/chunks/app.js?token=${secret}`, source_dependency: { id: 20, type: 2, secret }, headers: [`cookie: ${secret}`], body: secret, status_code: 200, net_error: -7 } },
      { type: 2, time: "26", source: { id: 20, type: 2 }, params: { byte_count: 512, bytes: secret, result: secret, url: `https://external.invalid/${secret}.js` } },
      { type: 1, params: { url: `http://127.0.0.1:3000/api/v1/customers/${secret}` } },
      { type: 1, params: { url: `http://${secret}@127.0.0.1:3000/_next/static/chunks/app.js` } },
    ],
  });
  assert.equal(result.events[0].asset_path, "/_next/static/chunks/app.js");
  assert.equal(result.events[0].dependency_id, 20);
  assert.equal(result.events[1].source_id, 20);
  assert.equal(result.events[1].byte_count, 512);
  assert.equal(result.events[0].time_ms, 25);
  assert.equal(result.time_tick_offset_ms, 1234);
  assert.equal(result.events[0].status_code, 200);
  assert.equal(result.events[0].net_error, -7);
  assert.equal(result.truncated, false);
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.ok(!JSON.stringify(result).includes("external.invalid"));
  assert.throws(() => netlogMetadata({ events: [] }), /Invalid NetLog schema/);
});

test("NetLog event cap explicitly retains incomplete coverage as a limitation", () => {
  const result = netlogMetadata({ constants: { logEventTypes: { SOCKET_BYTES_RECEIVED: 1 }, logSourceType: { SOCKET: 1 } }, events: Array(100001).fill({}) });
  assert.equal(result.original_event_count, 100001);
  assert.equal(result.retained_event_count, 100000);
  assert.equal(result.truncated, true);
});
