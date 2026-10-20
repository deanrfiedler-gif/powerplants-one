import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { confirmed, principal, base } from "../helpers/packs";
import { closeDatabase } from "../../src/platform/database";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
after(closeDatabase);
test("SV07 HTTP saves one source-bound Activity and recovers its original receipt", async () => {
  const a = await confirmed(),
    p = await principal();
  const session = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile: "coordinator" }),
  });
  assert.equal(session.status, 200);
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  const get = (path: string) =>
    fetch(origin + path, { headers: { Cookie: cookie } });
  const register = await get(
    "/api/v1/service/findings?source=schedule&q=" +
      encodeURIComponent(a.display_number),
  );
  assert.equal(register.status, 200);
  const row = (await register.json()).items[0];
  const path = `/api/v1/service/findings/${row.id}/next-action`;
  const response = await get(path);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control")!, /private, no-store/);
  const context = await response.json();
  assert.equal(context.can_edit, true);
  const command = {
    ...base(),
    source_token: context.source_token,
    expected_version: context.expected_version,
    owner_id: p.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    instruction: "SYN HTTP follow-up instruction",
    required_evidence: "SYN HTTP photo required",
  };
  const post = (body: unknown) =>
    fetch(origin + path, {
      method: "POST",
      headers: {
        Cookie: cookie,
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  const saved = await post(command);
  assert.equal(saved.status, 200);
  const receipt = await saved.json();
  assert.equal(receipt.record_id, row.action.id);
  const replay = await post(command);
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), receipt);
  const current = await (await get(path)).json();
  assert.equal(current.item.action.id, row.action.id);
  assert.equal(current.item.action.summary, command.instruction);
  assert.equal(
    current.item.action.required_evidence,
    command.required_evidence,
  );
  assert.equal(current.expected_version, context.expected_version + 1);
  assert.equal(
    (await post({ ...command, operation_id: randomUUID() })).status,
    409,
  );
});
