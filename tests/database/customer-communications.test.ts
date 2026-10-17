import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  confirmCustomerMessage,
  customerCommunicationQueue,
  listCustomerCommunications,
  listCustomerEmailTemplates,
  proposeCustomerEmailTemplate,
  publishCustomerEmailTemplate,
  readCustomerCommunication,
  readMessageClassSwitches,
  readNoticePreferences,
  reconcileCustomerMessage,
  recordNoticePreference,
  runCustomerMessageJobs,
  setMessageClassSwitch,
  stopLine,
  withdrawCustomerMessage,
} from "../../src/communications";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import type { Principal } from "../../src/platform/identity";
import { CRM } from "../helpers/crm";
import {
  avery,
  base,
  contact,
  definition,
  demand,
  followUps,
  grant,
  latest,
  message,
  prepare,
  project,
  publishTemplate,
  switchOn,
  testSource,
} from "../helpers/customer-communications";
import { principal, rows } from "../helpers/packs";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

let coordinator: Principal, publisher: Principal, outsider: Principal;
const confirm = async (p: Principal, id: string) => {
  const m = await message(id),
    l = await latest(id);
  return confirmCustomerMessage(p, id, { ...base(), expected_version: l.version, content_hash: m.content_hash });
};
const jobOf = async (id: string) =>
  (await rows("SELECT * FROM ppo.outbox_jobs WHERE kind='CustomerMessageConfirmed' AND payload->>'record_id'=$1", [id]))[0];
const copies = async (id: string) =>
  (await rows("SELECT count(*)::int AS n FROM ppo.synthetic_mailbox_messages WHERE communication_id=$1", [id]))[0].n;

test("0109 is empty, default-denied and Off for every class", async () => {
  coordinator = await principal("coordinator");
  publisher = await principal("cs-reviewer");
  outsider = await principal("technician");
  for (const table of [
    "customer_communications",
    "customer_communication_events",
    "customer_communication_follow_ups",
    "contact_notice_preferences",
    "customer_message_switch_events",
    "customer_email_template_proposals",
    "customer_email_templates",
    "synthetic_mailbox_messages",
  ])
    assert.deepEqual(await rows(`SELECT * FROM ppo.${table}`), [], table);
  assert.deepEqual(await rows("SELECT * FROM ppo.permission_grants WHERE capability LIKE 'customer_message.%'"), []);
  assert.deepEqual(
    (await rows("SELECT message_class,array_agg(binding ORDER BY binding) AS b FROM ppo.customer_email_bindings GROUP BY 1 ORDER BY 1")).map((r) => [r.message_class, r.b]),
    ["DelayNotice", "DispatchNotice", "ProjectUpdate", "VisitConfirmation"].map((c) => [c, ["customer.name", "recipient.name", "site.name", "source.reference"]]),
  );
  const switches = await readMessageClassSwitches(coordinator, { company_id: CRM.company });
  assert.deepEqual(switches.classes.map((c) => [c.code, c.mode, c.version]), [["M1", "Off", 0], ["M2", "Off", 0], ["M3", "Off", 0], ["M4", "Off", 0]]);
  await assert.rejects(
    setMessageClassSwitch(coordinator, { ...base(), company_id: CRM.company, message_class: "DispatchNotice", mode: "Synthetic", expected_version: 0 }),
    { code: "RecordUnavailable" },
  );
  await grant(coordinator, ["template.read", "template.propose", "customer_message.send", "customer_message.switch"]);
  await grant(publisher, ["template.read", "template.publish", "shared.read", "shared.internal.read", "supply.read", "supply.coordinate", "project.read", "project.edit", "activity.read", "customer_message.send"]);
});

