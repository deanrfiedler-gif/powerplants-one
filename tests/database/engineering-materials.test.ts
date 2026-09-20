import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, afterEach, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { MATERIALS, scenarioIds, seedMaterialsScenario, type Call } from "../helpers/engineering-materials";
import { directSignIn } from "../helpers/engineering-materials-direct";

// EN-06 Released Materials & Substitutions against the real schema. Task-local labels EN06-Axx (build plan r02);
// none is a parent acceptance pass. The scenario is built by the helper the browser journeys and the demonstration
// script use, routed to the same services in process.
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
type Item = { id: string; version: number; line_number: string; mapping: string; content_revision: number; readiness: { code: string } };
type Register = { items: Item[]; counts: { all: number; ready: number; attention: number }; menu: { substitutions_open: number }; set: { status: string }; footer: { technical_release: string } };
async function built(fixed = false) {
  const ids = scenarioIds(fixed);
  await seedMaterialsScenario(directSignIn, ids);
  const base = `engineering/${ids.package}/materials`, people = Object.fromEntries(await Promise.all((["author", "engineer", "reviewer", "release", "supply", "viewer", "coordinator"] as const).map(async (k) => [k, await directSignIn(MATERIALS[k].profile)]))) as Record<"author" | "engineer" | "reviewer" | "release" | "supply" | "viewer" | "coordinator", Call>;
  const register = async (call: Call = people.author) => (await call(`${base}?set=${ids.set}&page_size=100`)).body as Register;
  const lines = async () => new Map((await register()).items.map((i) => [i.line_number, i]));
  return { ids, base, ...people, register, lines };
}
// Prepare, submit, review, authorise. Each step is a different person, and each reports a first acceptance.
async function authorised(s: Awaited<ReturnType<typeof built>>, selection: { line_id: string; quantity: string }[], extra: Record<string, unknown> = {}) {
  const id = randomUUID(), path = `${s.base}/releases`;
  for (const [who, body] of [
    [s.author, { action: "prepare", id, set_id: s.ids.set, purpose: "TechnicalReleaseForProcurement", audience: "SYN Supply Chain", selection, ...extra }], [s.author, { action: "submit", release_id: id, expected_version: 1 }],
    [s.reviewer, { action: "review", release_id: id, expected_version: 2, result: "Accepted", rationale: "SYN exact manifest inspected." }], [s.release, { action: "authorise", release_id: id, expected_version: 3 }],
  ] as const) assert.equal((await who(path, command("SYN release step", body))).status, 201, JSON.stringify(body));
  return id;
}

test("EN06-A46: migration 0029 and seed 29 are additive and a rerun changes nothing", async () => {
  const profiles = await rows<{ subject_id: string; display_name: string }>("SELECT subject_id,display_name FROM ppo.users WHERE subject_id LIKE 'materials-%' ORDER BY subject_id");
  assert.deepEqual(profiles.map((u) => u.subject_id), ["materials-author", "materials-engineer", "materials-release", "materials-reviewer", "materials-supply", "materials-viewer"]);
  // One separate duty per profile; editing is never reviewing, releasing or receiving.
  const duties = await rows<{ subject_id: string; capability: string }>("SELECT u.subject_id,g.capability FROM ppo.permission_grants g JOIN ppo.users u ON u.id=g.user_id WHERE g.capability LIKE 'engineering.material.%' ORDER BY 1,2");
  assert.deepEqual(duties.map((d) => `${d.subject_id}:${d.capability}`), ["coordinator:engineering.material.source", "materials-release:engineering.material.release", "materials-reviewer:engineering.material.review", "materials-supply:engineering.material.receive", "second-company:engineering.material.source"]);
  const editors = await rows<{ subject_id: string }>("SELECT u.subject_id FROM ppo.permission_grants g JOIN ppo.users u ON u.id=g.user_id WHERE g.capability='engineering.edit' AND u.subject_id LIKE 'materials-%' ORDER BY 1");
  assert.deepEqual(editors.map((e) => e.subject_id), ["materials-author", "materials-engineer"]);
  // Company A has the fictional policy; Company B deliberately has none.
  assert.deepEqual(await rows("SELECT company_id,policy_version,allow_reviewer_release_overlap,jsonb_array_length(grants) AS grants FROM ppo.material_policies"), [{ company_id: "20000000-0000-4000-8000-000000000001", policy_version: 1, allow_reviewer_release_overlap: false, grants: 3 }]);
  const before = [await count("users"), await count("permission_grants"), await count("material_policies")];
  await migrate(); await seed(); await migrate(); await seed();
  assert.deepEqual([await count("users"), await count("permission_grants"), await count("material_policies")], before);
  assert.deepEqual(await rows("SELECT version FROM ppo.seed_receipts WHERE version=29"), [{ version: 29 }]);
});

