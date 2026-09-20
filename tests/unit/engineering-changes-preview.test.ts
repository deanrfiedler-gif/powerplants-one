import assert from "node:assert/strict";
import test from "node:test";
import type { Access, LoadedChange } from "../../src/engineering/changes/context";
import { buildPreview, type ProposedRequest } from "../../src/engineering/changes/preview";

// A preview and its confirmation are two separate reads of the same records. CI caught the confirmation of an unchanged
// preview refused as stale: the revision's sources were read without an order, came back in a different one, and the
// hash binding the two changed with them. Nothing that is hashed may depend on the order rows arrive in.
const snapshot = (reference: string) => ({ reference, revision: "C", file_version: "1.0", content_hash: "a".repeat(64), permitted_purpose: "Procurement", observed_at: "2026-09-20T05:30:00.000Z" });
const link = (source_id: string, role: string, reference: string) => ({ source_id, role, required: true, snapshot: snapshot(reference), live: { use: "Current", successor_id: null, content_hash: "a".repeat(64), readable: true } });
const links = [link("30000000-0000-4000-8000-0000000000c3", "Baseline", "E-201"), link("30000000-0000-4000-8000-0000000000a1", "Supporting", "TP-E201"), link("30000000-0000-4000-8000-0000000000b2", "Supporting", "CI-120")];

const loaded = (order: number[]) => ({
  row: { id: "c1", reference: "SYN-EN07-003", title: "Control interface revision", category: "SupplierProductChange", discipline: "Controls", location: "Irrigation Shed 01", system_name: "Controls" },
  revision: { revision_number: 1, submitted_hash: "b".repeat(64), content_hash: "b".repeat(64), state: "Decided", proposed_reference: "E-201", proposed_revision: "D", rationale: "SYN", options: [], selected_option: null, requires_revised_release: true },
  decision: { id: "d1", result: "Accepted", purpose: "Procurement", decided_at: new Date("2026-09-20T06:00:00.000Z"), policy_version: 1 },
  baseline: { snapshot: snapshot("E-201") }, issued: null, objects: [], links: order.map((i) => ({ ...links[i] })), verification: [],
  prerequisites: [{ kind: "Commercial", applicability: "Required", state: "Open" }, { kind: "Scheduling", applicability: "NotApplicable", state: "Open" }],
  condition: { condition: "Current", reasons: [] },
  facts: { stage: "DecisionRecorded", decision: "Accepted", source: "Current", return_kind: null, evidence_needed: false, prerequisites: [], requests: [], verification: [], requires_revised_release: true, revised_release_issued: false, overlap_conflict: false, context_kind: "Project" },
}) as unknown as LoadedChange;
const access = { pkg: { id: "p1", display_number: "SYN-PPO-ENG-000001", title: "SYN package", context_kind: "Project", context_reference: "SYN-PPO-PRJ-000001", customer_name: "SYN customer" }, site_name: "SYN site", policy: { policy_version: 1 } } as unknown as Access;
const request: ProposedRequest = { id: "r1", purpose: "PrepareRevisedRelease", destination: "TechnicalRelease", owner_id: "u1", requested_action: "SYN prepare and issue E-201 revision D.", due: null, amends_id: null };

test("EN07-A30 A36: an unchanged preview hashes the same whatever order the revision's sources are read in", () => {
  const first = buildPreview(loaded([0, 1, 2]), access, [request]);
  for (const order of [[2, 1, 0], [1, 0, 2], [2, 0, 1]]) {
    const again = buildPreview(loaded(order), access, [request]);
    assert.equal(again.preview_hash, first.preview_hash, `sources read as ${order.join(",")}`);
    assert.equal(again.requests[0].payload_hash, first.requests[0].payload_hash, `payload with sources read as ${order.join(",")}`);
    assert.deepEqual(again.requests[0].payload.sources, first.requests[0].payload.sources);
  }
  // One order, stated: the baseline's role first, then identity. A receiver reads the same list every time.
  assert.deepEqual(first.requests[0].payload.sources.map((s) => `${s.role}:${s.source_id.slice(-2)}`), ["Baseline:c3", "Supporting:a1", "Supporting:b2"]);
  assert.equal(first.confirm_label, "Request revised technical release");
});

test("EN07-A30: a preview still changes when what it binds changes", () => {
  const first = buildPreview(loaded([0, 1, 2]), access, [request]);
  const moved = loaded([0, 1, 2]);
  (moved.links[1] as unknown as { live: { use: string } }).live = { ...(moved.links[1] as unknown as { live: { use: string } }).live, use: "Superseded" };
  assert.notEqual(buildPreview(moved, access, [request]).preview_hash, first.preview_hash);
  assert.notEqual(buildPreview(loaded([0, 1, 2]), access, [{ ...request, requested_action: "SYN something else." }]).preview_hash, first.preview_hash);
});