test("CUS-EMAIL keeps DK-06 rules: allowlisted bindings only, independent exact publication, next version", async () => {
  await assert.rejects(
    proposeCustomerEmailTemplate(coordinator, {
      ...base(),
      company_id: CRM.company,
      message_class: "DispatchNotice",
      definition: { ...definition("DispatchNotice"), body: ["Margin on this order: {{project.margin}}"] },
    }),
    (e: { code: string; field_errors: { field: string }[] }) => e.code === "InvalidData" && e.field_errors[0].field === "definition.body.0",
  );
  await assert.rejects(
    proposeCustomerEmailTemplate(coordinator, {
      ...base(),
      company_id: CRM.company,
      message_class: "DispatchNotice",
      definition: { ...definition("DispatchNotice"), subject: "Your order {{source.reference}}" },
    }),
    { code: "InvalidData" },
  );
  // The database refuses an internal field even when the application is bypassed.
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.customer_email_template_proposals(id,workspace_id,company_id,message_class,definition,definition_hash,author_id,operation_id,reason) VALUES($1,$2,$3,'DispatchNotice',$4,encode(sha256(convert_to($4,'UTF8')),'hex'),$5,$6,'SYN bypass')",
      [randomUUID(), CRM.workspace, CRM.company, JSON.stringify({ ...definition("DispatchNotice"), body: ["{{raid.commentary}}"] }), coordinator.actor_id, randomUUID()],
    ),
    { code: "23514" },
  );
  const proposed = await proposeCustomerEmailTemplate(coordinator, {
    ...base(),
    company_id: CRM.company,
    message_class: "DispatchNotice",
    definition: definition("DispatchNotice"),
  });
  const hash = (await rows("SELECT definition_hash FROM ppo.customer_email_template_proposals WHERE id=$1", [proposed.receipt.record_id]))[0].definition_hash;
  await grant(coordinator, ["template.publish"]);
  await assert.rejects(
    publishCustomerEmailTemplate(coordinator, proposed.receipt.record_id, { ...base(), definition_hash: hash, approval_note: "SYN self approval" }),
    { code: "IndependentPublisherRequired" },
  );
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='template.publish'", [coordinator.actor_id]);
  const publish = (h: string) =>
    publishCustomerEmailTemplate(publisher, proposed.receipt.record_id, { ...base(), definition_hash: h, approval_note: "SYN wording approved" });
  await assert.rejects(publish("0".repeat(64)), { code: "DefinitionChanged" });
  const first = await publish(hash);
  assert.equal(first.receipt.record_version, 1);
  await assert.rejects(publish(hash), { code: "AlreadyPublished" });
  const second = await publishTemplate(coordinator, publisher, "DispatchNotice", "Dispatch – your order has left our store");
  assert.equal(second.receipt.record_version, 2);
  const list = await listCustomerEmailTemplates(publisher, { company_id: CRM.company });
  const dispatch = list.classes.find((c) => c.message_class === "DispatchNotice")!;
  assert.equal(dispatch.current?.version, 2);
  assert.equal(dispatch.history.length, 2);
  assert.equal(list.classes.find((c) => c.message_class === "ProjectUpdate")!.current, null);
  // Publication also needs the class's working duty (the Supply owner for M1).
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.coordinate'", [publisher.actor_id]);
  const third = await proposeCustomerEmailTemplate(coordinator, { ...base(), company_id: CRM.company, message_class: "DispatchNotice", definition: definition("DispatchNotice", "Dispatch – third") });
  const h3 = (await rows("SELECT definition_hash FROM ppo.customer_email_template_proposals WHERE id=$1", [third.receipt.record_id]))[0].definition_hash;
  await assert.rejects(
    publishCustomerEmailTemplate(publisher, third.receipt.record_id, { ...base(), definition_hash: h3, approval_note: "SYN" }),
    { code: "RecordUnavailable" },
  );
  await grant(publisher, ["supply.coordinate"]);
});

