import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  inMessageView,
  messageCounts,
  messageFactLabel,
  messageFactValue,
  messageRecipientName,
  messageRecipientAddress,
  messageSubject,
  messageState,
  sourceHref,
  messageDate,
  type MessageRow,
} from "../../src/communications/ui-model";
import { ecMessage, ecQueue } from "../helpers/customer-messages-fixture";
import { states } from "../../src/communications/model";
test("EC-04 queue views keep unknown and terminal outcomes out of To send", () => {
  for (const state of states) {
    assert.equal(inMessageView({ state }, "to-send"), state === "Prepared");
    assert.equal(
      inMessageView({ state }, "follow-up"),
      ["Held", "Failed", "OutcomeUnknown"].includes(state),
    );
    assert.equal(inMessageView({ state }, "all"), true);
  }
});
test("EC-04 states qualify simulation, positive evidence and bounce facts", () => {
  assert.equal(
    messageState({ state: "Sent", hold_reason: null }),
    "Sent (simulated) · delivery not confirmed",
  );
  assert.equal(
    messageState({ state: "Held", hold_reason: "DoNotNotify" }),
    "Held · do not notify",
  );
  assert.equal(
    messageState({ state: "OutcomeUnknown", hold_reason: null }),
    "Outcome unknown",
  );
  assert.match(
    messageState({
      state: "Failed",
      hold_reason: null,
      last_evidence: "Synthetic non-delivery report",
    }),
    /bounced/,
  );
  assert.doesNotMatch(
    messageState({
      state: "Failed",
      hold_reason: null,
      last_evidence: "Recipient rejected",
    }),
    /bounced/,
  );
  assert.match(
    messageState({ state: "Delivered", hold_reason: null }),
    /simulated.*positive evidence/,
  );
});
test("EC-04 source handovers use native identities and Brisbane dates", () => {
  const m = { source: { id: "source-id", type: "SupplyDemand" } } as MessageRow;
  assert.equal(sourceHref(m), "/supply/material-readiness?record=source-id");
  assert.match(messageDate("2026-10-31T23:30:00Z"), /1 Nov 2026/);
});
test("customer communication commands and worker have only the synthetic channel", () => {
  const adapter = readFileSync("src/adapters/synthetic-mailbox.ts", "utf8");
  assert.match(
    adapter,
    /customerMessageChannel[\s\S]*new SyntheticMailboxChannel/,
  );
  for (const name of [
    "src/adapters/synthetic-mailbox.ts",
    "src/communications/service.ts",
    "src/communications/worker.ts",
    "src/communications/reads.ts",
    "src/communications/switches.ts",
  ]) {
    const source = readFileSync(name, "utf8");
    assert.doesNotMatch(
      source,
      /\bfetch\s*\(|node:https|node:http|@microsoft|graph\.microsoft|smtp|nodemailer/,
    );
  }
});

test("EC-04 action counts disclose a full window, including zero matching readable rows", () => {
  const queue = ecQueue([ecMessage(1), ecMessage(2, "Held")]);
  assert.deepEqual(messageCounts(queue), { "to-send": 1, "follow-up": 1 });
  assert.deepEqual(messageCounts({ ...queue, limit_reached: true }), { "to-send": "1+", "follow-up": "1+" });
  assert.deepEqual(messageCounts({ ...queue, items: [], limit_reached: true }), { "to-send": "0+", "follow-up": "0+" });
  assert.equal(messageCounts(null), undefined);
});
test("EC-04 dialog and exact message use explicit missing-content fallbacks", () => {
  assert.equal(messageRecipientName(null), "No named contact");
  assert.equal(messageRecipientAddress(null), "no address");
  assert.equal(messageSubject(null), "No exact content was prepared");
  assert.equal(messageRecipientName("SYN Sasha"), "SYN Sasha");
  assert.equal(messageRecipientAddress("syn@example.invalid"), "syn@example.invalid");
  assert.equal(messageSubject("SYN exact subject"), "SYN exact subject");
});
test("EC-04 facts use plain labels, readable unknown keys and Brisbane ETA dates", () => {
  assert.equal(messageFactLabel("dispatch.tracking_number"), "Consignment");
  assert.equal(messageFactLabel("customer.name"), "Customer");
  assert.equal(messageFactLabel("future.delivery_window"), "Future delivery window");
  assert.equal(messageFactValue("delivery.customer_eta", "2026-11-03"), messageDate("2026-11-03"));
  assert.equal(messageFactValue("delay.previous_eta", "2026-11-02"), messageDate("2026-11-02"));
  assert.equal(messageFactValue("dispatch.tracking_number", "SYN-4471"), "SYN-4471");
  assert.equal(messageFactValue("delivery.customer_eta", null), "Not recorded");
});
