import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  acceptsPolicyEntry,
  acceptsPolicyReceipt,
  policyRecordHref,
} from "../../src/scheduling/policy-journal";
import type { JournalEntry } from "../../src/shared/lib/command-journal";
test("PL04 recovery allows only exact policy paths, stable targets and server publication identities", () => {
  const id = randomUUID(),
    operation = randomUUID();
  const entry: JournalEntry = {
    version: 1,
    scope: { actor_id: randomUUID(), workspace_id: randomUUID() },
    phase: "pending",
    record_id: id,
    target: policyRecordHref("review", id),
    label: "Publication",
    path: "schedule/policy-publications",
    body: {
      operation_id: operation,
      schema_version: 1,
      reason: "Synthetic test",
      review: { id },
      proposal: { id },
      source: { id },
      selected_policy: { id },
      expected_head_version: 1,
    },
  };
  assert(acceptsPolicyEntry(entry));
  assert(!acceptsPolicyEntry({ ...entry, path: "appointments/confirm" }));
  assert(!acceptsPolicyEntry({ ...entry, target: "https://invalid.example" }));
  assert(
    !acceptsPolicyEntry({
      ...entry,
      body: { ...entry.body, actor_id: randomUUID() },
    }),
  );
  const receipt = {
    operation_id: operation,
    record_id: randomUUID(),
    record_version: 1,
    state: "Published",
    receipt_id: randomUUID(),
    accepted_at: new Date().toISOString(),
  };
  assert(acceptsPolicyReceipt(entry, receipt));
  assert(!acceptsPolicyReceipt(entry, { ...receipt, state: "Proposed" }));
  assert(!acceptsPolicyReceipt(entry, { ...receipt, record_id: "invalid" }));
});
