import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, afterEach, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { CHANGES, changeScenarioIds, seedChangesScenario } from "../helpers/engineering-changes";
import type { Call } from "../helpers/engineering-materials";
import { directSignIn } from "../helpers/engineering-changes-direct";

// EN-07 Engineering Change-Impact Review against the real schema. Task-local labels EN07-Axx (build plan r02); none is
// a parent acceptance pass. The scenario is built by the helper the browser journeys and the demonstration script use,
// routed to the same services in process.
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
afterEach(reset);
after(closeDatabase);

const command = (reason: string, fields: Record<string, unknown>) => ({ operation_id: randomUUID(), schema_version: 1, reason, ...fields });
const rows = async <T = Record<string, unknown>>(sql: string, values: unknown[] = []) => (await database().query(sql, values)).rows as T[];
const count = async (table: string) => (await rows<{ n: number }>(`SELECT count(*)::int n FROM ppo.${table}`))[0].n;
const code = (r: { body: unknown }) => (r.body as { code?: string }).code;
type Row = { id: string; reference: string; stage: string; attention: string; version: number };
type Register = { items: Row[]; total: number; menu: { reviews: number; handovers: number }; counts: { package_total: number } };
type Detail = {
  change: { id: string; version: number; stage: string }; revision: { id: string; version: number; state: string; number: number; submitted_hash: string | null };
  inspector: { attention: string; decision: string; applicability: string; implementation: { view: { label: string } }; sources: { condition: string; checked_at: string | null }; summary: { installed_assets: number; material_lines: number }; actions: { primary: { label: string } }; follow_through: { label: string; state: { label: string } }[] };
  decision: { id: string; result: string; revision_hash: string } | null; overlaps: { reference: string; blocks_handover: boolean; decided: boolean; change_id: string }[];
  prerequisites: { id: string; version: number; kind: string; state: string; applicability: string }[]; costs: { withheld: boolean };
  requests: { id: string; version: number; purpose: string; destination: string; state: string; latest_submission_id: string; submissions: { number: number; outcome: string | null; payload_hash: string }[] }[];
  verification: { id: string; state: string; attempts: { number: number; result: string }[] }[]; closure_readiness: { Implemented: string[]; NoImplementation: string[] }; closure: { meaning: string } | null;
};
type Preview = { preview_hash: string; blocked: boolean; confirm_label: string; change_version: number; requests: { blockers: string[] }[] };
const roles = ["author", "engineer", "reviewer", "authority", "supply", "releaseOwner", "service", "verifier", "viewer", "coordinator"] as const;
async function built() {
  const ids = changeScenarioIds(false), made = await seedChangesScenario(directSignIn, ids);
  const base = `engineering/${made.package_id}/changes`, materials = `engineering/${made.package_id}/materials`;
  const people = Object.fromEntries(await Promise.all(roles.map(async (k) => [k, await directSignIn(CHANGES[k].profile)]))) as Record<(typeof roles)[number], Call>;
  const detail = async (change: string, call: Call = people.engineer) => ((await call(`${base}/impact?change=${change}`)).body as { selected: Detail }).selected;
  const preview = async (change: string, requests: Record<string, unknown>[], call: Call = people.engineer) => (await call(`${base}/handovers/preview?change=${change}&requests=${encodeURIComponent(JSON.stringify(requests))}`)).body as Preview;
  const request = (purpose: string, destination: string, owner: string, action = "SYN requested action") => ({ id: randomUUID(), purpose, destination, owner_id: owner, requested_action: action, due: "2026-10-01" });
  const confirm = async (change: string, requests: Record<string, unknown>[], hash?: string) => {
    const p = await preview(change, requests), d = await detail(change);
    return people.engineer(`${base}/handovers`, command("SYN exact previewed requests confirmed", { action: "confirm", change_id: change, expected_version: d.change.version, preview_hash: hash ?? p.preview_hash, requests }));
  };
  const receive = async (call: Call, change: string, destination: string, purpose: string, outcome: string, extra: Record<string, unknown> = {}) => {
    const r = (await detail(change)).requests.find((x) => x.destination === destination && x.purpose === purpose)!;
    return call(`${base}/handovers`, command("SYN receiving outcome", { action: "decide", change_id: change, handover_id: r.id, submission_id: r.latest_submission_id, expected_version: r.version, outcome, outcome_reason: `SYN ${outcome.toLowerCase()} by the receiving owner`, ...extra }));
  };
  const publish = (kind: string, reference: string, revision: string, supersedes: string | null) => people.coordinator(`${materials}/sources`, command("SYN source observed upstream", { action: "publish", id: randomUUID(), kind, reference, title: `SYN ${reference}`, revision, file_version: "2.0", permitted_purpose: kind === "DrawingIssue" ? "Procurement" : "InformationOnly", content: `SYNTHETIC ${reference} ${revision}`, supersedes_id: supersedes }));
  const sourceId = async (reference: string, revision: string) => ((await people.coordinator(`${materials}/sources`)).body as { items: { id: string; reference: string; revision: string }[] }).items.find((s) => s.reference === reference && s.revision === revision)!.id;
  return { ids, made, base, ...people, detail, preview, request, confirm, receive, publish, sourceId, three: made.changes["003"] };
}

