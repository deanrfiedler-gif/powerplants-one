import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createConnection, createServer, type Socket } from "node:net";
import { availableParallelism } from "node:os";

export const relayPort = (user: number) => { assert.ok(Number.isInteger(user) && user >= 0 && user < 10); return 23270 + user; };
export const relayProxy = (user: number) => ({ server: `socks5://127.0.0.1:${relayPort(user)}`, bypass: "<-loopback>" });

// An opaque, bounded SOCKS5 CONNECT relay; no HTTP parsing or payload logging.
export async function startRelay(port: number, targetPort: number) {
  assert.ok(Number.isInteger(targetPort) && targetPort > 0 && targetPort <= 65535 && targetPort !== port);
  const sockets = new Set<Socket>();
  const stats = { port, target_port: targetPort, accepted: 0, connected: 0, rejected: 0, errors: 0, uploaded_bytes: 0, downloaded_bytes: 0 };
  const own = (socket: Socket) => { sockets.add(socket); socket.once("close", () => sockets.delete(socket)); return socket; };
  const server = createServer(client => {
    own(client); stats.accepted++; client.setNoDelay(true);
    let pending = Buffer.alloc(0), phase = "greeting", upstream: Socket | undefined;
    const reject = () => { stats.rejected++; client.destroy(); upstream?.destroy(); };
    client.on("error", () => { stats.errors++; upstream?.destroy(); });
    client.once("close", () => upstream?.destroy());
    const handshake = (chunk: Buffer) => {
      pending = Buffer.concat([pending, chunk]);
      if (phase === "greeting") {
        if (pending.length < 2) return;
        if (pending[0] !== 5 || pending[1] < 1) return reject();
        const end = 2 + pending[1]; if (pending.length < end) return;
        if (!pending.subarray(2, end).includes(0)) return reject();
        client.write(Buffer.from([5, 0])); pending = pending.subarray(end); phase = "connect";
      }
      if (phase !== "connect" || pending.length < 5) return;
      if (pending[0] !== 5 || pending[1] !== 1 || pending[2] !== 0 || ![1, 3].includes(pending[3])) return reject();
      const domain = pending[3] === 3, end = domain ? 7 + pending[4] : 10;
      if (pending.length < end) return;
      const host = domain ? pending.subarray(5, end - 2).toString("ascii") : [...pending.subarray(4, 8)].join(".");
      if (!["127.0.0.1", "localhost"].includes(host) || pending.readUInt16BE(end - 2) !== targetPort) return reject();
      phase = "connecting"; client.pause(); client.off("data", handshake);
      const initial = pending.subarray(end); pending = Buffer.alloc(0);
      upstream = own(createConnection({ host: "127.0.0.1", port: targetPort })); upstream.setNoDelay(true);
      upstream.on("error", () => { stats.errors++; client.destroy(); });
      upstream.once("close", () => client.destroy());
      upstream.once("connect", () => {
        stats.connected++;
        client.write(Buffer.from([5, 0, 0, 1, 127, 0, 0, 1, 0, 0]));
        client.on("data", data => { stats.uploaded_bytes += data.length; });
        upstream!.on("data", data => { stats.downloaded_bytes += data.length; });
        if (initial.length) { stats.uploaded_bytes += initial.length; upstream!.write(initial); }
        client.pipe(upstream!); upstream!.pipe(client); client.resume();
      });
    };
    client.on("data", handshake);
  });
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", () => { server.off("error", reject); resolve(); }); });
  return { stats, async close() { for (const socket of sockets) socket.destroy(); await new Promise<void>(resolve => server.close(() => resolve())); } };
}