test("a class that is Off prepares nothing; switching on is a recorded, replayable duty", async () => {
  const sam = await contact("sam@example.invalid", "SYN Sam Receiver");
  await assert.rejects(prepare(coordinator, testSource("DispatchNotice", demand, sam)), { code: "MessageClassOff" });
  assert.deepEqual(await rows("SELECT id FROM ppo.customer_communications"), []);
  const command = { ...base("SYN switch on for the synthetic channel"), company_id: CRM.company, message_class: "DispatchNotice", mode: "Synthetic", expected_version: 0 };
  const on = await setMessageClassSwitch(coordinator, command);
  const replay = await setMessageClassSwitch(coordinator, command);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.receipt, on.receipt);
  await assert.rejects(setMessageClassSwitch(coordinator, { ...command, operation_id: randomUUID() }), { code: "VersionConflict" });
  const s = await readMessageClassSwitches(publisher, { company_id: CRM.company });
  assert.equal(s.classes.find((c) => c.message_class === "DispatchNotice")!.mode, "Synthetic");
  assert.equal(s.classes.find((c) => c.message_class === "DelayNotice")!.mode, "Off");
});

test("prepare fixes exact content; a named sender confirms; the worker submits and observes Sent only", async () => {
  const sam = (await rows("SELECT id FROM ppo.people WHERE email='sam@example.invalid'"))[0].id;
  const prepared = await prepare(coordinator, testSource("DispatchNotice", demand, sam));
  assert.equal(prepared.receipt.state, "Prepared");
  const m = await message(prepared.id);
  assert.equal(m.channel, "Synthetic");
  assert.equal(m.template_version, 2);
  assert.equal(m.recipient_address, "sam@example.invalid");
  assert.equal(m.owner_id, CRM.owner);
  assert.match(m.subject, /^\[SYN-PPO-SC-DEMAND-001\] Dispatch – your order has left our store$/);
  assert.match(m.body, /^Hello SYN Sam Receiver,\n\nThis is a synthetic message about SYN-PPO-SC-DEMAND-001 for SYN Greenhouse Demonstration at SYN Q01 Demonstration Site\.\n\n/);
  assert.ok(m.body.endsWith(`${stopLine}\n\nPowerplants`));
  // One message per class, source, fact version and recipient (R8); a retry returns its receipt.
  await assert.rejects(prepare(coordinator, testSource("DispatchNotice", demand, sam)), { code: "MessageAlreadyPrepared" });
  const l = await latest(prepared.id);
  await assert.rejects(
    confirmCustomerMessage(coordinator, prepared.id, { ...base(), expected_version: l.version, content_hash: "f".repeat(64) }),
    { code: "ContentChanged" },
  );
  await assert.rejects(confirm(outsider, prepared.id), (e: { status: number }) => [403, 404].includes(e.status));
  const queued = await confirm(coordinator, prepared.id);
  assert.equal(queued.receipt.state, "Queued");
  assert.equal((await jobOf(prepared.id)).status, "Ready");
  const run = await runCustomerMessageJobs();
  assert.ok(run.handed >= 1);
  assert.equal((await latest(prepared.id)).state, "Sent");
  assert.equal((await jobOf(prepared.id)).status, "Done");
  assert.equal(await copies(prepared.id), 1);
  await runCustomerMessageJobs();
  assert.equal(await copies(prepared.id), 1, "a Done job is never resubmitted");
  assert.equal((await latest(prepared.id)).state, "Sent", "silence never becomes Delivered");
  const detail = await readCustomerCommunication(publisher, prepared.id);
  assert.deepEqual(detail.history.map((h) => h.state), ["Prepared", "Queued", "Submitted", "Sent"]);
  assert.equal(detail.display_state, "Sent (simulated) — delivery not confirmed");
  assert.equal(detail.simulated, true);
  assert.equal(detail.sent_by, coordinator.display_name);
  assert.deepEqual(await followUps(prepared.id), []);
});