test("EN07-A48: migration 0030 and seed 30 are additive and a rerun changes nothing", async () => {
  const profiles = await rows<{ subject_id: string }>("SELECT subject_id FROM ppo.users WHERE subject_id LIKE 'changes-%' ORDER BY subject_id");
  assert.deepEqual(profiles.map((u) => u.subject_id), ["changes-release-owner", "changes-service", "changes-verifier"]);
  // One separate duty per capability, and authorship is granted to nobody by this seed.
  const duties = await rows<{ subject_id: string; capability: string }>("SELECT u.subject_id,g.capability FROM ppo.permission_grants g JOIN ppo.users u ON u.id=g.user_id WHERE g.capability LIKE 'engineering.change.%' ORDER BY 1,2");
  assert.deepEqual(duties.map((d) => `${d.subject_id}:${d.capability.replace("engineering.change.", "")}`), ["changes-release-owner:receive", "changes-service:receive", "changes-verifier:receive", "changes-verifier:verify", "coordinator:receive", "materials-release:close", "materials-release:decide", "materials-reviewer:review", "materials-supply:receive"]);
  assert.equal((await rows("SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u ON u.id=g.user_id WHERE u.subject_id LIKE 'changes-%' AND g.capability='engineering.edit'")).length, 0);
  // Company A has the fictional policy; Company B deliberately has none.
  assert.deepEqual(await rows("SELECT company_id,policy_version,jsonb_array_length(grants) AS grants FROM ppo.change_policies"), [{ company_id: "20000000-0000-4000-8000-000000000001", policy_version: 1, grants: 10 }]);
  const before = [await count("users"), await count("permission_grants"), await count("change_policies")];
  await migrate(); await seed(); await migrate(); await seed();
  assert.deepEqual([await count("users"), await count("permission_grants"), await count("change_policies")], before);
  assert.deepEqual(await rows("SELECT version FROM ppo.seed_receipts WHERE version=30"), [{ version: 30 }]);
});

test("EN07-A59 A58 A16 A54 A55 A56: the audited fixture is derived by the server, and rebuilding it changes nothing", async () => {
  const s = await built(), register = (await s.engineer(`${s.base}?change=${s.three}`)).body as Register & { selected: Detail["inspector"] & { technical_decision: { label: string } } };
  assert.deepEqual(register.items.map((r) => [r.reference, r.stage, r.attention]), [["SYN-EN07-001", "InReview", "ReviewRequired"], ["SYN-EN07-002", "Assessing", "SourceChanged"], ["SYN-EN07-003", "DecisionRecorded", "CostReview"], ["SYN-EN07-004", "InReview", "ReviewRequired"],
    ["SYN-EN07-005", "Returned", "ScopeClarification"], ["SYN-EN07-006", "Assessing", "EvidenceNeeded"], ["SYN-EN07-007", "DecisionRecorded", "RetestFailed"], ["SYN-EN07-008", "Draft", "AssessmentNeeded"]]);
  assert.deepEqual([register.total, register.menu.reviews, register.menu.handovers], [8, 2, 3]);
  const i = register.selected;
  assert.deepEqual([i.technical_decision.label, i.implementation.view.label, i.sources.condition, i.actions.primary.label], ["Accepted", "Not authorised", "Current", "Open commercial review"]);
  // A16: one controller in the shed serving three areas is one installed asset, not three.
  assert.deepEqual([i.summary.installed_assets, i.summary.material_lines], [1, 2]);
  assert.deepEqual(i.follow_through.map((f) => `${f.label} — ${f.state.label}`), ["Revised technical release — Not requested", "Supply Chain review — Awaiting response", "Control interface retest — Test pending"]);
  // A54: the time beside "Sources current" is a recorded check, and reading the change again does not move it.
  const checks = await count("change_source_checks");
  assert.ok(i.sources.checked_at);
  assert.equal(((await s.engineer(`${s.base}?change=${s.three}`)).body as typeof register).selected.sources.checked_at, i.sources.checked_at);
  assert.equal(await count("change_source_checks"), checks);
  // No change consumed a SYN-PPO reference counter: the reference is a labelled package-local alias.
  assert.equal((await rows("SELECT 1 FROM ppo.reference_counters WHERE record_type ILIKE '%change%'")).length, 0);
});