test("EN06-A01 A05 A38 A40: the scenario derives the r04 figures, survives a reconnect, and a rerun is a replay", async () => {
  const s = await built(true), first = await s.register();
  assert.deepEqual([first.counts.all, first.counts.ready, first.counts.attention, first.menu.substitutions_open, first.set.status, first.footer.technical_release], [8, 5, 3, 2, "Draft", "Not issued"]);
  assert.deepEqual(first.items.map((i) => `${i.line_number}:${i.readiness.code}`), ["010:ReadyForReview", "020:ReadyForReview", "030:EvidenceNeeded", "040:MappingNeeded", "050:ReadyForReview", "060:ReadyForReview", "070:ReadyForReview", "080:ScopeDecision"]);
  // A05: the pump serves three areas and is still one pump.
  assert.deepEqual(await rows("SELECT quantity::text,jsonb_array_length(served_areas) AS served FROM ppo.material_lines WHERE id=$1", [s.ids.lines["010"]]), [{ quantity: "1.000000", served: 3 }]);
  const events = await count("material_events"), receipts = await count("operation_receipts");
  await seedMaterialsScenario(directSignIn, s.ids);
  assert.deepEqual([await count("material_events"), await count("operation_receipts")], [events, receipts]);
  // A restart, as far as the database can tell: every connection is dropped and the records are read again.
  await closeDatabase();
  assert.deepEqual((await s.register()).counts, first.counts);
  assert.equal((await rows<{ n: number }>("SELECT count(*)::int n FROM ppo.material_events WHERE event_type='LineCreated'"))[0].n, 9);
});

test("EN06-A04 A24 A41: scope, duty and restricted projection are decided on the server for reads, commands and receipts", async () => {
  const s = await built(), other = await directSignIn("second-company"), l = await s.lines();
  for (const path of ["", "/lines?line_id=" + l.get("030")!.id, "/mapping", "/substitutions", "/releases", "/handover", "/history", "/sources", "/people"]) assert.equal((await other(`${s.base}${path}`)).status, 404, path);
  assert.equal((await other(`${s.base}/lines`, command("SYN", { action: "remove", line_id: l.get("070")!.id, expected_version: l.get("070")!.version, removed_reason: "x" }))).status, 404);
  assert.deepEqual(((await other("engineering/materials")).body as { items: unknown[] }).items, []);
  assert.equal((await s.viewer(s.base)).status, 200);
  for (const [path, body] of [["", { action: "create", id: randomUUID(), set_code: "C", revision: 1, title: "SYN" }], ["/sources", { action: "withdraw", source_id: s.ids.basis }], ["/releases", { action: "prepare", id: randomUUID(), set_id: s.ids.set, purpose: "InformationOnly", audience: "SYN", selection: [{ line_id: l.get("070")!.id, quantity: "1" }] }]] as const)
    assert.deepEqual([(await s.viewer(`${s.base}${path}`, command("SYN viewer", body))).status], [403], path);
  // A restricted source shows its identity and hash to everyone in scope, and its bytes only to the duties that decide on it.
  const restricted = randomUUID();
  assert.equal((await s.coordinator(`${s.base}/sources`, command("SYN restricted", { action: "publish", id: restricted, kind: "CompatibilityEvidence", reference: "SYN-CE-1", title: "SYN restricted statement", revision: "A", file_version: "1.0", permitted_purpose: "Procurement", content: "SYN SECRET BYTES", restricted: true }))).status, 201);
  const seen = async (call: Call) => ((await call(`${s.base}/sources?source_id=${restricted}`)).body as { selected: { content: string | null; content_withheld: boolean; content_hash: string } }).selected;
  assert.deepEqual([(await seen(s.author)).content, (await seen(s.author)).content_withheld], ["SYN SECRET BYTES", false]);
  for (const limited of [s.viewer, s.supply]) assert.deepEqual([(await seen(limited)).content, (await seen(limited)).content_withheld, (await seen(limited)).content_hash.length], [null, true, 64]);
  // Receipt recovery rechecks present access: an author who loses engineering.edit cannot recover an original they made.
  const save = command("SYN coordination only", { action: "remove", line_id: l.get("070")!.id, expected_version: l.get("070")!.version, removed_reason: "SYN no longer needed" });
  assert.equal((await s.author(`${s.base}/lines`, save)).status, 201);
  assert.equal((await s.author(`operations/${save.operation_id}`)).status, 200);
  assert.equal((await s.engineer(`operations/${save.operation_id}`)).status, 404);
  await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='engineering.edit'", [MATERIALS.author.id]);
  assert.equal((await s.author(`operations/${save.operation_id}`)).status, 404);
});

