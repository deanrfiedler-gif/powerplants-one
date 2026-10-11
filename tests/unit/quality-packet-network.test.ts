import assert from "node:assert/strict";
import test from "node:test";
import { createConnection, createServer, type Socket } from "node:net";
import { once } from "node:events";
import { packetCommands, relayPort, startRelay } from "../../scripts/quality-packet-network";

test("opaque relay handles fragmented and pipelined SOCKS handshakes, exact bidirectional bytes and rejects unrelated targets", async () => {
  const target = createServer(socket => socket.pipe(socket));
  target.listen(0, "127.0.0.1"); await once(target, "listening");
  const address = target.address(); assert.ok(address && typeof address !== "string");
  // Use a reserved test endpoint; no kernel mutation.
  const listener = await startRelay(relayPort(0), address.port);
  const clients: Socket[] = [];
  const connect = async () => { const socket = createConnection({ host: "127.0.0.1", port: relayPort(0) }); clients.push(socket); await once(socket, "connect"); return socket; };
  const request = Buffer.from([5, 1, 0, 1, 127, 0, 0, 1, address.port >> 8, address.port & 255]);
  try {
    const socket = await connect();
    const chunks: Buffer[] = [];
    socket.on("data", chunk => chunks.push(chunk));
    socket.write(Buffer.from([5])); await new Promise(r => setTimeout(r, 10));
    const first = once(socket, "data"); socket.write(Buffer.from([1, 0])); await first;
    assert.deepEqual(Buffer.concat(chunks), Buffer.from([5, 0]));
    const payload = Buffer.alloc(128000, 97);
    // The buffered prefix must be forwarded exactly once; pipes must apply backpressure.
    socket.write(Buffer.concat([request, payload.subarray(0, 100)]));
    socket.write(payload.subarray(100));
    const deadline = Date.now() + 3000;
    while (Buffer.concat(chunks).length < payload.length + 12 && Date.now() < deadline) await new Promise(r => setTimeout(r, 10));
    const received = Buffer.concat(chunks);
    assert.equal(received.length, payload.length + 12); assert.deepEqual(received.subarray(12), payload);
    assert.equal(listener.stats.uploaded_bytes, payload.length); assert.equal(listener.stats.downloaded_bytes, payload.length);
    for (const wrong of [Buffer.from([5, 1, 0, 1, 1, 2, 3, 4, address.port >> 8, address.port & 255]), Buffer.from([5, 1, 0, 1, 127, 0, 0, 1, 0, 1])]) {
      const refused = await connect(); const closed = once(refused, "close"); refused.resume(); refused.write(Buffer.concat([Buffer.from([5, 1, 0]), wrong])); await closed;
    }
    assert.equal(listener.stats.connected, 1); assert.equal(listener.stats.rejected, 2);
  } finally {
    for (const client of clients) client.destroy(); await listener.close(); await new Promise<void>(resolve => target.close(() => resolve()));
  }
});

test("packet plan has independent capped classes in both directions with no all-traffic delay", () => {
  const commands = packetCommands(10);
  const capped = commands.filter(c => c[0] === "class" && c.includes("64k"));
  assert.equal(capped.length, 20);
  assert.equal(new Set(capped.map(c => c[c.indexOf("classid") + 1])).size, 20);
  assert.equal(capped.filter(c => c.includes("10mbit")).length, 10);
  assert.equal(capped.filter(c => c.includes("5mbit")).length, 10);
  const filters = commands.filter(c => c[0] === "filter");
  for (let user = 0; user < 10; user++) assert.equal(filters.filter(c => c.includes(String(relayPort(user)))).length, 2);
  assert.ok(filters.every(c => c.includes("127.0.0.1/32") && c.includes("0xffff")));
  assert.equal(commands.filter(c => c.includes("netem") && c.includes("20ms")).length, 20);
  assert.throws(() => packetCommands(2)); assert.throws(() => relayPort(10));
});