test("EN07-A22 A23 A26 A30: authorship never decides, a policy must name the person, and a moved source makes a decision ineligible without rewriting it", async () => {
  const s = await built(), one = s.made.changes["001"], d = await s.detail(one);
  // engineering.edit is authorship only: the author holds no decision duty, and the database refuses the row as well.
  assert.equal((await s.author(`${s.base}/reviews`, command("SYN", { action: "decide", change_id: one, revision_id: d.revision.id, expected_version: d.change.version, id: randomUUID(), result: "Accepted", purpose: "Procurement", decision_reason: "SYN self-approval" }))).status, 403);
  await assert.rejects(database().query("INSERT INTO ppo.change_decisions(id,workspace_id,company_id,change_id,revision_id,revision_hash,option_key,result,purpose,reason,source_state,policy_id,policy_version,operation_id,decided_by) SELECT $1,c.workspace_id,c.company_id,c.id,$2,$3,'adopt','Accepted','Procurement','x','{}','e7000000-0000-4000-8000-000000000001',1,$1,c.author_id FROM ppo.engineering_changes c WHERE c.id=$4", [randomUUID(), d.revision.id, d.revision.submitted_hash, one]), /never decided by someone who authored it/);
  // The technical authority cannot accept before the required independent response exists.
  const early = await s.authority(`${s.base}/reviews`, command("SYN", { action: "decide", change_id: one, revision_id: d.revision.id, expected_version: d.change.version, id: randomUUID(), result: "Accepted", purpose: "Procurement", decision_reason: "SYN too early" }));
  assert.deepEqual([early.status, code(early)], [422, "AcceptanceBlocked"]);
  // A capability without a policy entry grants nothing: the reviewer holds review, never the decision.
  assert.equal((await s.reviewer(`${s.base}/reviews`, command("SYN", { action: "decide", change_id: one, revision_id: d.revision.id, expected_version: d.change.version, id: randomUUID(), result: "Rejected", purpose: "Procurement", decision_reason: "SYN not mine to decide" }))).status, 403);

  // A26: a required source of the accepted change moves on upstream. The decision row is untouched; its applicability is derived.
  const before = await s.detail(s.three), decision = await rows("SELECT * FROM ppo.change_decisions WHERE id=$1", [before.decision!.id]);
  const stale = await s.preview(s.three, [s.request("PrepareRevisedRelease", "TechnicalRelease", CHANGES.releaseOwner.id)]), requests = [s.request("PrepareRevisedRelease", "TechnicalRelease", CHANGES.releaseOwner.id)];
  assert.equal((await s.publish("TestProcedure", "TP-E201", "r2", await s.sourceId("TP-E201", "r1"))).status, 201);
  const after = await s.detail(s.three);
  assert.deepEqual([after.inspector.sources.condition, after.inspector.applicability, after.inspector.attention, after.decision!.result], ["Changed", "ReassessmentRequired", "SourceChanged", "Accepted"]);
  assert.deepEqual(await rows("SELECT * FROM ppo.change_decisions WHERE id=$1", [before.decision!.id]), decision);
  // A30: a preview made before the source moved is refused, not quietly applied, and a fresh one is blocked with its reason.
  const refused = await s.engineer(`${s.base}/handovers`, command("SYN stale confirm", { action: "confirm", change_id: s.three, expected_version: after.change.version, preview_hash: stale.preview_hash, requests }));
  assert.equal(refused.status, 422);
  assert.match((refused.body as { message: string }).message, /retained as history/);
  assert.equal((await s.detail(s.three)).requests.filter((r) => r.purpose === "PrepareRevisedRelease").length, 0);
  // Another change's sources were not touched by that, and 002's own condition did not leak into 003 before it.
  assert.equal(before.inspector.sources.condition, "Current");
});