test("Delivered needs positive evidence; a bounce or rejection fails with one owned follow-up", async () => {
  const delivered = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("dee+delivered@example.invalid")));
  const bounce = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("bo+bounce@example.invalid")));
  const reject = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("rae+reject@example.invalid")));
  for (const m of [delivered, bounce, reject]) await confirm(coordinator, m.id);
  await runCustomerMessageJobs();
  assert.equal((await latest(delivered.id)).state, "Delivered");
  assert.equal((await latest(bounce.id)).state, "Failed");
  assert.equal((await latest(reject.id)).state, "Failed");
  assert.equal(await copies(reject.id), 0);
  for (const id of [bounce.id, reject.id]) {
    const f = await followUps(id);
    assert.equal(f.length, 1);
    assert.equal(f[0].kind, "CustomerContact");
    assert.equal(f[0].owner_id, CRM.owner);
    assert.equal(f[0].status, "Open");
  }
  assert.deepEqual(await followUps(delivered.id), []);
  // The follow-up reaches the owner through the existing Owned work notice projection.
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.audit_events WHERE object_type='Activity' AND details->>'communication_id'=$1", [bounce.id]))[0].n,
    1,
  );
  const queue = await customerCommunicationQueue(coordinator, { owner: "me" });
  assert.ok(queue.items.some((i) => i.id === bounce.id && i.state === "Failed"));
  assert.ok(!queue.items.some((i) => i.id === delivered.id));
});

test("an unknown outcome is reconciled against the channel before any retry", async () => {
  const lostResponse = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("lu+lost-response@example.invalid")));
  const lostRequest = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("lq+lost-request@example.invalid")));
  const crashed = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("cr@example.invalid")));
  for (const m of [lostResponse, lostRequest, crashed]) await confirm(coordinator, m.id);
  // A worker that dies mid hand-over leaves a Running job with an expired lease.
  await database().query("UPDATE ppo.outbox_jobs SET status='Running',attempts=1,lease_until=clock_timestamp()-interval '1 minute' WHERE kind='CustomerMessageConfirmed' AND payload->>'record_id'=$1", [crashed.id]);
  await runCustomerMessageJobs();
  for (const m of [lostResponse, lostRequest, crashed]) {
    assert.equal((await latest(m.id)).state, "OutcomeUnknown");
    assert.equal((await jobOf(m.id)).status, "OutcomeUnknown");
    assert.equal((await followUps(m.id)).length, 1);
  }
  assert.equal(await copies(crashed.id), 0, "an interrupted hand-over is never resubmitted blind");
  await runCustomerMessageJobs();
  assert.equal(await copies(lostResponse.id), 1);
  const reconcile = async (id: string) =>
    reconcileCustomerMessage(coordinator, id, { ...base(), expected_version: (await latest(id)).version });
  assert.equal((await reconcile(lostResponse.id)).receipt.state, "Sent");
  assert.equal((await reconcile(lostRequest.id)).receipt.state, "Queued");
  assert.equal((await jobOf(lostRequest.id)).status, "Retry");
  await assert.rejects(reconcile(lostResponse.id), { code: "MessageNotUnknown" });
  // lost-request still has no copy, so the retry is safe; the tag keeps losing it, so it stays unknown.
  await runCustomerMessageJobs();
  assert.equal((await latest(lostRequest.id)).state, "OutcomeUnknown");
  assert.equal((await followUps(lostRequest.id)).length, 1, "one follow-up stays open");
  assert.equal((await reconcile(crashed.id)).receipt.state, "Queued");
  await runCustomerMessageJobs();
  assert.equal((await latest(crashed.id)).state, "Sent");
  assert.deepEqual(
    (await readCustomerCommunication(coordinator, crashed.id)).history.map((h) => h.state),
    ["Prepared", "Queued", "OutcomeUnknown", "Queued", "Submitted", "Sent"],
  );
});