const tc = (...args: string[]) => execFileSync("sudo", ["-n", "tc", ...args], { encoding: "utf8" });
// iproute2 6.1 class output ignores -j. Retain its text and extract only explicit counters.
export function packetClassCounters(raw: string) {
  const rows = raw.split(/(?=^class )/m).filter(s => s.trim());
  const counters = rows.map(row => {
    const id = row.match(/^class htb (7abc:[0-9a-f]+)\b/);
    const sent = row.match(/^\s*Sent (\d+) bytes (\d+) pkt \(dropped (\d+),/m);
    assert.ok(id && sent, "Unknown tc class/statistics format; refuse inferred counters");
    return { handle: id[1], bytes: Number(sent[1]), packets: Number(sent[2]), dropped: Number(sent[3]) };
  });
  assert.equal(new Set(counters.map(c => c.handle)).size, counters.length, "Duplicate class statistics");
  return counters;
}
const snapshot = () => {
  const classText = tc("-s", "class", "show", "dev", "lo");
  return { qdisc: JSON.parse(tc("-j", "-s", "qdisc", "show", "dev", "lo")), classes: packetClassCounters(classText),
    class_text: classText, filter_text: tc("-s", "filter", "show", "dev", "lo", "parent", "7abc:") };
};
const classId = (user: number, direction: number) => `7abc:${(0x100 + user * 2 + direction).toString(16)}`;

export function packetCommands(users: number): string[][] {
  assert.ok(users === 1 || users === 10);
  const commands = [
    ["qdisc", "add", "dev", "lo", "root", "handle", "7abc:", "htb", "default", "1"],
    ["class", "add", "dev", "lo", "parent", "7abc:", "classid", "7abc:1", "htb", "rate", "10gbit", "ceil", "10gbit", "quantum", "65536"],
  ];
  for (let user = 0; user < users; user++) for (const direction of [0, 1]) {
    const id = classId(user, direction), rate = direction === 0 ? "10mbit" : "5mbit";
    commands.push(["class", "add", "dev", "lo", "parent", "7abc:", "classid", id, "htb", "rate", rate, "ceil", rate, "burst", "64k", "cburst", "64k", "quantum", "65536"]);
    commands.push(["qdisc", "add", "dev", "lo", "parent", id, "handle", `${(0x200 + user * 2 + direction).toString(16)}:`, "netem", "delay", "20ms", "limit", "10000"]);
    commands.push(["filter", "add", "dev", "lo", "parent", "7abc:", "protocol", "ip", "prio", String(10 + user * 2 + direction), "u32",
      "match", "ip", "src", "127.0.0.1/32", "match", "ip", "dst", "127.0.0.1/32", "match", "ip", "protocol", "6", "0xff",
      "match", "ip", direction === 0 ? "sport" : "dport", String(relayPort(user)), "0xffff", "flowid", id]);
  }
  return commands;
}

export async function startPacketNetwork(users: number, targetPort: number, shaped: boolean, evidencePath: string) {
  assert.equal(process.platform, "linux"); assert.equal(process.env.GITHUB_ACTIONS, "true");
  assert.equal(process.env.PPO_BLOCK_PROFILE, "cpu-assets-network");
  assert.equal(process.env.PPO_NETWORK_CANDIDATE, "packet");
  assert.equal(process.env.PPO_BENCHMARK_FIXTURE, "add-synthetic-load"); assert.equal(availableParallelism(), 4);
  assert.ok(users === 1 || users === 10);
  const ephemeral = (await readFile("/proc/sys/net/ipv4/ip_local_port_range", "utf8")).trim().split(/\s+/).map(Number);
  assert.ok(ephemeral[0] > relayPort(9));
  const before = JSON.parse(tc("-j", "qdisc", "show", "dev", "lo"));
  assert.ok(before.length === 1 && before[0].kind === "noqueue", "Refuse to replace an existing loopback discipline");
  const relays: Awaited<ReturnType<typeof startRelay>>[] = [];
  const record: Record<string, unknown> = { shaped, users, before, ephemeral, kernel: execFileSync("uname", ["-r"], { encoding: "utf8" }).trim(), tc: tc("-V").trim(), started_at: new Date().toISOString() };
  let owned = false, closed = false;
  const checkpoint = () => writeFile(evidencePath, JSON.stringify({ ...record, relays: relays.map(r => r.stats) }, null, 2));
  await writeFile(evidencePath, JSON.stringify(record, null, 2), { flag: "wx" });
  const close = async () => {
    if (closed) return; closed = true;
    try { record.final = shaped && owned ? snapshot() : null; } finally {
      try { await Promise.all(relays.map(r => r.close())); } finally {
        if (owned) {
          const current = JSON.parse(tc("-j", "qdisc", "show", "dev", "lo"));
          assert.ok(current.some((q: { root?: boolean; handle?: string; kind?: string }) => q.root && q.handle === "7abc:" && q.kind === "htb"), "Only remove the owned root");
          tc("qdisc", "del", "dev", "lo", "root", "handle", "7abc:");
        }
        record.after = JSON.parse(tc("-j", "qdisc", "show", "dev", "lo")); await checkpoint();
      }
    }
  };
  try {
    for (let user = 0; user < users; user++) relays.push(await startRelay(relayPort(user), targetPort));
    if (shaped) for (const [index, command] of packetCommands(users).entries()) { tc(...command); if (index === 0) owned = true; }
    record.configured = shaped ? snapshot() : null; await checkpoint();
    return { close, async verify(minimum = { upload: 1, download: 1 }) {
      const observed = shaped ? snapshot() : null;
      record.observed = observed; await checkpoint();
      for (const [user, relay] of relays.entries()) {
        assert.ok(relay.stats.connected > 0 && relay.stats.uploaded_bytes >= minimum.upload && relay.stats.downloaded_bytes >= minimum.download, "Each browser must traverse its relay with the expected payload volume");
        if (observed) for (const direction of [0, 1]) {
          const row = observed.classes.find((c: { handle: string }) => c.handle === classId(user, direction));
          assert.ok(row && row.bytes > 0 && row.packets > 0, "Each directional kernel class must carry traffic");
        }
      }
    } };
  } catch (error) { record.setup_error = String(error); await close(); throw error; }
}
