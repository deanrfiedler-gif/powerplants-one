import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { netlogMetadata, streamNetlog } from "../../scripts/netlog-metadata";

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
  const socket = result.source_summaries.find(s => s.source_id === 20)!;
  assert.equal(socket.stages["SOCKET_BYTES_RECEIVED:UNKNOWN"].byte_count, 512);
  assert.equal(result.aggregated_packet_events, 1);
  assert.equal(result.events[0].time_ms, 25);
  assert.equal(result.time_tick_offset_ms, 1234);
  assert.equal(result.events[0].status_code, 200);
  assert.equal(result.events[0].net_error, -7);
  assert.equal(result.truncated, false);
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.ok(!JSON.stringify(result).includes("external.invalid"));
  assert.throws(() => netlogMetadata({ events: [] }), /Invalid NetLog schema/);
});

test("streaming NetLog preserves early source lifecycles, strips footer secrets and refuses incomplete capture", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ppo-netlog-unit-")), path = join(dir, "input.json");
  const constants = { logEventTypes: { URL_REQUEST_START_JOB: 1, SOCKET_BYTES_RECEIVED: 2 }, logSourceType: { URL_REQUEST: 1, SOCKET: 2 }, logEventPhase: { PHASE_BEGIN: 1 } };
  const first = { type: 1, phase: 1, time: "10", source: { id: 1, type: 1 }, params: { url: "http://127.0.0.1:3000/_next/static/app.js?PRIVATE_CANARY" } };
  const packet = (time: number) => ({ type: 2, time, source: { id: 2, type: 2 }, params: { byte_count: 1500, bytes: "PRIVATE_CANARY" } });
  const prefix = `{"constants":${JSON.stringify(constants)},\n"events": [\n`;
  try {
    await writeFile(path, prefix + [first, packet(11), packet(12)].map(e => JSON.stringify(e)).join(",\n") + '],\n"polledData":{"private":"PRIVATE_CANARY"}\n}\n');
    const result = await streamNetlog(path);
    assert.equal(result.original_event_count, 3);
    assert.equal(result.retained_event_count, 1);
    assert.equal(result.source_summaries[0].asset_path, "/_next/static/app.js");
    assert.equal(result.source_summaries[1].stages["SOCKET_BYTES_RECEIVED:UNKNOWN"].byte_count, 3000);
    assert.equal(result.source_summaries[1].first_ms, 11);
    assert.equal(result.source_summaries[1].last_ms, 12);
    assert.ok(!JSON.stringify(result).includes("PRIVATE_CANARY"));
    await writeFile(path, prefix + "]}\n");
    assert.equal((await streamNetlog(path)).original_event_count, 0);
    await writeFile(path, prefix + JSON.stringify(first) + ",\n");
    await assert.rejects(streamNetlog(path), /Incomplete NetLog capture/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("NetLog event cap explicitly retains incomplete coverage as a limitation", () => {
  const result = netlogMetadata({ constants: { logEventTypes: { SOCKET_BYTES_RECEIVED: 1 }, logSourceType: { SOCKET: 1 } }, events: Array(100001).fill({}) });
  assert.equal(result.original_event_count, 100001);
  assert.equal(result.retained_event_count, 100000);
  assert.equal(result.truncated, true);
});

test("packet floods retain the earliest request lifecycle and exact aggregate bytes", () => {
  const packet = { type: 2, time: 20, source: { id: 2, type: 2 }, params: { byte_count: 1500 } };
  const result = netlogMetadata({ constants: { logEventTypes: { URL_REQUEST_START_JOB: 1, SOCKET_BYTES_RECEIVED: 2 }, logSourceType: { URL_REQUEST: 1, SOCKET: 2 } }, events: [
    { type: 1, time: 10, source: { id: 1, type: 1 }, params: { url: "http://127.0.0.1:3000/_next/static/app.js" } },
    ...Array(100010).fill(packet),
  ] });
  assert.equal(result.events[0].asset_path, "/_next/static/app.js");
  assert.equal(result.source_summaries[0].first_ms, 10);
  assert.equal(result.source_summaries[1].stages["SOCKET_BYTES_RECEIVED:UNKNOWN"].byte_count, 150015000);
  assert.equal(result.aggregated_packet_events, 100010);
  assert.equal(result.truncated, false);
});