test("held messages are never silent: suppression, missing address, no recipient, late changes", async () => {
  const quiet = await contact("quinn@example.invalid");
  await assert.rejects(
    recordNoticePreference(coordinator, quiet, { ...base(), company_id: CRM.company, message_class: "DispatchNotice", preference: "DoNotNotify", expected_version: 1 }),
    { code: "VersionConflict" },
  );
  await recordNoticePreference(coordinator, quiet, { ...base("Customer replied asking to stop dispatch emails"), company_id: CRM.company, message_class: "DispatchNotice", preference: "DoNotNotify", expected_version: 0 });
  const prefs = await readNoticePreferences(coordinator, quiet, { company_id: CRM.company });
  const dispatch = prefs.classes.find((c) => c.message_class === "DispatchNotice")!;
  assert.equal(dispatch.preference, "DoNotNotify");
  assert.equal(dispatch.history[0].reason, "Customer replied asking to stop dispatch emails");
  assert.equal(dispatch.history[0].recorded_by, coordinator.display_name);
  assert.equal(prefs.classes.find((c) => c.message_class === "DelayNotice")!.basis, "NamedRecipient");
  const suppressed = await prepare(coordinator, testSource("DispatchNotice", demand, quiet));
  const noAddress = await prepare(coordinator, testSource("DispatchNotice", demand, await contact(null)));
  const nobody = await prepare(coordinator, testSource("DispatchNotice", demand, null, 7));
  for (const [m, reason] of [[suppressed, "DoNotNotify"], [noAddress, "MissingAddress"], [nobody, "NoRecipient"]] as const) {
    assert.equal(m.receipt.state, "Held");
    assert.equal((await latest(m.id)).hold_reason, reason);
    assert.equal((await followUps(m.id)).length, 1);
    await assert.rejects(
      confirmCustomerMessage(coordinator, m.id, { ...base(), expected_version: 1, content_hash: "0".repeat(64) }),
      { code: "MessageNotPrepared" },
    );
  }
  await withdrawCustomerMessage(coordinator, nobody.id, { ...base(), expected_version: 1 });
  assert.equal((await latest(nobody.id)).state, "Withdrawn");
  // A withdrawn message no longer blocks a successor for the same fact.
  assert.equal((await prepare(coordinator, testSource("DispatchNotice", demand, null, 7))).receipt.state, "Held");

  const later = await contact("lee@example.invalid");
  const afterConfirm = await prepare(coordinator, testSource("DispatchNotice", demand, later));
  await confirm(coordinator, afterConfirm.id);
  await recordNoticePreference(coordinator, later, { ...base(), company_id: CRM.company, message_class: "DispatchNotice", preference: "DoNotNotify", expected_version: 0 });
  await runCustomerMessageJobs();
  assert.equal((await latest(afterConfirm.id)).hold_reason, "DoNotNotify");
  assert.equal((await jobOf(afterConfirm.id)).status, "Blocked");
  assert.equal(await copies(afterConfirm.id), 0);

  const moved = await contact("max@example.invalid");
  const changed = await prepare(coordinator, testSource("DispatchNotice", demand, moved));
  await database().query("UPDATE ppo.people SET email='max.new@example.invalid' WHERE id=$1", [moved]);
  assert.equal((await confirm(coordinator, changed.id)).receipt.state, "Held");
  assert.equal((await latest(changed.id)).hold_reason, "RecipientChanged");

  const switched = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("oli@example.invalid")));
  await confirm(coordinator, switched.id);
  await setMessageClassSwitch(coordinator, { ...base("SYN stop the class at once"), company_id: CRM.company, message_class: "DispatchNotice", mode: "Off", expected_version: 1 });
  await runCustomerMessageJobs();
  assert.equal((await latest(switched.id)).hold_reason, "ClassSwitchedOff");
  assert.equal(await copies(switched.id), 0);
  await switchOn(coordinator, "DispatchNotice");
});

