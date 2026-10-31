import { details, newDemand, fact, recordVersion, setupNotices } from "../helpers/customer-delivery";
import { supplyFact } from "../helpers/supply";
import { database } from "../../src/platform/database";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { runCustomerMessageJobs } from "../../src/communications";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { CRM } from "../helpers/crm";
import {
  base,
  contact,
  definition,
  demand,
  grant,
  latest,
  message,
  prepare,
  testSource,
} from "../helpers/customer-communications";
import { principal, rows } from "../helpers/packs";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

const origin = localConfig().origin;
const cookies = new Map<string, string>();
async function cookie(profile: string) {
  if (!cookies.has(profile)) {
    const r = await fetch(origin + "/api/v1/local-session", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    assert.equal(r.status, 200);
    cookies.set(profile, r.headers.get("set-cookie")!.split(";")[0]);
  }
  return cookies.get(profile)!;
}
async function call(profile: string, path: string, body?: unknown) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: { cookie: await cookie(profile), origin, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(r.headers.get("cache-control"), "private, no-store");
  return { status: r.status, body: await r.json() };
}

test("D-025 S2 over HTTP: templates, switch, prepared message, named sender, timelines and queue", async () => {
  const coordinator = await principal("coordinator"),
    reviewer = await principal("cs-reviewer");
  await grant(coordinator, ["template.read", "template.propose", "customer_message.send", "customer_message.switch"]);
  await grant(reviewer, ["template.read", "template.publish", "shared.read", "supply.read", "supply.coordinate", "activity.read", "customer_message.send"]);

  // CUS-EMAIL: one person proposes, another publishes the exact definition.
  const propose = { ...base(), company_id: CRM.company, message_class: "DispatchNotice", definition: definition("DispatchNotice") };
  const proposed = await call("coordinator", "customer-email-templates", propose);
  assert.equal(proposed.status, 201);
  const replay = await call("coordinator", "customer-email-templates", propose);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, proposed.body);
  const bad = await call("coordinator", "customer-email-templates", { ...propose, ...base(), definition: { ...definition("DispatchNotice"), body: ["{{project.margin}}"] } });
  assert.equal(bad.status, 422);
  const list = await call("cs-reviewer", `customer-email-templates?company_id=${CRM.company}`);
  assert.equal(list.status, 200);
  const proposal = list.body.proposals.find((x: { id: string }) => x.id === proposed.body.record_id);
  const publishBody = { ...base(), definition_hash: proposal.definition_hash, approval_note: "SYN wording approved once" };
  assert.equal((await call("coordinator", `customer-email-templates/proposals/${proposal.id}/publish`, publishBody)).status, 404);
  const published = await call("cs-reviewer", `customer-email-templates/proposals/${proposal.id}/publish`, publishBody);
  assert.equal(published.status, 201);
  assert.equal(published.body.state, "Published");

  // R9: Off by default; only the switch duty changes it.
  const switches = await call("cs-reviewer", `customer-communications/switches?company_id=${CRM.company}`);
  assert.equal(switches.body.can_switch, true);
  assert.deepEqual(switches.body.classes.map((c: { mode: string }) => c.mode), ["Off", "Off", "Off", "Off"]);
  const on = { ...base(), company_id: CRM.company, message_class: "DispatchNotice", mode: "Synthetic", expected_version: 0 };
  assert.equal((await call("cs-reviewer", "customer-communications/switches", on)).status, 404);
  assert.equal((await call("coordinator", "customer-communications/switches", on)).status, 201);

  // PPO drafts the message from the source record (in process, as S3's trigger will); a named sender confirms over HTTP.
  const sam = await contact("sam.http@example.invalid", "SYN Sam HTTP");
  const prepared = await prepare(coordinator, testSource("DispatchNotice", demand, sam));
  const timeline = await call("cs-reviewer", `customer-communications?demand_id=${demand}`);
  assert.equal(timeline.status, 200);
  assert.equal(timeline.body.items[0].id, prepared.id);
  assert.equal(timeline.body.items[0].display_state, "Prepared — waiting for a named sender");
  assert.equal(timeline.body.simulated, true);
  assert.equal((await call("cs-reviewer", `customer-communications?demand_id=${demand}&organisation_id=${CRM.org}`)).status, 422);
  const queue = await call("coordinator", "customer-communications/queue?owner=me");
  assert.ok(queue.body.items.some((i: { id: string }) => i.id === prepared.id));
  const m = await message(prepared.id);
  const confirmBody = (hash: string) => ({ ...base(), expected_version: 1, content_hash: hash });
  assert.equal((await call("cs-reviewer", `customer-communications/${prepared.id}/confirm`, confirmBody("e".repeat(64)))).body.code, "ContentChanged");
  const ok = confirmBody(m.content_hash);
  const confirmed = await call("cs-reviewer", `customer-communications/${prepared.id}/confirm`, ok);
  assert.equal(confirmed.status, 201);
  assert.equal(confirmed.body.state, "Queued");
  const again = await call("cs-reviewer", `customer-communications/${prepared.id}/confirm`, ok);
  assert.equal(again.status, 200);
  assert.deepEqual(again.body, confirmed.body);
  await runCustomerMessageJobs();
  const detail = await call("coordinator", `customer-communications/${prepared.id}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.state, "Sent");
  assert.equal(detail.body.display_state, "Sent (simulated) — delivery not confirmed");
  assert.equal(detail.body.sent_by, reviewer.display_name);
  assert.equal(detail.body.actions.confirm, false);
  assert.equal(detail.body.actions.reconcile, false);
  assert.equal(detail.body.sender.name, coordinator.display_name);
  const all = await call("coordinator", "customer-communications/queue?view=all");
  assert.equal(all.status, 200);
  assert.ok(all.body.items.some((i: { id: string }) => i.id === prepared.id));
  assert.match(all.body.coverage, /200 candidates/);
  assert.ok(!(await call("coordinator", "customer-communications/queue")).body.items.some((i: { id: string }) => i.id === prepared.id));
  assert.equal((await call("coordinator", "customer-communications/queue?view=provider")).status, 422);
  assert.equal((await call("other-workspace", "customer-communications/queue?view=all")).body.items.length, 0);
  assert.deepEqual(detail.body.history.map((h: { state: string }) => h.state), ["Prepared", "Queued", "Submitted", "Sent"]);
  assert.match(detail.body.body, /To stop these emails, reply to this email and ask us to stop\./);
  const customer = await call("coordinator", `customer-communications?organisation_id=${CRM.org}`);
  assert.ok(customer.body.items.some((i: { id: string }) => i.id === prepared.id));
  assert.ok([403, 404].includes((await call("technician", `customer-communications/${prepared.id}`)).status));
});

test("D-025 S2 over HTTP: notice preference holds, withdraw, and reconcile before retry", async () => {
  const coordinator = await principal("coordinator");
  const quiet = await contact("quinn.http@example.invalid");
  const prefs = await call("coordinator", `people/${quiet}/notice-preferences?company_id=${CRM.company}`);
  assert.equal(prefs.status, 200);
  assert.equal(prefs.body.classes[0].basis, "NamedRecipient");
  const record = { ...base("Customer asked by reply to stop dispatch emails"), company_id: CRM.company, message_class: "DispatchNotice", preference: "DoNotNotify", expected_version: 0 };
  assert.equal((await call("coordinator", `people/${quiet}/notice-preferences`, record)).status, 201);
  assert.equal((await call("coordinator", `people/${quiet}/notice-preferences`, { ...record, operation_id: randomUUID() })).body.code, "VersionConflict");
  const held = await prepare(coordinator, testSource("DispatchNotice", demand, quiet));
  assert.equal(held.receipt.state, "Held");
  const queued = await call("coordinator", "customer-communications/queue");
  const item = queued.body.items.find((i: { id: string }) => i.id === held.id);
  assert.equal(item.hold_reason, "DoNotNotify");
  assert.equal(item.follow_up.status, "Open");
  const withdrawn = await call("coordinator", `customer-communications/${held.id}/withdraw`, { ...base(), expected_version: 1 });
  assert.equal(withdrawn.status, 201);
  assert.equal(withdrawn.body.state, "Withdrawn");

  const lost = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("lu.http+lost-response@example.invalid")));
  const m = await message(lost.id);
  assert.equal((await call("coordinator", `customer-communications/${lost.id}/confirm`, { ...base(), expected_version: 1, content_hash: m.content_hash })).status, 201);
  await runCustomerMessageJobs();
  assert.equal((await latest(lost.id)).state, "OutcomeUnknown");
  const reconciled = await call("coordinator", `customer-communications/${lost.id}/reconcile`, { ...base(), expected_version: 3 });
  assert.equal(reconciled.status, 201);
  assert.equal(reconciled.body.state, "Sent");
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.synthetic_mailbox_messages WHERE communication_id=$1", [lost.id]))[0].n,
    1,
  );
});


test("S3 HTTP enforces delivery-role/source duties, exact replay and recovery, and drafts only native Moved dispatch", async () => {
  const { actor } = await setupNotices();
  const id = await newDemand(actor), person = await contact("s3.http@example.invalid");
  const path = `supply/records/${id}`;
  const options = await call("coordinator", `supply/customer-delivery-options?company_id=${CRM.company}`);
  assert.equal(options.status, 200);
  assert.equal(options.body.options.length, 7);
  assert.equal(options.body.synthetic, true);
  assert.ok([403, 404].includes((await call("second-company", `supply/customer-delivery-options?company_id=${CRM.company}`)).status));
  const cmd = { ...base(), expected_version: await recordVersion(id), contact_id: person, customer_eta: "2026-11-03", delay_reason_code: null };
  for (const profile of ["observer", "second-company", "other-workspace"])
    assert.ok([403, 404].includes((await call(profile, `${path}/customer-delivery`, cmd)).status));
  const accepted = await call("coordinator", `${path}/customer-delivery`, cmd);
  assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
  const replay = await call("coordinator", `${path}/customer-delivery`, cmd);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, accepted.body);
  assert.equal((await call("coordinator", `${path}/customer-delivery`, { ...cmd, customer_eta: "2026-11-04" })).body.code, "OperationConflict");
  assert.equal((await call("coordinator", `${path}/customer-delivery`, { ...cmd, ...base() })).body.code, "VersionConflict");
  assert.deepEqual((await call("coordinator", `supply/operations/${cmd.operation_id}`)).body, accepted.body);
  assert.ok([403, 404].includes((await call("observer", `supply/operations/${cmd.operation_id}`)).status));
  assert.equal((await call("coordinator", `${path}/customer-delivery`, { ...cmd, ...base(), recipient_address: "injected@example.invalid" })).status, 422);
  const prepared = await fact(actor, id, "Dispatch", { state: "Prepared", quantity: "4" });
  assert.equal((await call("coordinator", `${path}/customer-delivery`)).body.notices.length, 0);
  const movement = { ...supplyFact("Dispatch", await recordVersion(id), { state: "Moved", quantity: "4", movement_at: "2026-10-24T02:00:00.000Z" }),
    predecessor_id: prepared.cmd.id, dispatch_notice: details };
  const moved = await call("coordinator", `${path}/facts`, movement);
  assert.equal(moved.status, 201, JSON.stringify(moved.body));
  assert.deepEqual((await call("coordinator", `${path}/facts`, movement)).body, moved.body);
  const source = await call("coordinator", `${path}/customer-delivery`);
  assert.equal(source.body.notices.length, 1);
  assert.equal(source.body.current.contact_id, person);
  const messageId = source.body.notices[0].communication_id;
  const draft = await call("coordinator", `customer-communications/${messageId}`);
  assert.equal(draft.status, 200);
  assert.match(draft.body.body, /6 outstanding/);
  assert.equal((await call("coordinator", `${path}/customer-notices`, { ...base(), expected_version: await recordVersion(id), dispatch_fact_id: movement.id })).body.code, "MessageAlreadyPrepared");
  assert.ok([403, 404].includes((await call("second-company", `${path}/customer-delivery`)).status));
  const confirmed = await call("coordinator", `customer-communications/${messageId}/confirm`, { ...base(), expected_version: 1, content_hash: draft.body.content_hash });
  assert.equal(confirmed.status, 201);
  await runCustomerMessageJobs(100);
  assert.equal((await latest(messageId)).state, "Sent");
  const later = { ...base(), expected_version: await recordVersion(id), contact_id: person, customer_eta: "2026-11-07", delay_reason_code: "SYN-DLR-000001" };
  assert.equal((await call("coordinator", `${path}/customer-delivery`, later)).status, 201);
  const delaySource = await call("coordinator", `${path}/customer-delivery`);
  const delayId = delaySource.body.notices.at(-1).communication_id;
  const delay = await call("coordinator", `customer-communications/${delayId}`);
  assert.match(delay.body.body, /2026-11-03 to 2026-11-07/);
  const grants = await rows("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.coordinate' RETURNING *", [actor.actor_id]);
  assert.ok([403, 404].includes((await call("coordinator", `${path}/customer-delivery`, later)).status));
  assert.ok([403, 404].includes((await call("coordinator", `supply/operations/${later.operation_id}`)).status));
  for (const g of grants) {
    const keys = Object.keys(g);
    await database().query(`INSERT INTO ppo.permission_grants(${keys.join(",")}) VALUES(${keys.map((_, i) => `$${i + 1}`).join(",")})`, Object.values(g));
  }
});
