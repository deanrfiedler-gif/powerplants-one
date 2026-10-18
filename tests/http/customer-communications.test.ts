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
