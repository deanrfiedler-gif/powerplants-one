import assert from "node:assert/strict";
import { test } from "node:test";
import { syntheticBehaviour } from "../../src/adapters/synthetic-mailbox";
import {
  allowed,
  classRules,
  displayState,
  holdReasons,
  states,
  type State,
} from "../../src/communications/model";
import {
  contentHash,
  parseDefinition,
  render,
  sharedBindings,
  signOff,
  stopLine,
} from "../../src/communications/templates";

const definition = (over: Record<string, unknown> = {}) => ({
  schema_version: 1,
  family: "CUS-EMAIL",
  message_class: "DispatchNotice",
  audience: "Customer",
  subject: "[{{source.reference}}] Dispatch – your order",
  body: ["Hello {{recipient.name}},", "Your order for {{customer.name}} has left our store."],
  ...over,
});
const field = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as { field_errors: { field: string }[] }).field_errors[0].field;
  }
  return null;
};

test("CUS-EMAIL accepts only allowlisted customer-safe bindings (R6)", () => {
  assert.equal(parseDefinition(definition(), sharedBindings).family, "CUS-EMAIL");
  for (const internal of ["{{project.margin}}", "{{raid.commentary}}", "{{activity.summary}}", "{{technician.phone}}", "{{ recipient.name }}"])
    assert.equal(field(() => parseDefinition(definition({ body: [`Note ${internal}`] }), sharedBindings)), "definition.body.0", internal);
  assert.equal(field(() => parseDefinition(definition({ body: ["A stray { brace"] }), sharedBindings)), "definition.body.0");
  assert.equal(field(() => parseDefinition(definition({ audience: "Internal" }), sharedBindings)), "definition.audience");
  assert.equal(field(() => parseDefinition(definition({ family: "OUT-09" }), sharedBindings)), "definition.family");
  assert.equal(field(() => parseDefinition(definition({ extra: true }), sharedBindings)), "extra");
  assert.equal(field(() => parseDefinition(definition({ body: [] }), sharedBindings)), "definition.body");
});
test("subjects start with the bracketed confirmed reference on one line (R7)", () => {
  assert.equal(field(() => parseDefinition(definition({ subject: "Dispatch for {{source.reference}}" }), sharedBindings)), "definition.subject");
  assert.equal(field(() => parseDefinition(definition({ subject: "[{{source.reference}}] Two\nlines" }), sharedBindings)), "definition.subject");
  assert.equal(field(() => parseDefinition(definition({ subject: `[{{source.reference}}] ${"x".repeat(300)}` }), sharedBindings)), "definition.subject");
});
test("rendering is plain text, always ends with the stop instruction, and reports missing facts", () => {
  const d = parseDefinition(definition(), sharedBindings);
  const facts = { "source.reference": "SYN-PPO-SC-DEMAND-001", "recipient.name": "SYN Sam\n Receiver", "customer.name": "SYN Greenhouse", "site.name": null };
  const r = render(d, facts, false);
  assert.equal(r.subject, "[SYN-PPO-SC-DEMAND-001] Dispatch – your order");
  assert.equal(r.body, `Hello SYN Sam Receiver,\n\nYour order for SYN Greenhouse has left our store.\n\n${stopLine}\n\n${signOff}`);
  const missing = render(parseDefinition(definition({ body: ["At {{site.name}}"] }), sharedBindings), facts, false);
  assert.deepEqual(missing, { subject: null, body: null, missing: ["site.name"] });
  const correction = render(d, facts, true);
  assert.equal(correction.subject, "[SYN-PPO-SC-DEMAND-001] Correction: Dispatch – your order");
  assert.ok(correction.body!.startsWith("This message corrects our earlier message about SYN-PPO-SC-DEMAND-001.\n\nHello"));
  assert.equal(contentHash("a@example.invalid", r.subject!, r.body!), contentHash("a@example.invalid", r.subject!, r.body!));
  assert.notEqual(contentHash("a@example.invalid", r.subject!, r.body!), contentHash("b@example.invalid", r.subject!, r.body!));
});
test("the state table keeps prepared, sent, delivered and failed distinct (DOC-05, R4)", () => {
  assert.ok(allowed(null, "Prepare", "Prepared") && allowed(null, "Prepare", "Held"));
  assert.ok(!allowed(null, "Prepare", "Queued"));
  assert.ok(allowed("Prepared", "Confirm", "Queued"));
  assert.ok(!allowed("Prepared", "Record", "Sent"), "nothing is sent without a named sender");
  assert.ok(!allowed("Queued", "Withdraw", "Withdrawn"), "a confirmed message is in flight");
  assert.ok(!allowed("Submitted", "Record", "Delivered"), "accepted is not delivered");
  assert.ok(allowed("Sent", "Record", "Delivered") && allowed("Sent", "Record", "Failed"));
  assert.ok(!allowed("OutcomeUnknown", "Record", "Queued"), "only reconciliation can retry");
  assert.ok(allowed("OutcomeUnknown", "Reconcile", "Queued"));
  for (const terminal of ["Delivered", "Failed", "Withdrawn"] as State[])
    for (const to of states) for (const a of ["Confirm", "Hold", "Withdraw", "Record", "Reconcile"] as const) assert.ok(!allowed(terminal, a, to));
});
test("display states never claim delivery or a real send", () => {
  assert.equal(displayState("Sent", null), "Sent (simulated) — delivery not confirmed");
  for (const s of ["Queued", "Submitted", "Sent", "Delivered", "Failed"] as State[]) assert.match(displayState(s, null), /\(simulated\)/);
  for (const h of holdReasons) assert.match(displayState("Held", h), /^Held — not sent: /);
});
test("class rules: M1/M2 Supply, M3 waits for S5, M4 reviewed by Projects", () => {
  assert.deepEqual(
    Object.values(classRules).map((r) => [r.code, r.review, r.source_type, r.working]),
    [["M1", "Factual", "SupplyDemand", "supply.coordinate"], ["M2", "Factual", "SupplyDemand", "supply.coordinate"], ["M3", "Factual", null, "schedule.manage"], ["M4", "Reviewed", "Project", "project.edit"]],
  );
});
test("synthetic address tags choose simulated provider outcomes", () => {
  assert.equal(syntheticBehaviour("sam@example.invalid"), "Sent");
  assert.equal(syntheticBehaviour("sam+delivered@example.invalid"), "Delivered");
  assert.equal(syntheticBehaviour("sam+bounce@example.invalid"), "Bounced");
  assert.equal(syntheticBehaviour("sam+reject@example.invalid"), "Rejected");
  assert.equal(syntheticBehaviour("sam+lost-request@example.invalid"), "LostBeforeAcceptance");
  assert.equal(syntheticBehaviour("sam+lost-response@example.invalid"), "LostAfterAcceptance");
  assert.equal(syntheticBehaviour("sam+unknown@example.invalid"), "Sent");
});