test("a reviewed project update needs an independent sender; reads follow the source record (R3)", async () => {
  const projectId = await project(coordinator);
  await assert.rejects(prepare(coordinator, testSource("ProjectUpdate", projectId, avery)), { code: "MessageClassOff" });
  await switchOn(coordinator, "ProjectUpdate");
  const unpublished = await prepare(coordinator, testSource("ProjectUpdate", projectId, avery, 1));
  assert.equal((await latest(unpublished.id)).hold_reason, "TemplateUnavailable");
  assert.equal((await message(unpublished.id)).body, null);
  await publishTemplate(coordinator, publisher, "ProjectUpdate", "Project update – progress this fortnight");
  const update = await prepare(coordinator, testSource("ProjectUpdate", projectId, avery, 2));
  assert.equal(update.receipt.state, "Prepared");
  await assert.rejects(confirm(coordinator, update.id), { code: "IndependentSenderRequired" });
  assert.equal((await confirm(publisher, update.id)).receipt.state, "Queued");
  await runCustomerMessageJobs();
  assert.equal((await latest(update.id)).state, "Sent");

  const byProject = await listCustomerCommunications(coordinator, { project_id: projectId });
  assert.deepEqual(byProject.items.map((i) => i.id).sort(), [unpublished.id, update.id].sort());
  const byDemand = await listCustomerCommunications(coordinator, { demand_id: demand });
  assert.ok(byDemand.items.length > 5 && byDemand.items.every((i) => i.source.type === "SupplyDemand"));
  const byCustomer = await listCustomerCommunications(coordinator, { organisation_id: CRM.org });
  assert.equal(byCustomer.items.length, byProject.items.length + byDemand.items.length);
  // A reader without Projects access sees the customer's order messages but not its project's.
  const supplyOnly = await principal("observer");
  const theirs = await listCustomerCommunications(supplyOnly, { organisation_id: CRM.org });
  assert.deepEqual(theirs.items.map((i) => i.id), byDemand.items.map((i) => i.id));
  await assert.rejects(readCustomerCommunication(supplyOnly, update.id), { code: "RecordUnavailable" });
  await assert.rejects(listCustomerCommunications(outsider, { project_id: projectId }), (e: { status: number }) => [403, 404].includes(e.status));
  await assert.rejects(listCustomerCommunications(coordinator, { project_id: projectId, demand_id: demand }), { code: "InvalidData" });
});

test("a correction succeeds a sent message; the ledger is append-only and SQL refuses other transitions", async () => {
  const sam = (await rows("SELECT id FROM ppo.people WHERE email='sam@example.invalid'"))[0].id;
  const sent = (await rows("SELECT id FROM ppo.customer_communications WHERE recipient_contact_id=$1", [sam]))[0].id;
  const prepared = await prepare(coordinator, testSource("DispatchNotice", demand, await contact("pat@example.invalid")));
  await assert.rejects(
    prepare(coordinator, testSource("DispatchNotice", demand, sam, 2), { supersedes_id: prepared.id }),
    { code: "CorrectionNotApplicable" },
  );
  const correction = await prepare(coordinator, testSource("DispatchNotice", demand, sam, 2), { supersedes_id: sent });
  const m = await message(correction.id);
  assert.equal(m.correction, true);
  assert.match(m.subject, /^\[SYN-PPO-SC-DEMAND-001\] Correction: Dispatch/);
  assert.match(m.body, /^This message corrects our earlier message about SYN-PPO-SC-DEMAND-001\./);

  await assert.rejects(database().query("UPDATE ppo.customer_communications SET body='edited' WHERE id=$1", [sent]), { code: "55000" });
  await assert.rejects(database().query("DELETE FROM ppo.customer_communication_events WHERE communication_id=$1", [sent]), { code: "55000" });
  const v = (await latest(prepared.id)).version;
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.customer_communication_events(id,workspace_id,communication_id,version,state,action,provider_message_id,actor_id,operation_id,reason,evidence) VALUES($1,$2,$3,$4,'Sent','Record','synthetic-x',$5,$6,'SYN','SYN')",
      [randomUUID(), CRM.workspace, prepared.id, v + 1, coordinator.actor_id, randomUUID()],
    ),
    { code: "23514" },
  );
  // Only the synthetic channel exists: no row can claim a real send.
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.customer_communications(id,workspace_id,company_id,site_id,organisation_id,message_class,review_class,source_type,source_id,source_reference,source_fact_version,recipient_role,facts,channel,owner_id,prepared_by,operation_id) VALUES($1,$2,$3,$4,$5,'DispatchNotice','Factual','SupplyDemand',$6,'SYN-PPO-SC-DEMAND-001',99,'SYN','{}','Graph',$7,$7,$8)",
      [randomUUID(), CRM.workspace, CRM.company, CRM.site, CRM.org, demand, CRM.owner, randomUUID()],
    ),
    (e: { code: string; constraint?: string }) => e.code === "23514" && e.constraint === "customer_communications_channel_check",
  );
});