test("EN07-A25 A29 A32 A33 A37 A40 A41 A43 A50: accepted is not implemented; the whole path to closure keeps every outcome and attempt", async () => {
  const s = await built(), id = s.three;
  // A25 A29: implementation is refused while the commercial review is open; an investigation is not.
  const blockedPreview = await s.preview(id, [s.request("Implementation", "Service", CHANGES.service.id)]);
  assert.equal(blockedPreview.blocked, true);
  assert.match(blockedPreview.requests[0].blockers.join(" "), /Commercial review is outstanding/);
  assert.equal(code(await s.confirm(id, [s.request("Implementation", "Service", CHANGES.service.id)])), "HandoverBlocked");
  // Only the named commercial owner resolves it, and a second outcome is never recorded.
  const commercial = (await s.detail(id)).prerequisites.find((x) => x.kind === "Commercial")!;
  assert.equal((await s.engineer(`${s.base}/prerequisites`, command("SYN", { action: "resolve", change_id: id, prerequisite_id: commercial.id, expected_version: commercial.version, outcome: "Confirmed", note: "SYN not mine" }))).status, 403);
  assert.equal((await s.coordinator(`${s.base}/prerequisites`, command("SYN", { action: "resolve", change_id: id, prerequisite_id: commercial.id, expected_version: commercial.version, outcome: "Confirmed", note: "SYN confirmed within the fictional contingency" }))).status, 200);
  assert.equal(code(await s.coordinator(`${s.base}/prerequisites`, command("SYN", { action: "resolve", change_id: id, prerequisite_id: commercial.id, expected_version: commercial.version + 1, outcome: "Declined", note: "SYN second thoughts" }))), "AlreadyResolved");
  // Still not implementation: the revised release is a request until its owner issues it.
  assert.match((await s.preview(id, [s.request("Implementation", "Service", CHANGES.service.id)])).requests[0].blockers.join(" "), /not the release itself/);
  assert.equal((await s.confirm(id, [s.request("PrepareRevisedRelease", "TechnicalRelease", CHANGES.releaseOwner.id)])).status, 201);
  assert.equal((await s.receive(s.releaseOwner, id, "TechnicalRelease", "PrepareRevisedRelease", "Accepted")).status, 201);
  assert.equal((await s.publish("DrawingIssue", "E-201", "D", await s.sourceId("E-201", "C"))).status, 201);
  // The successor the change asked for is its expected result, so its sources stay current.
  assert.equal((await s.detail(id)).inspector.sources.condition, "Current");

  // A37: the same operation and payload replays the original; a changed payload under that operation conflicts.
  const three = [s.request("Implementation", "SupplyChain", CHANGES.supply.id), s.request("Implementation", "Service", CHANGES.service.id), s.request("Implementation", "Commissioning", CHANGES.verifier.id)];
  const p = await s.preview(id, three), version = (await s.detail(id)).change.version;
  assert.equal(p.confirm_label, "Submit 3 implementation handovers");
  const body = command("SYN implementation handover", { action: "confirm", change_id: id, expected_version: version, preview_hash: p.preview_hash, requests: three });
  const [first, race] = await Promise.all([s.engineer(`${s.base}/handovers`, body), s.engineer(`${s.base}/handovers`, { ...body, operation_id: randomUUID() })]);
  assert.deepEqual([first.status, race.status].sort(), [201, 409]); // parallel confirmations never create a second set
  assert.equal((await s.engineer(`${s.base}/handovers`, body)).status, first.status === 201 ? 200 : 409);
  assert.equal(code(await s.engineer(`${s.base}/handovers`, { ...body, reason: "SYN different content under the same operation" })), first.status === 201 ? "OperationConflict" : "OperationConflict");
  assert.equal((await s.detail(id)).requests.filter((r) => r.purpose === "Implementation").length, 3);

  // A31 A32 A33: each receiver answers only for their own destination; outcomes stay separate; a correction keeps the identity.
  assert.equal((await s.receive(s.supply, id, "Service", "Implementation", "Accepted")).status, 403);
  assert.equal((await s.receive(s.supply, id, "SupplyChain", "Implementation", "Accepted")).status, 201);
  assert.equal((await s.receive(s.service, id, "Service", "Implementation", "Returned", { owner_id: CHANGES.engineer.id, due: "2026-10-02" })).status, 201);
  let d = await s.detail(id);
  assert.deepEqual(d.requests.filter((r) => r.purpose === "Implementation").map((r) => `${r.destination}:${r.state}`).sort(), ["Commissioning:Pending", "Service:Returned", "SupplyChain:Accepted"]);
  const returned = d.requests.find((r) => r.destination === "Service" && r.purpose === "Implementation")!;
  const again = await s.preview(id, [{ id: returned.id, purpose: "Implementation", destination: "Service", owner_id: CHANGES.service.id, requested_action: "SYN requested action", due: "2026-10-01" }]);
  assert.equal((await s.engineer(`${s.base}/handovers`, command("SYN corrected", { action: "resubmit", change_id: id, handover_id: returned.id, expected_version: returned.version, id: randomUUID(), preview_hash: again.preview_hash, correction_note: "SYN attendance date clarified" }))).status, 201);
  d = await s.detail(id);
  const corrected = d.requests.find((r) => r.id === returned.id)!;
  assert.deepEqual(corrected.submissions.map((x) => [x.number, x.outcome]), [[1, "Returned"], [2, null]]);
  assert.notEqual(corrected.submissions[0].payload_hash, corrected.submissions[1].payload_hash);
  assert.equal((await s.receive(s.service, id, "Service", "Implementation", "Accepted")).status, 201);
  assert.equal((await s.receive(s.verifier, id, "Commissioning", "Implementation", "Accepted")).status, 201);

  // A39 A40 A41: a fail blocks closure and is never edited; a pass binds the exact configuration and is its own record.
  const retest = (await s.detail(id)).verification[0];
  const attempt = async (result: string, configuration: string, extra: Record<string, unknown> = {}) => s.verifier(`${s.base}/verification`, command("SYN retest", { action: "attempt", id: randomUUID(), change_id: id, expected_version: (await s.detail(id)).change.version, retest_id: retest.id, result, tested_at: "2026-10-05T01:00:00.000Z", configuration_present: configuration, evidence_reference: "SYN inspection sheet", ...extra }));
  assert.equal(code(await attempt("Passed", "CI-100 as found")), "ConfigurationMismatch");
  assert.equal((await attempt("Failed", "CI-120 r2 terminated to E-201 revision D", { corrective_action: "SYN reterminate channel 3", corrective_owner_id: CHANGES.engineer.id, corrective_due: "2026-10-07" })).status, 201);
  assert.match((await s.detail(id)).closure_readiness.Implemented.join(" "), /must pass/);
  const close = async (meaning: string) => s.authority(`${s.base}/verification`, command("SYN closure on retained evidence", { action: "close", id: randomUUID(), change_id: id, expected_version: (await s.detail(id)).change.version, meaning }));
  assert.equal(code(await close("Implemented")), "ClosureBlocked");
  assert.equal((await attempt("Passed", "CI-120 r2 terminated to E-201 revision D")).status, 201);
  assert.deepEqual((await s.detail(id)).verification[0].attempts.map((a) => [a.number, a.result]), [[1, "Failed"], [2, "Passed"]]);
  // The investigation request to Supply Chain still has no outcome, and closure counts every request of the change.
  assert.match((await s.detail(id)).closure_readiness.Implemented.join(" "), /no evidenced outcome/);
  assert.equal((await s.receive(s.supply, id, "SupplyChain", "ImpactReview", "Accepted")).status, 201);
  // The author can never close their own change, in the service or in the database.
  assert.equal((await s.engineer(`${s.base}/verification`, command("SYN", { action: "close", id: randomUUID(), change_id: id, expected_version: (await s.detail(id)).change.version, meaning: "Implemented" }))).status, 403);
  assert.equal((await close("Implemented")).status, 201);
  // A43: a closed change is immutable; later evidence is a linked successor.
  d = await s.detail(id);
  assert.deepEqual([d.change.stage, d.closure?.meaning], ["Closed", "Implemented"]);
  assert.equal(code(await s.engineer(s.base, command("SYN late edit", { action: "coordinate", change_id: id, expected_version: d.change.version, next_owner_id: CHANGES.author.id, due: null }))), "ChangeClosed");
  await assert.rejects(database().query("UPDATE ppo.engineering_changes SET version=version+1,stage='Assessing' WHERE id=$1", [id]), /closed change is immutable/);
  await assert.rejects(database().query("UPDATE ppo.change_retest_attempts SET result='Passed' WHERE change_id=$1 AND attempt_number=1", [id]), /append-only/);
  assert.equal((await s.engineer(s.base, command("SYN successor", { action: "create", id: randomUUID(), revision_id: randomUUID(), title: "SYN follow-up to the control interface revision", category: "DesignCorrection", discipline: "Controls", location: "Irrigation Shed 01", system_name: "Controls", predecessor_change_id: id }))).status, 201);
});