test("EN06-A10: a missing policy grants no authority, whatever capability a person holds", async () => {
  const s = await built(), l = await s.lines(), id = randomUUID(), path = `${s.base}/releases`;
  assert.equal((await s.author(path, command("SYN", { action: "prepare", id, set_id: s.ids.set, purpose: "TechnicalReleaseForProcurement", audience: "SYN", selection: [{ line_id: l.get("070")!.id, quantity: "1" }] }))).status, 201);
  assert.equal((await s.author(path, command("SYN", { action: "submit", release_id: id, expected_version: 1 }))).status, 201);
  // The policy table is immutable, so the absence is staged by moving the effective date, not by deleting a row.
  await database().query("ALTER TABLE ppo.material_policies DISABLE TRIGGER policy_immutable");
  await database().query("UPDATE ppo.material_policies SET effective_from='2999-01-01T00:00:00Z'");
  await database().query("ALTER TABLE ppo.material_policies ENABLE TRIGGER policy_immutable");
  const review = await s.reviewer(path, command("SYN", { action: "review", release_id: id, expected_version: 2, result: "Accepted", rationale: "SYN" }));
  assert.deepEqual([review.status, code(review)], [403, "AuthorityNotConfigured"]);
  assert.equal(((await s.reviewer(`${path}?set=${s.ids.set}`)).body as { policy: { configured: boolean } }).policy.configured, false);
});

test("EN06-A15 A17 A18 A42: one immutable issue per release, whatever is sent and however often", async () => {
  const s = await built(), l = await s.lines(), path = `${s.base}/releases`;
  const id = await authorised(s, [{ line_id: l.get("020")!.id, quantity: "4" }, { line_id: l.get("070")!.id, quantity: "1" }]);
  // Two different original operations race to issue the same release. The workspace lock serialises them: one issues, one is told it already was.
  const attempts = await Promise.all([1, 2].map(() => s.release(path, command("SYN concurrent issue", { action: "issue", release_id: id, expected_version: 4 }))));
  assert.deepEqual(attempts.map((a) => a.status).sort(), [201, 409]);
  assert.ok(["AlreadyIssued", "VersionConflict"].includes(code(attempts.find((a) => a.status === 409)!)!));
  const issued = (await rows<{ issue_state: string; issue_operation_id: string; version: number; content_hash: string; authorised_hash: string }>("SELECT issue_state,issue_operation_id,version,content_hash,authorised_hash FROM ppo.material_releases WHERE id=$1", [id]))[0];
  assert.deepEqual([issued.issue_state, issued.version, issued.content_hash], ["Issued", 5, issued.authorised_hash]);
  // The winner's operation is the one on the record, and it recovers to the same receipt for the person who sent it.
  const recovered = await s.release(`operations/${issued.issue_operation_id}`);
  assert.deepEqual([recovered.status, (recovered.body as { record_id: string; state: string }).record_id, (recovered.body as { state: string }).state], [200, id, "Issued"]);
  assert.equal((await rows<{ n: number }>("SELECT count(*)::int n FROM ppo.material_events WHERE subject_id=$1 AND event_type='ReleaseIssued'", [id]))[0].n, 1);
  assert.equal((await rows<{ n: number }>("SELECT count(*)::int n FROM ppo.outbox_jobs WHERE kind='MaterialReleaseIssued'"))[0].n, 1);
  // The database refuses what the application would never send.
  for (const sql of ["UPDATE ppo.material_releases SET version=version+1,manifest='{}' WHERE id=$1", "UPDATE ppo.material_releases SET version=version+1,issue_state='Authorised',issued_by=NULL,issued_at=NULL,issue_operation_id=NULL WHERE id=$1", "DELETE FROM ppo.material_releases WHERE id=$1"])
    await assert.rejects(database().query(sql, [id]), (e: { code?: string }) => e.code === "55000", sql);
  await assert.rejects(database().query("UPDATE ppo.material_events SET reason='changed' WHERE subject_id=$1", [id]), (e: { code?: string }) => e.code === "55000");
  // A08: two of six valves remain. A successor that replaces the entitlement may restate all six; a second release may not add three.
  const over = await s.author(path, command("SYN", { action: "prepare", id: randomUUID(), set_id: s.ids.set, purpose: "TechnicalReleaseForProcurement", audience: "SYN", selection: [{ line_id: l.get("020")!.id, quantity: "3" }] }));
  assert.deepEqual([over.status, code(over)], [422, "ScopeInvalid"]);
  const successor = await authorised(s, [{ line_id: l.get("020")!.id, quantity: "6" }, { line_id: l.get("070")!.id, quantity: "1" }], { predecessor_id: id });
  assert.equal((await s.release(path, command("SYN successor issued", { action: "issue", release_id: successor, expected_version: 4 }))).status, 201);
  assert.deepEqual(await rows("SELECT release_number,superseded_by IS NOT NULL AS superseded FROM ppo.material_releases WHERE set_id=$1 AND issue_state='Issued' ORDER BY release_number", [s.ids.set]), [{ release_number: 1, superseded: true }, { release_number: 2, superseded: false }]);
  // Historical quantities stay visible and are not added to the active total.
  assert.equal((await rows<{ active: string }>("SELECT sum(rl.quantity)::text AS active FROM ppo.material_release_lines rl JOIN ppo.material_releases r ON r.id=rl.release_id WHERE rl.line_id=$1 AND r.issue_state='Issued' AND r.withdrawn_at IS NULL AND r.superseded_by IS NULL", [l.get("020")!.id]))[0].active, "6.000000");
});

