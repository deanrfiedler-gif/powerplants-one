import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { escalationFixture, base } from "../helpers/service-escalations";
import { closeDatabase } from "../../src/platform/database";
import { hashBytes } from "../../src/service/escalations/model";
after(closeDatabase);
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function session(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
const root = "/api/v1/service/escalations";
async function request(
  path: string,
  cookie?: string,
  body?: unknown,
  requestOrigin = origin,
) {
  return fetch(origin + root + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      Origin: requestOrigin,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
test("SV08 HTTP authenticates every read, validates filters and commands and rejects origin/access bypass", async () => {
  assert.equal((await request("")).status, 401);
  const cookie = await session("coordinator"),
    observer = await session("observer");
  const register = await request("?view=open&limit=1", cookie);
  assert.equal(register.status, 200);
  assert.match(register.headers.get("cache-control")!, /private, no-store/);
  const rows = await register.json();
  assert.equal(rows.synthetic, true);
  assert.ok(rows.items.length <= 1);
  assert.ok(["Complete", "BoundedWindow"].includes(rows.completeness));
  for (const query of [
    "view=other",
    "limit=51",
    "offset=-1",
    "owner_id=bad",
    "actor_id=other",
  ])
    assert.equal((await request("?" + query, cookie)).status, 422);
  assert.equal((await request("", observer)).status, 403);
  assert.equal(
    (await request("/options?finding_key=not-a-finding", cookie)).status,
    422,
  );
  assert.equal((await request("/" + randomUUID(), cookie)).status, 404);
  assert.equal((await request("", cookie, {})).status, 422);
  assert.equal(
    (await request("", cookie, {}, "https://elsewhere.invalid")).status,
    403,
  );
  assert.equal(
    (
      await request("/" + randomUUID() + "/commands", cookie, {
        operation_id: randomUUID(),
        schema_version: 1,
        reason: "SYN invalid action",
        expected_version: 1,
        action: "send_email",
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await request(
        "/" +
          randomUUID() +
          "/files?kind=pack&file_id=" +
          randomUUID() +
          "&format=pdf",
        observer,
      )
    ).status,
    403,
  );
});

test("SV08 HTTP persists the complete lifecycle, exact replay, downloads, owned work and a follow-up loop", async () => {
  const f = await escalationFixture(),
    cookie = await session("coordinator"),
    observer = await session("observer");
  const id = randomUUID(),
    opening = { ...f.command, ...base(), id };
  const opened = await request("", cookie, opening);
  assert.equal(opened.status, 201, await opened.clone().text());
  const receipt = await opened.json();
  const replay = await request("", cookie, opening);
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), receipt);
  const read = async () => {
    const r = await request("/" + id, cookie);
    assert.equal(r.status, 200, await r.clone().text());
    return r.json();
  };
  const command = async (
    action: string,
    fields: Record<string, unknown> = {},
  ) => {
    const d = await read();
    const input = {
      ...base(),
      action,
      expected_version: d.record.version,
      ...fields,
    };
    const r = await request(`/${id}/commands`, cookie, input);
    assert.ok([200, 201].includes(r.status), await r.clone().text());
    return { input, receipt: await r.json() };
  };
  assert.equal((await request("/" + id, observer)).status, 403);
  await command("diagnose", {
    attempted_at: new Date().toISOString(),
    diagnostic: "SYN observed the status indicator",
    result: "SYN intermittent fault persists",
    source_reference: "SYN HTTP observation",
  });
  await command("capture_configuration");
  const d = await read();
  const route = await request(
    `/equipment/${f.asset.id}/support-route`,
    cookie,
    {
      ...base(),
      expected_version: d.equipment.version,
      method: "Email",
      recipient: "synthetic-support@example.invalid",
    },
  );
  assert.ok([200, 201].includes(route.status), await route.clone().text());
  const prepare = async () => {
    await command("prepare_pack");
    const pack = (await read()).packs[0];
    for (const format of ["html", "pdf"]) {
      const response = await request(
        `/${id}/files?kind=pack&file_id=${pack.id}&format=${format}`,
        cookie,
      );
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-disposition")!, /attachment/);
      assert.match(response.headers.get("cache-control")!, /no-store/);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(hashBytes(bytes), pack[`${format}_sha256`]);
      assert.equal(response.headers.get("x-ppo-sha256"), hashBytes(bytes));
      if (format === "html")
        assert.ok(
          !bytes.toString().includes("synthetic-support@example.invalid"),
        );
    }
    await command("review_pack", {
      pack_id: pack.id,
      html_sha256: pack.html_sha256,
      pdf_sha256: pack.pdf_sha256,
      confirmed_exclusions: true,
    });
    return pack;
  };
  const send = async (pack: { id: string }) =>
    command("record_sent", {
      pack_id: pack.id,
      sent_at: new Date().toISOString(),
      sent_by: f.p.actor_id,
      method: "Email",
      recipient: "synthetic-support@example.invalid",
      manufacturer_reference: "SYN HTTP reference",
      reply_expected_at: new Date(Date.now() + 86400000).toISOString(),
    });
  const reply = async () =>
    command("record_reply", {
      received_at: new Date().toISOString(),
      reply: "SYN manufacturer advice",
      advice: "SYN capture another reading",
      settings_change: true,
      attachments: [],
    });
  const sent = await send(await prepare());
  assert.equal((await read()).record.state, "WaitingOnManufacturer");
  const duplicate = await request(`/${id}/commands`, cookie, sent.input);
  assert.equal(duplicate.status, 200);
  assert.deepEqual(await duplicate.json(), sent.receipt);
  await reply();
  await command("follow_up", {
    question: "SYN which additional reading is required?",
  });
  assert.equal((await read()).record.state, "Diagnosing");
  assert.equal((await read()).record.reviewed_pack_id, null);
  await send(await prepare());
  const secondSending = await read();
  assert.equal(secondSending.record.last_reply_id, null);
  assert.equal(
    secondSending.events.filter((e: { kind: string }) => e.kind === "Reply")
      .length,
    1,
  );
  assert.equal(
    typeof secondSending.events.find(
      (e: { id: string }) => e.id === secondSending.record.last_sent_id,
    ).details.sent_by_name,
    "string",
  );
  await reply();
  const current = await read();
  await command("next_action", {
    source_token: current.source_token,
    expected_finding_version: current.expected_finding_version,
    owner_id: f.p.actor_id,
    due_at: new Date(Date.now() + 172800000).toISOString(),
    instruction: "SYN obtain permission and capture the requested reading",
    required_evidence: "SYN calibrated reading",
    grower_approval_required: true,
  });
  await command("close", {
    outcome: "SYN advice assigned to native owned work",
  });
  assert.equal((await read()).record.state, "Closed");
  const invalid = await request(`/${id}/commands`, cookie, {
    ...base(),
    action: "prepare_pack",
    expected_version: (await read()).record.version,
  });
  assert.equal(invalid.status, 422);
});