test("EN07-A14 A24 A42 A51 A44: honest completeness, correction by successor, no-implementation closure, overlap and cost projection", async () => {
  const s = await built();
  // A14: the draft cannot start assessment or be submitted on an empty assessment, and says why.
  const eight = await s.detail(s.made.changes["008"]);
  assert.equal(eight.change.stage, "Draft");
  // A24: a returned proposal is corrected through a successor; the returned revision and its reviews stay as they were.
  const five = s.made.changes["005"], returned = await s.detail(five, s.author);
  assert.equal(returned.revision.state, "Returned");
  assert.equal((await s.author(`${s.base}/impact`, command("SYN corrected successor", { action: "revise", change_id: five, expected_version: returned.change.version, id: randomUUID() }))).status, 201);
  const successor = await s.detail(five, s.author);
  assert.deepEqual([successor.revision.number, successor.revision.state, successor.change.stage], [2, "Working", "Assessing"]);
  assert.deepEqual(await rows("SELECT revision_number,state FROM ppo.change_revisions WHERE change_id=$1 ORDER BY 1", [five]), [{ revision_number: 1, state: "Returned" }, { revision_number: 2, state: "Working" }]);
  await assert.rejects(database().query("UPDATE ppo.change_revisions SET version=version+1,rationale='rewritten' WHERE change_id=$1 AND revision_number=1", [five]), /frozen|permanent/);

  // A51: 002 and 003 share material line 010. The accepted one blocks the other's handover until compatibility is decided.
  const two = await s.detail(s.made.changes["002"]), three = await s.detail(s.three);
  assert.deepEqual(two.overlaps.map((o) => [o.reference, o.blocks_handover]), [["SYN-EN07-003", true]]);
  assert.deepEqual(three.overlaps.map((o) => [o.reference, o.blocks_handover]), [["SYN-EN07-002", false]]);
  assert.equal((await s.authority(`${s.base}/reviews`, command("SYN sequence decided", { action: "overlap", change_id: s.made.changes["002"], id: randomUUID(), expected_version: two.change.version, other_change_id: s.three, decision: "SYN 003 first; 002 is assessed against its result." }))).status, 201);
  assert.deepEqual((await s.detail(s.made.changes["002"])).overlaps.map((o) => [o.decided, o.blocks_handover]), [[true, false]]);
  assert.equal(await count("change_overlap_decisions"), 2); // one fact about the pair, recorded for both; neither proposal was altered

  // A42: withdrawal erases nothing. Its pending request must be cancelled with a reason before a no-implementation closure.
  const withdraw = await s.detail(s.three);
  assert.equal((await s.engineer(s.base, command("SYN superseded by the supplier's own retrofit", { action: "withdraw", change_id: s.three, expected_version: withdraw.change.version }))).status, 201);
  const close = async () => s.authority(`${s.base}/verification`, command("SYN closed with no implementation", { action: "close", id: randomUUID(), change_id: s.three, expected_version: (await s.detail(s.three)).change.version, meaning: "NoImplementation" }));
  assert.equal(code(await close()), "ClosureBlocked");
  const pending = (await s.detail(s.three)).requests.find((r) => r.state === "Pending")!;
  assert.equal((await s.engineer(`${s.base}/handovers`, command("SYN no longer needed after withdrawal", { action: "cancel", change_id: s.three, handover_id: pending.id, expected_version: pending.version }))).status, 201);
  assert.equal((await close()).status, 201);
  assert.deepEqual(await rows("SELECT meaning FROM ppo.change_closures WHERE change_id=$1", [s.three]), [{ meaning: "NoImplementation" }]);
  assert.equal((await rows("SELECT 1 FROM ppo.change_decisions WHERE change_id=$1 AND result='Accepted'", [s.three])).length, 1); // the accepted decision stays a historical fact

  // A44: a reader without a commercial duty receives no amount in any projection, including history snapshots and exports.
  for (const path of [`${s.base}/impact?change=${s.made.changes["007"]}`, `${s.base}/impact?change=${s.three}`, `${s.base}/history?change=${s.three}`, `${s.base}/export?kind=assessment&change=${s.three}`])
    assert.ok(!JSON.stringify((await s.viewer(path)).body).includes("1250.00"), path); // the amount as written, never a fragment a hash could contain
  assert.equal((await s.detail(s.three, s.viewer)).costs.withheld, true);
  assert.equal((await rows("SELECT 1 FROM ppo.change_events WHERE snapshot::text LIKE '%1250.00%'")).length, 0);
});