test("EN06-A14 A19 A20 A21 A23: returned and corrected receiving, then a withdrawn release that recalls nothing", async () => {
  const s = await built(), l = await s.lines(), release = await authorised(s, [{ line_id: l.get("060")!.id, quantity: "3" }, { line_id: l.get("070")!.id, quantity: "1" }]), handover = `${s.base}/handover`;
  assert.equal((await s.release(`${s.base}/releases`, command("SYN issued", { action: "issue", release_id: release, expected_version: 4 }))).status, 201);
  const first = randomUUID(), prepare = (id: string, extra: Record<string, unknown> = {}) => s.author(handover, command("SYN handover", { action: "prepare", id, release_id: release, requested_action: "ProcurementReady", demand_basis: "Approved", demand_source_id: s.ids.demand, receiver_id: MATERIALS.supply.id, ...extra }));
  assert.equal((await prepare(first)).status, 201);
  assert.equal((await s.author(handover, command("SYN sent", { action: "send", handover_id: first, expected_version: 1 }))).status, 201);
  // The reviewer holds no receiving duty, and the author who prepared the payload can never decide it.
  for (const wrong of [s.reviewer, s.author]) assert.equal((await wrong(handover, command("SYN", { action: "decide", handover_id: first, expected_version: 2, result: "Accepted" }))).status, 403);
  assert.equal((await s.supply(handover, command("SYN returned", { action: "decide", handover_id: first, expected_version: 2, result: "Returned", reasons: [{ line_id: l.get("060")!.id, reason: "SYN required-by date is missing." }], owner_id: MATERIALS.author.id, due: "2026-10-02" }))).status, 201);
  const returned = (await rows<{ payload_hash: string }>("SELECT payload_hash FROM ppo.material_handovers WHERE id=$1", [first]))[0];
  const second = randomUUID();
  assert.equal((await prepare(second, { predecessor_id: first, required_by: "2026-11-21" })).status, 201);
  // The returned payload is retained unchanged; the correction is a new revision with its own hash.
  assert.deepEqual(await rows("SELECT revision,state,payload_hash=$2 AS same_hash FROM ppo.material_handovers WHERE release_id=$1 ORDER BY revision", [release, returned.payload_hash]), [{ revision: 1, state: "Returned", same_hash: true }, { revision: 2, state: "Prepared", same_hash: false }]);
  assert.equal((await s.author(handover, command("SYN sent", { action: "send", handover_id: second, expected_version: 1 }))).status, 201);
  const accept = command("SYN accepted", { action: "decide", handover_id: second, expected_version: 2, result: "Accepted" });
  assert.equal((await s.supply(handover, accept)).status, 201);
  assert.equal((await s.supply(handover, accept)).status, 200);
  assert.deepEqual([(await s.supply(handover, command("SYN again", { action: "decide", handover_id: second, expected_version: 3, result: "Accepted" }))).status], [409]);
  // Acceptance created no order, reservation, stock movement or booking: nothing outside the module was written.
  const outside = ["appointments", "work_orders", "finance_handoffs", "packs"];
  const before = await Promise.all(outside.map(count));
  const withdraw = await s.release(`${s.base}/releases`, command("SYN withdrawn after a supplier notice", { action: "withdraw", release_id: release, expected_version: 5 }));
  assert.equal(withdraw.status, 201);
  assert.deepEqual(await Promise.all(outside.map(count)), before);
  assert.deepEqual(await rows("SELECT state,decided_by IS NOT NULL AS decided FROM ppo.material_handovers WHERE id=$1", [second]), [{ state: "Accepted", decided: true }]);
  const impact = (await rows<{ state: string; required_action: string; affected: { handovers: { state: string }[] } }>("SELECT state,required_action,affected FROM ppo.material_impacts WHERE release_id=$1", [release]))[0];
  assert.equal(impact.state, "Open");
  assert.match(impact.required_action, /Nothing has been recalled, cancelled or reversed/);
  assert.deepEqual(impact.affected.handovers.map((h) => h.state), ["Returned", "Accepted"]);
});
