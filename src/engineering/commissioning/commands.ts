import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { database } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import type { QueryClient } from "../../platform/permissions";
import { hasCriterion, isRequired, type Host } from "../../inspections/model";
import { addEvidence, openAttempt, removeEvidence, resolveHost, reviewAttempt, saveAttempt, submitAttempt, updateDefect, localDate } from "../../inspections/service";
import {
  authority, blocked, commissioningAccess, configurationLabel, currentVersion, eligiblePerson, invalidField, loadRecords, loadSources, record, refuse, requireDuty, sha256, snapshotOf, touch,
  type Access, type Duty, type LiveSource, type Loaded, type ReleaseRow, type SourceSnapshot,
} from "./context";
import { gateBlockers, label, policyAllows, releaseGates, sourcePresentation, workflowPresentation, type GateFacts, type ScopeItem } from "./model";
import { handoverManifest, manifestComplete, packHtml, prepareBundle, readBundle, recordHtml, releaseManifest, renderPdf, type Prepared, type Renderer } from "./outputs";
import { parseBasisCommand, parseConfigurationCommand, parseHandoverCommand, parseInspectionCommand, parsePackageCommand, parseReleaseCommand } from "./validation";

type Saved = { id: string; version: number; state: string; updated_at: Date; audit_details?: Record<string, unknown> };
type Command = { operation_id: string; reason: string };
const host = (id: string): Host => ({ host_type: "ProjectCommissioningScope", host_id: id });
async function opened(c: PoolClient, p: Principal, access: Access, recordId: string) {
  const sources = await loadSources(c, p, access), all = await loadRecords(c, p, access, sources, recordId), l = all.find((x) => x.row.id === recordId);
  if (!l) throw unavailable();
  return { sources, all, l };
}
const open = (l: Loaded) => { if (l.row.archived_at) throw refuse("RecordArchived", "This commissioning package is archived. Its history is retained and nothing more is recorded on it.", 409); };
const names = async (c: QueryClient, p: Principal) => new Map((await c.query<{ id: string; display_name: string }>("SELECT id,display_name FROM ppo.users WHERE workspace_id=$1", [p.workspace_id])).rows.map((u) => [u.id, u.display_name]));
// Every accepted command advances the package and leaves one history event naming exactly what changed.
async function done(c: PoolClient, p: Principal, access: Access, command: Command, l: { row: { id: string } }, e: { subject_type: Parameters<typeof record>[4]["subject_type"]; subject_id: string; event_type: string; note?: string | null }, state: string, audit_details?: Record<string, unknown>): Promise<Saved> {
  const saved = await touch(c, p, l.row.id);
  await record(c, p, access, command, { commissioning_id: l.row.id, ...e });
  return { ...saved, state, audit_details };
}
// A recorded source check: what the upstream adapter answered, when, and for whom. Decisions that rest on current
// sources write one in the same transaction, so "Sources current" always has a real check behind it.
async function recordCheck(c: PoolClient, p: Principal, access: Access, command: Command, l: Loaded) {
  const id = randomUUID();
  await c.query("INSERT INTO ppo.commissioning_source_checks(id,workspace_id,company_id,commissioning_id,result,details,adapter,operation_id,checked_by) VALUES($1,$2,$3,$4,$5,$6,'SyntheticUpstreamFixture',$7,$8)",
    [id, p.workspace_id, access.pkg.company_id, l.row.id, l.condition.condition, JSON.stringify({ reasons: l.condition.reasons, capability: "Local retained snapshots only; no live provider is connected", sources: l.bound.map((b) => ({ role: b.role, snapshot: b.snapshot, live: b.live ? { use: b.live.use, successor_id: b.live.successor_id, content_hash: b.live.content_hash } : null })) }), command.operation_id, p.actor_id]);
  return id;
}
const sourceState = (l: Loaded) => JSON.stringify({ condition: l.condition.condition, reasons: l.condition.reasons, sources: l.bound.map((b) => ({ role: b.role, snapshot: b.snapshot, live: b.live ? { use: b.live.use, successor_id: b.live.successor_id } : null })) });
const currentSources = (l: Loaded, what: string) => {
  if (l.condition.condition !== "Current") throw blocked("SourcesNotCurrent", [`${sourcePresentation[l.condition.condition].label}. ${l.condition.reasons.join(" ")} ${what} rests on sources whose currentness is established; what was decided before is retained.`]);
};
function source(sources: LiveSource[], id: string | null, kinds: string[], field: string, what: string) {
  if (!id) return null;
  const s = sources.find((x) => x.id === id);
  if (!s || !kinds.includes(s.kind) || !s.readable) throw invalidField(field, `Choose ${what} retained for this package.`);
  return s;
}
async function packageChange(c: QueryClient, p: Principal, access: Access, changeId: string | null, field: string) {
  if (changeId && !(await c.query("SELECT 1 FROM ppo.engineering_changes WHERE workspace_id=$1 AND package_id=$2 AND id=$3", [p.workspace_id, access.pkg.id, changeId])).rowCount)
    throw invalidField(field, "Choose an engineering change (EN-07) of this Engineering package. If none exists yet, record it there first: a referral names a real change.");
}

// ---------------------------------------------------------------------------------------------
const scopeHash = (statement: string | null, items: ScopeItem[], interfaces: unknown) => sha256({ statement, items: [...items].sort((a, b) => a.key.localeCompare(b.key)), interfaces });
export async function packageCommand(p: Principal, packageId: string, value: unknown) {
  const command = parsePackageCommand(value);
  return sharedOperation<Access>(p, command, `Commissioning:${command.action}`, async (c) => {
    const access = await commissioningAccess(c, p, packageId);
    if (command.action === "check") { if (!Object.values(access.can).some(Boolean)) requireDuty(access, "edit"); } else requireDuty(access, command.action === "assess" ? "source" : "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    if (command.action === "create") {
      if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id");
      const number = (await c.query<{ next: number }>("SELECT coalesce(max(record_number),0)+1 AS next FROM ppo.commissioning_packages WHERE workspace_id=$1 AND package_id=$2", [p.workspace_id, access.pkg.id])).rows[0].next;
      await c.query(`INSERT INTO ppo.commissioning_packages(id,workspace_id,company_id,package_id,site_id,created_by,updated_by,record_number,reference,title,system_name,area,owner_id,due,due_meaning,release_stage) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [command.id, p.workspace_id, access.pkg.company_id, access.pkg.id, access.pkg.site_id, p.actor_id, number, `SYN-EN08-${String(number).padStart(3, "0")}`, command.title, command.system_name, command.area, command.owner_id, command.due, command.due_meaning, command.release_stage]);
      await c.query("INSERT INTO ppo.commissioning_scopes(id,workspace_id,company_id,commissioning_id,created_by,updated_by,scope_number,content_hash) VALUES($1,$2,$3,$4,$5,$5,1,$6)", [command.scope_id, p.workspace_id, access.pkg.company_id, command.id, p.actor_id, scopeHash(null, [], [])]);
      await record(c, p, access, command, { commissioning_id: command.id, subject_type: "Package", subject_id: command.id, event_type: "PackageCreated" });
      return { id: command.id, version: 1, state: "Draft", updated_at: new Date() };
    }
    const { l } = await opened(c, p, access, command.record_id);
    if (command.action === "check") {
      const id = await recordCheck(c, p, access, command, l);
      return done(c, p, access, command, l, { subject_type: "SourceCheck", subject_id: id, event_type: "SourcesChecked", note: l.condition.reasons.join(" ") || null }, l.condition.condition);
    }
    if (command.action === "assess") {
      // A manual assessment is a named person's evidenced statement at a recorded time. It is never a ticked box.
      authority(policyAllows(access.policy, p.actor_id, "SourceAssessor"));
      const id = randomUUID();
      await c.query("INSERT INTO ppo.commissioning_source_checks(id,workspace_id,company_id,commissioning_id,result,details,adapter,assessment_evidence,operation_id,checked_by) VALUES($1,$2,$3,$4,$5,$6,'ManualAssessment',$7,$8,$9)",
        [id, p.workspace_id, access.pkg.company_id, l.row.id, command.result, JSON.stringify({ adapter_condition: l.condition.condition, adapter_reasons: l.condition.reasons, policy_version: access.policy!.policy_version }), command.evidence, command.operation_id, p.actor_id]);
      return done(c, p, access, command, l, { subject_type: "SourceCheck", subject_id: id, event_type: "SourcesAssessedManually", note: command.evidence }, command.result);
    }
    currentVersion(command.action === "scope" ? l.scope.version : l.row.version, command.expected_version);
    open(l);
    if (command.action === "coordinate") {
      if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id");
      await touch(c, p, l.row.id, "owner_id=$4,due=$5,due_meaning=$6,release_stage=$7", [command.owner_id, command.due, command.due_meaning, command.release_stage]);
      await record(c, p, access, command, { commissioning_id: l.row.id, subject_type: "Package", subject_id: l.row.id, event_type: "PackageCoordinated" });
      const row = (await c.query<{ version: number; updated_at: Date }>("SELECT version,updated_at FROM ppo.commissioning_packages WHERE workspace_id=$1 AND id=$2", [p.workspace_id, l.row.id])).rows[0];
      return { id: l.row.id, ...row, state: workflowPresentation[l.workflow].label };
    }
    if (command.action === "scope") {
      if (l.scope.id !== command.scope_id) throw unavailable();
      if (l.scope.state !== "Working") throw refuse("ScopeFrozen", "This scope was frozen when a test basis that binds it was submitted. Change it through a successor scope version.", 409);
      // Identity comes from the canonical asset record. An asset this package cannot see, or one that is not verified, never becomes verified here.
      const ids = command.items.flatMap((i) => (i.asset_id ? [i.asset_id] : [])), assets = new Map((await c.query<{ id: string; identity_status: string }>(
        "SELECT id,identity_status FROM ppo.assets WHERE workspace_id=$1 AND company_id=$2 AND id=ANY($3::uuid[]) AND ($4::uuid IS NULL OR site_id=$4)", [p.workspace_id, access.pkg.company_id, ids, access.pkg.site_id])).rows.map((a) => [a.id, a.identity_status]));
      const items = command.items.map((i, n) => {
        if (i.asset_id && !assets.has(i.asset_id)) throw invalidField(`items-${n}`, `${i.reference} is not an asset of this package's company and site.`);
        return { ...i, identity: i.asset_id ? (assets.get(i.asset_id) === "Verified" ? "Verified" as const : "Unverified" as const) : "Unknown" as const };
      }), keys = new Set(items.map((i) => i.key));
      if (new Set(ids).size !== ids.length) throw invalidField("items", "One physical asset is one scope item, however many areas it serves. List the areas it serves on that item.");
      command.interfaces.forEach((f, n) => { if (f.items.some((k) => !keys.has(k))) throw invalidField(`interfaces-${n}`, "A shared interface joins items of this scope."); });
      await c.query("UPDATE ppo.commissioning_scopes SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,statement=$4,items=$5,interfaces=$6,content_hash=$7 WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, l.scope.id, p.actor_id, command.statement, JSON.stringify(items), JSON.stringify(command.interfaces), scopeHash(command.statement, items, command.interfaces)]);
      return done(c, p, access, command, l, { subject_type: "Scope", subject_id: l.scope.id, event_type: "ScopeSaved" }, "Working");
    }
    if (command.action === "rescope") {
      if (l.scope.state !== "Frozen") throw refuse("ScopeWorking", "The current scope is still a working draft. Edit it directly.", 409);
      await c.query(`INSERT INTO ppo.commissioning_scopes(id,workspace_id,company_id,commissioning_id,created_by,updated_by,scope_number,predecessor_id,statement,items,interfaces,content_hash)
        SELECT $3,workspace_id,company_id,commissioning_id,$4,$4,scope_number+1,id,statement,items,interfaces,content_hash FROM ppo.commissioning_scopes WHERE workspace_id=$1 AND id=$2`, [p.workspace_id, l.scope.id, command.id, p.actor_id]);
      await touch(c, p, l.row.id, "current_scope=$4", [l.scope.scope_number + 1]);
      await record(c, p, access, command, { commissioning_id: l.row.id, subject_type: "Scope", subject_id: command.id, event_type: "ScopeSuccessorCreated", note: `Scope ${l.scope.scope_number + 1} follows scope ${l.scope.scope_number}, which stays exactly as it was frozen. The approved test basis still binds the earlier scope until a successor basis is approved.` });
      const row = (await c.query<{ version: number; updated_at: Date }>("SELECT version,updated_at FROM ppo.commissioning_packages WHERE workspace_id=$1 AND id=$2", [p.workspace_id, l.row.id])).rows[0];
      return { id: l.row.id, ...row, state: "Working" };
    }
    // archive: every EN-08 responsibility is explicitly dispositioned first. Archive deletes nothing and is not Project completion.
    const stops = [
      l.attempts.some((a) => a.row.state === "Draft") && "A test attempt is still a draft.", l.facts.attempts_in_review > 0 && "Test evidence is still in review.", l.facts.defects_open > 0 && `${l.facts.defects_open} defect${l.facts.defects_open === 1 ? " is" : "s are"} open.`,
      ["InReview", "ApprovedForIssue"].includes(l.facts.release) && "An as-built release candidate is awaiting a decision or issue.",
      l.requests.some((r) => ["Requested", "OutcomeUnknown", "Unavailable", "Returned", "ClarificationRequired"].includes(r.state)) && "A receiving request has no accepted outcome. Obtain it, or cancel the request with its reason.",
    ].filter((x): x is string => !!x);
    if (stops.length) throw blocked("ArchiveBlocked", stops);
    await touch(c, p, l.row.id, "archived_at=clock_timestamp(),archived_by=$3,archived_reason=$4", [command.reason]);
    await record(c, p, access, command, { commissioning_id: l.row.id, subject_type: "Package", subject_id: l.row.id, event_type: "PackageArchived", note: command.reason });
    const row = (await c.query<{ version: number; updated_at: Date }>("SELECT version,updated_at FROM ppo.commissioning_packages WHERE workspace_id=$1 AND id=$2", [p.workspace_id, l.row.id])).rows[0];
    return { id: l.row.id, ...row, state: "Archived" };
  }, "CommissioningPackage", "CommissioningRecordSaved");
}

// ---------------------------------------------------------------------------------------------
type BasisContent = { reference: string; revision: string; procedure_source_id: string | null; drawing_source_id: string | null; configuration_source_id: string | null; checks: unknown; prerequisites: unknown };
const basisHash = (b: BasisContent, snapshots: Record<string, SourceSnapshot>, scopeContent: string) => sha256({ ...b, sources: snapshots, scope: scopeContent });
export async function basisCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseBasisCommand(value), deciding = command.action === "approve" || command.action === "return";
  return sharedOperation<Access>(p, command, `CommissioningBasis:${command.action}`, async (c) => {
    const access = await commissioningAccess(c, p, packageId);
    requireDuty(access, deciding ? "review" : "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l, sources } = await opened(c, p, access, command.record_id);
    open(l);
    if (command.action === "create") {
      currentVersion(l.row.version, command.expected_version);
      const last = l.bases.at(-1);
      if (last && (last.state === "Draft" || last.state === "InReview")) throw refuse("BasisOpen", `Test basis ${last.reference} ${last.revision} is ${label(last.state).toLowerCase()}. Finish it before starting another.`, 409);
      // A successor starts as an exact copy with an identity of its own. The basis bound to every earlier test stays as it was approved.
      const from: BasisContent & { sources: Record<string, SourceSnapshot> } = last ?? { reference: command.reference, revision: command.revision, procedure_source_id: null, drawing_source_id: null, configuration_source_id: null, checks: [], prerequisites: [], sources: {} };
      const content = { ...from, reference: command.reference, revision: command.revision };
      await c.query(`INSERT INTO ppo.commissioning_bases(id,workspace_id,company_id,commissioning_id,scope_id,created_by,updated_by,basis_number,predecessor_id,reference,revision,procedure_source_id,drawing_source_id,configuration_source_id,sources,checks,prerequisites,content_hash)
        VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`, [command.id, p.workspace_id, access.pkg.company_id, l.row.id, l.scope.id, p.actor_id, (last?.basis_number ?? 0) + 1, last?.id ?? null, content.reference, content.revision,
        content.procedure_source_id, content.drawing_source_id, content.configuration_source_id, JSON.stringify(from.sources), JSON.stringify(content.checks), JSON.stringify(content.prerequisites), basisHash(content, from.sources, l.scope.content_hash)]);
      return done(c, p, access, command, l, { subject_type: "Basis", subject_id: command.id, event_type: last ? "BasisSuccessorCreated" : "BasisCreated" }, "Draft");
    }
    const b = l.bases.find((x) => x.id === command.basis_id);
    if (!b) throw unavailable();
    currentVersion(b.version, command.expected_version);
    if (command.action === "save") {
      if (b.state !== "Draft") throw refuse("BasisFrozen", "A submitted test basis is frozen. A material edit is a successor basis, which is reviewed again.", 409);
      const bound = [source(sources, command.procedure_source_id, ["TestProcedure"], "procedure_source_id", "an approved test procedure"), source(sources, command.drawing_source_id, ["DrawingIssue", "DesignBasis"], "drawing_source_id", "a drawing issue or design basis"),
        source(sources, command.configuration_source_id, ["InstalledConfiguration"], "configuration_source_id", "an intended configuration record")];
      const keys = new Set(l.scope.items.map((i) => i.key)), snapshots: Record<string, SourceSnapshot> = {};
      // The snapshot is what was observed of this exact retained source. A matching title or a newer file is not the approved content.
      for (const s of bound) if (s) snapshots[s.id] = snapshotOf(s);
      command.checks.forEach((k, n) => {
        if (k.scope_key && !keys.has(k.scope_key)) throw invalidField(`checks-${n}`, `${k.name} names a scope item that is not in this package's scope.`);
        if (k.criterion_source_id) snapshots[k.criterion_source_id] = snapshotOf(source(sources, k.criterion_source_id, ["TestProcedure", "DesignBasis", "DrawingIssue"], `checks-${n}`, "the source of this criterion")!);
      });
      const { reference, revision, procedure_source_id, drawing_source_id, configuration_source_id, checks, prerequisites } = command, content = { reference, revision, procedure_source_id, drawing_source_id, configuration_source_id, checks, prerequisites };
      await c.query(`UPDATE ppo.commissioning_bases SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,scope_id=$4,reference=$5,revision=$6,procedure_source_id=$7,drawing_source_id=$8,configuration_source_id=$9,sources=$10,checks=$11,prerequisites=$12,content_hash=$13 WHERE workspace_id=$1 AND id=$2`,
        [p.workspace_id, b.id, p.actor_id, l.scope.id, reference, revision, procedure_source_id, drawing_source_id, configuration_source_id, JSON.stringify(snapshots), JSON.stringify(checks), JSON.stringify(prerequisites), basisHash(content, snapshots, l.scope.content_hash)]);
      return done(c, p, access, command, l, { subject_type: "Basis", subject_id: b.id, event_type: "BasisSaved" }, "Draft");
    }
    if (command.action === "submit") {
      if (b.state !== "Draft") throw refuse("BasisFrozen", "This test basis was already submitted.", 409);
      const stops = [!b.procedure_source_id && "Bind the exact approved procedure.", !b.checks.length && "Define at least one check.", !l.scope.items.some((i) => i.disposition === "Included") && "Include at least one system, area or asset in the scope.",
        b.checks.some((k) => k.condition?.outcome === "Unknown" && !k.required) && "A check whose condition is unknown stays required until the condition is known."].filter((x): x is string => !!x);
      if (stops.length) throw blocked("BasisIncomplete", stops);
      currentSources(l, "Submitting a test basis for approval");
      // The scope this basis binds is frozen with it: a later scope change is a successor scope and a successor basis.
      if (l.scope.state === "Working") await c.query("UPDATE ppo.commissioning_scopes SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Frozen',frozen_at=clock_timestamp(),frozen_by=$3 WHERE workspace_id=$1 AND id=$2", [p.workspace_id, l.scope.id, p.actor_id]);
      await c.query("UPDATE ppo.commissioning_bases SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='InReview',submitted_hash=content_hash,submitted_at=clock_timestamp(),submitted_by=$3 WHERE workspace_id=$1 AND id=$2", [p.workspace_id, b.id, p.actor_id]);
      await recordCheck(c, p, access, command, l);
      const missing = b.checks.filter((k) => isRequired(k) && !hasCriterion(k)).length;
      return done(c, p, access, command, l, { subject_type: "Basis", subject_id: b.id, event_type: "BasisSubmitted", note: missing ? `${missing} required check${missing === 1 ? " has" : "s have"} no acceptance criterion yet. Testing may capture readings; none can be assessed or released until a successor basis defines the criterion.` : null }, "InReview");
    }
    // approve or return: the exact submitted version, for its declared purpose, by someone the policy names and who did not prepare it.
    if (b.state !== "InReview") throw refuse("NotInReview", "Only a submitted test basis is approved or returned.", 409);
    authority(policyAllows(access.policy, p.actor_id, "BasisApprover"));
    const independent = access.policy!.independence.basis;
    if (independent && [b.submitted_by, b.created_by].includes(p.actor_id)) throw new AppError(403, "IndependenceRequired", "You prepared or submitted this test basis, so you cannot decide it. Edit permission is never approval.");
    const decided = "decision_reason=$4,decided_by=$3,decided_at=clock_timestamp(),policy_id=$5,policy_version=$6,independence_required=$7,source_state=$8,decision_operation_id=$9", values = [command.decision_reason, access.policy!.id, access.policy!.policy_version, independent, sourceState(l), command.operation_id];
    if (command.action === "return") {
      await eligiblePerson(c, p, access, command.owner_id, "owner_id", "edit");
      await c.query(`UPDATE ppo.commissioning_bases SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Returned',${decided},return_owner_id=$10,return_due=$11 WHERE workspace_id=$1 AND id=$2`, [p.workspace_id, b.id, p.actor_id, ...values, command.owner_id, command.due]);
      return done(c, p, access, command, l, { subject_type: "Basis", subject_id: b.id, event_type: "BasisReturned", note: command.decision_reason }, "Returned");
    }
    currentSources(l, "Approving a test basis");
    if (b.content_hash !== b.submitted_hash) throw refuse("BasisTampered", "The stored test basis no longer matches what was submitted. Nothing can be decided on it.", 409);
    const previous = l.bases.find((x) => x.state === "ApprovedForTest");
    if (previous) await c.query("UPDATE ppo.commissioning_bases SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Superseded' WHERE workspace_id=$1 AND id=$2", [p.workspace_id, previous.id, p.actor_id]);
    await c.query(`UPDATE ppo.commissioning_bases SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='ApprovedForTest',${decided} WHERE workspace_id=$1 AND id=$2`, [p.workspace_id, b.id, p.actor_id, ...values]);
    await recordCheck(c, p, access, command, l);
    return done(c, p, access, command, l, { subject_type: "Basis", subject_id: b.id, event_type: "BasisApprovedForTest", note: command.decision_reason }, "ApprovedForTest", { basis_hash: b.submitted_hash, policy_version: access.policy!.policy_version, superseded: previous?.id ?? null });
  }, "CommissioningPackage", deciding ? "CommissioningBasisDecided" : "CommissioningRecordSaved");
}

// ---------------------------------------------------------------------------------------------
const inspectionDuty = (action: string): Duty[] => (action === "review" ? ["review"] : action === "defect" ? ["edit"] : action === "clarify" || action === "correct" ? ["capture", "edit"] : ["capture"]);
export async function inspectionCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseInspectionCommand(value), kind = command.action === "submit" ? "InspectionSubmitted" : command.action === "review" ? "InspectionReviewed" : "CommissioningRecordSaved";
  return sharedOperation<Access>(p, command, `CommissioningInspection:${command.action}`, async (c) => {
    const access = await commissioningAccess(c, p, packageId), duties = inspectionDuty(command.action);
    if (!duties.some((d) => access.can[d])) requireDuty(access, duties[0]);
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l } = await opened(c, p, access, command.record_id), h = host(l.row.id);
    open(l);
    if (command.action === "open") {
      currentVersion(l.row.version, command.expected_version);
      authority(policyAllows(access.policy, p.actor_id, "Performer"));
      const basis = l.approved_basis;
      if (!basis) throw blocked("TestBasisNeeded", ["No test basis is approved for test. A result is captured against an exact approved basis; nothing is tested against a draft."]);
      // Readiness is rechecked before every attempt: a source that moved since approval stops the next test, not the ones already done.
      currentSources(l, "Opening a test attempt");
      const included = new Set(l.scope.items.filter((i) => i.disposition === "Included").map((i) => i.key)), scopeKeys = command.scope_keys.length ? command.scope_keys : [...included];
      if (scopeKeys.some((k) => !included.has(k))) throw invalidField("scope_keys", "An attempt covers items that are included in this package's scope.");
      const inScope = basis.checks.filter((d) => isRequired(d) && (d.scope_key === null || scopeKeys.includes(d.scope_key))), checkKeys = command.check_keys.length ? command.check_keys : inScope.map((d) => d.key);
      const resolved = await resolveHost(c, p, h);
      const number = await openAttempt(c, p, { id: command.id, host: resolved, plan_source: { type: "CommissioningBasis", id: basis.id, reference: `${basis.reference} ${basis.revision}`, hash: basis.submitted_hash! }, plan: basis.checks, scope_keys: scopeKeys, check_keys: checkKeys,
        predecessor_id: command.predecessor_id, performer_id: p.actor_id, prerequisites: basis.prerequisites.map((x) => ({ ...x, met: false })), timezone: access.site_timezone });
      return done(c, p, access, command, l, { subject_type: "Attempt", subject_id: command.id, event_type: command.predecessor_id ? "RetestOpened" : "AttemptOpened", note: `Attempt ${String(number).padStart(2, "0")} against ${basis.reference} ${basis.revision}.` }, "Draft");
    }
    if (command.action === "defect" || command.action === "correct") {
      if (command.action === "defect") { await eligiblePerson(c, p, access, command.owner_id, "owner_id", "edit"); await packageChange(c, p, access, command.change_id, "change_id"); }
      const d = await updateDefect(c, p, h, command.defect_id, command.expected_version, command.action === "correct" ? { kind: "correct", note: command.note } : { kind: "coordinate", update: command });
      return done(c, p, access, command, l, { subject_type: "Defect", subject_id: d.id, event_type: command.action === "correct" ? "DefectCorrectionRecorded" : "DefectCoordinated", note: command.action === "correct" ? command.note : null }, command.action === "correct" ? "CorrectionRecorded" : d.state);
    }
    if (command.action === "review" || command.action === "clarify") {
      const a = l.attempts.find((x) => x.row.id === command.attempt_id);
      if (!a) throw unavailable();
      const independent = access.policy?.independence.evidence ?? true;
      if (command.action === "review") {
        authority(policyAllows(access.policy, p.actor_id, "EvidenceReviewer"));
        if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id");
      } else if (![a.row.performer_id, l.row.owner_id].includes(p.actor_id)) throw new AppError(403, "Forbidden", "A clarification is given by the person who performed the test or the package's owner.");
      const outcome = await reviewAttempt(c, p, h, a.row.id, { id: command.id, decision: command.action === "review" ? command.decision : "ClarificationProvided", reason: command.decision_reason, owner_id: command.action === "review" ? command.owner_id : null, due: command.action === "review" ? command.due : null,
        policy: { id: access.policy?.id ?? null, version: access.policy?.policy_version ?? null }, independence_required: independent, applicability: { source: l.condition.condition, configuration: l.configuration ? configurationLabel(l.configuration) : null }, operation_id: command.operation_id });
      for (const reference of outcome.closed) {
        const d = l.defects.find((x) => x.reference === reference)!;
        await record(c, p, access, command, { commissioning_id: l.row.id, subject_type: "Defect", subject_id: d.id, event_type: "DefectClosed", note: `${reference} closed by the accepted retest in attempt ${String(a.row.attempt_number).padStart(2, "0")}. Nothing else was closed with it.` });
      }
      return done(c, p, access, command, l, { subject_type: "Review", subject_id: command.id, event_type: command.action === "review" ? `Evidence${command.decision}` : "ClarificationProvided", note: command.decision_reason }, command.action === "review" ? command.decision : "InReview", { attempt_hash: a.row.submitted_hash, closed_defects: outcome.closed });
    }
    if (command.action === "save") {
      const at = await saveAttempt(c, p, h, command.attempt_id, command.expected_version, command);
      await touch(c, p, l.row.id);
      // Drafts are saved often; the history keeps the submission and its decisions, not every keystroke.
      return { id: l.row.id, version: at.version, state: "Draft", updated_at: new Date() };
    }
    if (command.action === "evidence") {
      const { at, state } = await addEvidence(c, p, h, command.attempt_id, command.expected_version, command.evidence, command.operation_id);
      await touch(c, p, l.row.id);
      return { id: l.row.id, version: at.version, state, updated_at: new Date() };
    }
    if (command.action === "remove_evidence") {
      const at = await removeEvidence(c, p, h, command.attempt_id, command.expected_version, command.evidence_id);
      await touch(c, p, l.row.id);
      return { id: l.row.id, version: at.version, state: "Draft", updated_at: new Date() };
    }
    // submit
    const ownerId = command.owner_id ?? l.row.owner_id ?? l.row.created_by, today = localDate(new Date(), access.site_timezone), week = new Date(Date.now() + 7 * 86_400_000);
    await eligiblePerson(c, p, access, ownerId, "owner_id", "edit");
    const result = await submitAttempt(c, p, h, command.attempt_id, command.expected_version, command.operation_id, today, { owner_id: ownerId, due: command.due ?? localDate(week, access.site_timezone), severity: command.severity, site_id: access.pkg.site_id, company_id: access.pkg.company_id, host_reference: l.row.reference });
    for (const d of result.defects) await record(c, p, access, command, { commissioning_id: l.row.id, subject_type: "Defect", subject_id: d.id, event_type: d.created ? "DefectRaised" : "DefectRepeated", note: `${d.reference}: ${l.definitions.find((k) => k.key === d.check_key)?.name ?? d.check_key}.` });
    return done(c, p, access, command, l, { subject_type: "Attempt", subject_id: result.attempt.id, event_type: "AttemptSubmitted", note: result.failed.length ? `${result.failed.length} required check${result.failed.length === 1 ? "" : "s"} failed.` : null }, "Submitted", { attempt_hash: result.attempt.submitted_hash, failed: result.failed, defects: result.defects.map((d) => d.reference) });
  }, "CommissioningPackage", kind);
}

// ---------------------------------------------------------------------------------------------
const configurationDuty = (action: string, fact?: string): Duty[] => (["dispose", "reconcile", "redline_decide", "redline_verify", "association_review"].includes(action) || fact === "restore" ? ["review"] : ["item", "redline", "association", "backup_verify"].includes(action) ? ["edit", "capture"] : ["edit"]);
export async function configurationCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseConfigurationCommand(value);
  return sharedOperation<Access>(p, command, `CommissioningConfiguration:${command.action}`, async (c) => {
    const access = await commissioningAccess(c, p, packageId), duties = configurationDuty(command.action, "fact" in command ? command.fact : undefined);
    if (!duties.some((d) => access.can[d])) requireDuty(access, duties[0]);
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l, sources } = await opened(c, p, access, command.record_id), ws = p.workspace_id, company = access.pkg.company_id;
    open(l);
    const asBuilt = () => authority(policyAllows(access.policy, p.actor_id, "AsBuiltApprover")), bump = "version=version+1,updated_at=clock_timestamp(),updated_by=$3";
    const asset = async (id: string | null, field: string) => { if (id && !(await c.query("SELECT 1 FROM ppo.assets WHERE workspace_id=$1 AND company_id=$2 AND id=$3", [ws, company, id])).rowCount) throw invalidField(field, "Choose an asset of this company."); };
    switch (command.action) {
      case "snapshot": {
        currentVersion(l.row.version, command.expected_version);
        if (l.configuration && l.configuration.state !== "Reconciled") throw refuse("SnapshotOpen", `Configuration ${configurationLabel(l.configuration)} is still being reconciled. Finish it before recording another.`, 409);
        source(sources, command.intended_source_id, ["DrawingIssue", "DesignBasis"], "intended_source_id", "the intended drawing issue or design basis"); source(sources, command.installed_source_id, ["InstalledConfiguration"], "installed_source_id", "an installed-configuration record");
        // A new configuration needs its own reconciliation. The earlier snapshot stays exactly as it was reconciled, for every release that bound it.
        if (l.configuration) await c.query(`UPDATE ppo.commissioning_configurations SET ${bump},state='Superseded' WHERE workspace_id=$1 AND id=$2`, [ws, l.configuration.id, p.actor_id]);
        await c.query("INSERT INTO ppo.commissioning_configurations(id,workspace_id,company_id,commissioning_id,created_by,updated_by,snapshot_number,predecessor_id,installed_reference,installed_revision,intended_source_id,installed_source_id) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11)",
          [command.id, ws, company, l.row.id, p.actor_id, (l.configurations.at(-1)?.snapshot_number ?? 0) + 1, l.configuration?.id ?? null, command.installed_reference, command.installed_revision, command.intended_source_id, command.installed_source_id]);
        return done(c, p, access, command, l, { subject_type: "Configuration", subject_id: command.id, event_type: "ConfigurationSnapshotRecorded", note: `${command.installed_reference} Rev ${command.installed_revision}` }, "Working");
      }
      case "item": {
        const k = l.configuration;
        if (!k || k.id !== command.configuration_id) throw unavailable();
        if (k.state === "Reconciled") throw refuse("SnapshotFrozen", "This configuration snapshot is reconciled and frozen. A later difference belongs to a successor snapshot.", 409);
        if (command.redline_id && !l.redlines.some((r) => r.id === command.redline_id)) throw invalidField("redline_id", "Choose a redline of this package.");
        const existing = l.differences.find((d) => d.id === command.id), observed = command.observed_value !== null;
        if (existing) {
          currentVersion(existing.version, command.expected_version ?? 0);
          // An observation is an attributed fact. Changing what was observed re-opens the item: a disposition never outlives the fact it judged.
          const changed = existing.observed_value !== command.observed_value || existing.observation_verified !== command.observation_verified;
          await c.query(`UPDATE ppo.commissioning_differences SET ${bump},kind=$4,component=$5,scope_key=$6,critical=$7,intended_value=$8,intended_source=$9,observed_value=$10,observed_evidence=$11,observation_verified=$12,proposed_as_built=$13,redline_id=$14,
            observed_by=CASE WHEN $15 THEN $3 ELSE observed_by END,observed_at=CASE WHEN $15 THEN clock_timestamp() ELSE observed_at END,disposition=CASE WHEN $15 THEN 'Open' ELSE disposition END,disposition_reason=CASE WHEN $15 THEN NULL ELSE disposition_reason END,
            disposition_by=CASE WHEN $15 THEN NULL ELSE disposition_by END,disposition_at=CASE WHEN $15 THEN NULL ELSE disposition_at END WHERE workspace_id=$1 AND id=$2`,
            [ws, existing.id, p.actor_id, command.kind, command.component, command.scope_key, command.critical, command.intended_value, command.intended_source, command.observed_value, command.observed_evidence, command.observation_verified, command.proposed_as_built, command.redline_id, changed]);
        } else {
          if (l.differences.some((d) => d.item_key === command.item_key)) throw invalidField("item_key", "This item is already compared in this snapshot.");
          await c.query(`INSERT INTO ppo.commissioning_differences(id,workspace_id,company_id,configuration_id,created_by,updated_by,item_key,kind,component,scope_key,critical,intended_value,intended_source,observed_value,observed_evidence,observation_verified,observed_by,observed_at,proposed_as_built,redline_id,sort_order)
            VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [command.id, ws, company, k.id, p.actor_id, command.item_key, command.kind, command.component, command.scope_key, command.critical, command.intended_value, command.intended_source, command.observed_value,
            command.observed_evidence, command.observation_verified, observed ? p.actor_id : null, observed ? new Date() : null, command.proposed_as_built, command.redline_id, l.differences.length]);
        }
        return done(c, p, access, command, l, { subject_type: "Difference", subject_id: command.id, event_type: existing ? "ComparedItemUpdated" : "ComparedItemRecorded", note: command.component }, "Open");
      }
      case "dispose": {
        asBuilt();
        const d = l.differences.find((x) => x.id === command.item_id);
        if (!d) throw unavailable();
        currentVersion(d.version, command.expected_version);
        if (l.configuration?.state === "Reconciled") throw refuse("SnapshotFrozen", "This configuration snapshot is reconciled and frozen.", 409);
        if ((command.disposition === "Matches" || command.disposition === "AcceptedAsBuilt") && (!d.observed_value || !d.observation_verified)) throw blocked("ObservationNeeded", [`${d.component}: “${label(command.disposition).toLowerCase()}” rests on a verified observation of a known value. An empty or unverified observation is unknown, not “no difference”.`]);
        if (command.disposition === "ReferredToChange" && !command.change_id) throw invalidField("change_id", "A referral names the engineering change (EN-07) that will assess it.");
        await packageChange(c, p, access, command.change_id, "change_id");
        await c.query(`UPDATE ppo.commissioning_differences SET ${bump},disposition=$4,disposition_reason=$5,disposition_by=$3,disposition_at=clock_timestamp(),change_id=$6 WHERE workspace_id=$1 AND id=$2`, [ws, d.id, p.actor_id, command.disposition, command.disposition_reason, command.change_id]);
        return done(c, p, access, command, l, { subject_type: "Difference", subject_id: d.id, event_type: `Difference${command.disposition}`, note: command.disposition_reason }, command.disposition);
      }
      case "submit": case "reconcile": {
        const k = l.configuration;
        if (!k || k.id !== command.configuration_id) throw unavailable();
        currentVersion(k.version, command.expected_version);
        if (command.action === "submit") {
          if (k.state !== "Working") throw refuse("NotWorking", "This snapshot was already submitted for review.", 409);
          if (!l.differences.length) throw blocked("NothingCompared", ["Compare at least one item, intended against observed, before asking for review."]);
          await c.query(`UPDATE ppo.commissioning_configurations SET ${bump},state='UnderReview',submitted_by=$3,submitted_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2`, [ws, k.id, p.actor_id]);
          return done(c, p, access, command, l, { subject_type: "Configuration", subject_id: k.id, event_type: "ConfigurationSubmitted" }, "UnderReview");
        }
        asBuilt();
        if (k.state !== "UnderReview") throw refuse("NotUnderReview", "A configuration snapshot is reconciled after it is submitted for review.", 409);
        const independent = access.policy!.independence.as_built;
        if (independent && [k.submitted_by, k.created_by].includes(p.actor_id)) throw new AppError(403, "IndependenceRequired", "You prepared or submitted this comparison, so you cannot reconcile it.");
        const stops = [
          ...l.differences.filter((d) => d.disposition === "Open").map((d) => `${d.component}: no disposition is recorded.`), ...l.differences.filter((d) => d.disposition === "RejectedCorrectionRequired").map((d) => `${d.component}: a physical correction is required and is not yet re-observed.`),
          ...l.differences.filter((d) => d.disposition === "ReferredToChange").map((d) => `${d.component}: referred to ${d.change?.reference ?? "an engineering change"}. A request for review is not a resolution; record the outcome as a new disposition.`),
          ...l.redlines.filter((r) => r.state === "AcceptedForIncorporation").map((r) => `${r.reference}: accepted for incorporation is not incorporated. It needs a verified successor of ${r.source_snapshot.reference}.`),
          ...l.redlines.filter((r) => ["Recorded", "UnderReview", "ClarificationRequired"].includes(r.state)).map((r) => `${r.reference}: still ${label(r.state).toLowerCase()}.`),
          ...l.associations.filter((a) => a.state !== "Confirmed").map((a) => `${a.from_reference} → ${a.to_reference}: this association is ${label(a.state).toLowerCase()}.`),
        ];
        if (stops.length) throw blocked("ReconciliationBlocked", stops);
        const hash = sha256({ reference: k.installed_reference, revision: k.installed_revision, intended: k.intended_source_id, installed: k.installed_source_id, items: l.differences.map(({ item_key, kind, component, intended_value, observed_value, proposed_as_built, disposition, change_id, redline_id }) => ({ item_key, kind, component, intended_value, observed_value, proposed_as_built, disposition, change_id, redline_id })),
          associations: l.associations.map(({ id, kind, from_reference, to_reference, effective_from }) => ({ id, kind, from_reference, to_reference, effective_from })) });
        await c.query(`UPDATE ppo.commissioning_configurations SET ${bump},state='Reconciled',reconciled_by=$3,reconciled_at=clock_timestamp(),reconcile_reason=$4,policy_id=$5,policy_version=$6,independence_required=$7,content_hash=$8 WHERE workspace_id=$1 AND id=$2`,
          [ws, k.id, p.actor_id, command.decision_reason, access.policy!.id, access.policy!.policy_version, independent, hash]);
        return done(c, p, access, command, l, { subject_type: "Configuration", subject_id: k.id, event_type: "ConfigurationReconciled", note: command.decision_reason }, "Reconciled", { configuration_hash: hash });
      }
      case "redline": {
        currentVersion(l.row.version, command.expected_version);
        const drawing = source(sources, command.source_id, ["DrawingIssue"], "source_id", "the exact drawing issue this redline marks up")!;
        if (command.predecessor_id && !l.redlines.some((r) => r.id === command.predecessor_id && ["ClarificationRequired", "Rejected"].includes(r.state))) throw invalidField("predecessor_id", "A corrected redline follows one that was returned for clarification or rejected. The original stays as it was recorded.");
        const number = (await c.query<{ next: number }>("SELECT coalesce(max(r.redline_number),0)+1 AS next FROM ppo.commissioning_redlines r JOIN ppo.commissioning_packages k ON (k.workspace_id,k.id)=(r.workspace_id,r.commissioning_id) WHERE r.workspace_id=$1 AND k.package_id=$2", [ws, access.pkg.id])).rows[0].next;
        await c.query(`INSERT INTO ppo.commissioning_redlines(id,workspace_id,company_id,commissioning_id,created_by,updated_by,redline_number,reference,source_id,source_snapshot,location,component,description,evidence,proposed_correction,author_id,predecessor_id) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$5,$15)`,
          [command.id, ws, company, l.row.id, p.actor_id, number, `RL-${String(number).padStart(3, "0")}`, drawing.id, JSON.stringify(snapshotOf(drawing)), command.location, command.component, command.description, command.evidence, command.proposed_correction, command.predecessor_id]);
        return done(c, p, access, command, l, { subject_type: "Redline", subject_id: command.id, event_type: "RedlineRecorded", note: `RL-${String(number).padStart(3, "0")} against ${drawing.reference} Rev ${drawing.revision}` }, "Recorded");
      }
      case "redline_decide": case "redline_verify": {
        asBuilt();
        const r = l.redlines.find((x) => x.id === command.redline_id);
        if (!r) throw unavailable();
        currentVersion(r.version, command.expected_version);
        if (r.author_id === p.actor_id) throw new AppError(403, "IndependenceRequired", "You recorded this redline, so you cannot review or verify it.");
        if (command.action === "redline_verify") {
          if (r.state !== "AcceptedForIncorporation") throw refuse("NotAccepted", "Only a redline that was accepted for incorporation is verified as incorporated.", 409);
          const successor = source(sources, command.successor_source_id, ["DrawingIssue"], "successor_source_id", "the successor drawing issue")!, original = sources.find((s) => s.id === r.source_id);
          // The successor is the revision the source owner actually published over the marked-up one. A newer file, or another drawing, is not it.
          if (successor.reference !== r.source_snapshot.reference || original?.successor_id !== successor.id || successor.use !== "Current") throw invalidField("successor_source_id", `Choose the current issue that superseded ${r.source_snapshot.reference} Rev ${r.source_snapshot.revision}. It is published by its owner through the upstream adapter, never created here.`);
          await c.query(`UPDATE ppo.commissioning_redlines SET ${bump},state='IncorporatedVerified',successor_source_id=$4,verification_note=$5,verified_by=$3,verified_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2`, [ws, r.id, p.actor_id, successor.id, command.verification_note]);
          return done(c, p, access, command, l, { subject_type: "Redline", subject_id: r.id, event_type: "RedlineIncorporatedVerified", note: `${successor.reference} Rev ${successor.revision}: ${command.verification_note}` }, "IncorporatedVerified");
        }
        const allowed = { UnderReview: ["Recorded"], ClarificationRequired: ["Recorded", "UnderReview"], AcceptedForIncorporation: ["Recorded", "UnderReview"], Rejected: ["Recorded", "UnderReview", "ClarificationRequired"] } as const;
        if (!(allowed[command.decision] as readonly string[]).includes(r.state)) throw refuse("InvalidTransition", `A redline that is ${label(r.state).toLowerCase()} cannot become ${label(command.decision).toLowerCase()}.`, 409);
        if (command.decision === "AcceptedForIncorporation") {
          if (!command.classification) throw invalidField("classification", "Classify the redline: a clerical correction, or a material technical difference.");
          // A material difference is assessed by change review before it is drawn. The link is the referral, not the resolution.
          if (command.classification === "Material" && !command.change_id) throw invalidField("change_id", "A material technical difference is referred to an engineering change (EN-07) of this package before it is accepted for incorporation.");
        }
        await packageChange(c, p, access, command.change_id, "change_id");
        if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id", "edit");
        await c.query(`UPDATE ppo.commissioning_redlines SET ${bump},state=$4,decision_reason=$5,decided_by=$3,decided_at=clock_timestamp(),classification=coalesce($6,classification),owner_id=coalesce($7,owner_id),due=coalesce($8,due),change_id=coalesce($9,change_id) WHERE workspace_id=$1 AND id=$2`,
          [ws, r.id, p.actor_id, command.decision, command.decision_reason, command.classification, command.owner_id, command.due, command.change_id]);
        return done(c, p, access, command, l, { subject_type: "Redline", subject_id: r.id, event_type: `Redline${command.decision}`, note: command.decision_reason }, command.decision);
      }
      case "association": {
        currentVersion(l.row.version, command.expected_version);
        await asset(command.from_asset_id, "from_asset_id"); await asset(command.to_asset_id, "to_asset_id");
        const known = new Set(l.definitions.map((d) => d.key));
        if (command.affected_checks.some((k) => !known.has(k))) throw invalidField("affected_checks", "An affected check is a check of the current test basis.");
        if (command.predecessor_id) {
          const before = l.associations.find((a) => a.id === command.predecessor_id);
          if (!before) throw invalidField("predecessor_id", "A changed association follows a current association of this package.");
          await c.query(`UPDATE ppo.commissioning_associations SET ${bump},state='Superseded' WHERE workspace_id=$1 AND id=$2`, [ws, before.id, p.actor_id]);
        }
        // A changed or questioned association asks for review and names the functional checks that rested on it; it invalidates nothing else.
        const state = command.concern || (command.predecessor_id && command.affected_checks.length) ? "ReviewRequired" : "Proposed";
        if (state === "ReviewRequired" && !command.concern) throw invalidField("concern", "Say what changed and name the sourced constraint, so the affected checks can be reassessed.");
        await c.query(`INSERT INTO ppo.commissioning_associations(id,workspace_id,company_id,commissioning_id,created_by,updated_by,kind,from_reference,from_asset_id,to_reference,to_asset_id,source,confirmation_method,effective_from,state,concern,constraint_source,affected_checks,predecessor_id)
          VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, [command.id, ws, company, l.row.id, p.actor_id, command.kind, command.from_reference, command.from_asset_id, command.to_reference, command.to_asset_id, command.source, command.confirmation_method,
          command.effective_from, state, command.concern, command.constraint_source, JSON.stringify(command.affected_checks), command.predecessor_id]);
        return done(c, p, access, command, l, { subject_type: "Association", subject_id: command.id, event_type: command.predecessor_id ? "AssociationChanged" : "AssociationRecorded", note: `${command.from_reference} → ${command.to_reference}` }, state);
      }
      case "association_review": {
        asBuilt();
        const a = l.associations.find((x) => x.id === command.association_id);
        if (!a) throw unavailable();
        currentVersion(a.version, command.expected_version);
        if (a.created_by === p.actor_id) throw new AppError(403, "IndependenceRequired", "You recorded this association, so you cannot confirm it.");
        const method = command.confirmation_method ?? a.confirmation_method;
        if (command.decision === "Confirmed" && !method) throw invalidField("confirmation_method", "Say how the association was confirmed.");
        if (command.decision === "ReviewRequired" && !command.concern) throw invalidField("concern", "Say what the concern is and name the sourced constraint it rests on.");
        await c.query(`UPDATE ppo.commissioning_associations SET ${bump},state=$4,reviewer_id=$3,reviewed_at=clock_timestamp(),review_note=$5,confirmation_method=$6,concern=$7,constraint_source=$8,affected_checks=$9 WHERE workspace_id=$1 AND id=$2`,
          [ws, a.id, p.actor_id, command.decision, command.review_note, method, command.decision === "Confirmed" ? null : command.concern, command.decision === "Confirmed" ? null : command.constraint_source, JSON.stringify(command.decision === "Confirmed" ? [] : command.affected_checks)]);
        return done(c, p, access, command, l, { subject_type: "Association", subject_id: a.id, event_type: `Association${command.decision}`, note: command.review_note }, command.decision);
      }
      case "backup": {
        currentVersion(l.row.version, command.expected_version);
        await asset(command.asset_id, "asset_id");
        await c.query(`INSERT INTO ppo.commissioning_backups(id,workspace_id,company_id,commissioning_id,created_by,updated_by,asset_reference,asset_id,purpose,configuration_version,native_format,stored_reference,content_hash,captured_at,author_id,access_class,compatibility,required_stage)
          VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$5,$14,$15,$16)`, [command.id, ws, company, l.row.id, p.actor_id, command.asset_reference, command.asset_id, command.purpose, command.configuration_version, command.native_format, command.stored_reference, command.content_hash, command.captured_at,
          command.access_class, command.compatibility, command.required_stage]);
        return done(c, p, access, command, l, { subject_type: "Backup", subject_id: command.id, event_type: "BackupReferenceRecorded", note: `${command.asset_reference} ${command.configuration_version}` }, "Recorded");
      }
      default: {
        const k = l.backups.find((x) => x.id === command.backup_id);
        if (!k) throw unavailable();
        currentVersion(k.version, command.expected_version);
        // Three separate facts, each with its own evidence. None is implied by another, and none contacts a controller.
        const done_ = { available: k.available_at, identity: k.identity_at, restore: k.restore_at }[command.fact];
        if (done_) throw refuse("AlreadyRecorded", "This fact is already evidenced on this backup reference.", 409);
        if (command.fact === "identity" && (!k.available_at || !k.content_hash)) throw blocked("BackupNotAvailable", ["Identity is verified against a backup that is evidenced as available, by its recorded content hash."]);
        if (command.fact === "restore" && !k.identity_at) throw blocked("BackupIdentityNeeded", ["A restore is verified on a backup whose identity is already verified."]);
        await c.query(`UPDATE ppo.commissioning_backups SET ${bump},${command.fact === "available" ? "available" : command.fact}_evidence=$4,${command.fact}_by=$3,${command.fact}_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2`, [ws, k.id, p.actor_id, command.evidence]);
        return done(c, p, access, command, l, { subject_type: "Backup", subject_id: k.id, event_type: `Backup${command.fact === "available" ? "Available" : command.fact === "identity" ? "IdentityVerified" : "RestoreVerified"}`, note: command.evidence }, command.fact);
      }
    }
  }, "CommissioningPackage", "CommissioningRecordSaved");
}

// ---------------------------------------------------------------------------------------------
// The gates of one candidate, over exactly the scope it names. Nothing here reads a filter, a page or a count a client sent.
export function candidateGates(l: Loaded, access: Access, actor: string, release: Pick<ReleaseRow, "included" | "excluded" | "recipients" | "manifest" | "partial" | "submitted_by" | "created_by">) {
  const included = new Set(release.included), scopeIncluded = l.scope.items.filter((i) => i.disposition === "Included"), covered = new Set([...release.included, ...release.excluded.map((x) => x.key)]);
  const approver = policyAllows(access.policy, actor, "AsBuiltApprover"), independent = access.policy?.independence.as_built ?? true;
  const facts: GateFacts = {
    ...l.facts, coverage: l.coverageFor(included),
    identity_unverified_critical: scopeIncluded.filter((i) => included.has(i.key) && i.critical && i.identity !== "Verified").length,
    partial: release.partial, scope_selected: release.included.length, scope_excluded_without_reason: scopeIncluded.filter((i) => !covered.has(i.key)).length,
    // A shared interface blocks a partial release when it joins something released to something held back and is not assessed as independent.
    shared_unresolved: l.scope.interfaces.filter((f) => f.assessment !== "Independent" && f.items.some((k) => included.has(k)) && f.items.some((k) => !included.has(k))).map((f) => f.label),
    manifest_complete: manifestComplete(release.manifest as never), recipients_named: release.recipients.length > 0,
    reviewer_refusal: !access.can.review ? null : approver ?? (independent && [release.submitted_by, release.created_by].includes(actor) ? "You prepared or submitted this candidate, so you cannot approve it." : null), criteria_source_current: l.condition.condition === "Current",
  };
  return releaseGates(facts);
}
async function candidate(c: QueryClient, p: Principal, access: Access, l: Loaded, r: ReleaseRow) {
  const manifest = releaseManifest(l, access, r, await names(c, p));
  return { manifest, hash: sha256(manifest) };
}
export async function releaseCommand(p: Principal, packageId: string, value: unknown, render: Renderer = renderPdf) {
  const command = parseReleaseCommand(value), duty: Duty[] = command.action === "approve" || command.action === "return" ? ["review"] : command.action === "issue" || command.action === "withdraw" ? ["issue"] : command.action === "prepare" ? ["issue", "edit"] : ["edit"];
  let prepared: Prepared | null = null;
  if (command.action === "prepare") {
    // Exact bytes are rendered and stored before the transaction, under the reserved output identity. The same checks run
    // first as any read, and everything is checked again inside the transaction: bytes never issue anything by existing.
    const c = database(), access = await commissioningAccess(c, p, packageId);
    if (!duty.some((d) => access.can[d])) requireDuty(access, "issue");
    const l = (await loadRecords(c, p, access, await loadSources(c, p, access))).find((x) => x.row.id === command.record_id), r = l?.releases.find((x) => x.id === command.release_id);
    if (!l || !r) throw unavailable();
    if (r.state !== "ApprovedForIssue") throw refuse("NotApproved", "Outputs are prepared for a release that is approved for issue.", 409);
    const who = await names(c, p), { manifest, hash } = await candidate(c, p, access, l, r);
    if (hash !== r.manifest_hash) throw refuse("CandidateStale", "What this candidate rests on changed after it was approved. The approval is retained as history; prepare a successor revision for review.", 409);
    prepared = await prepareBundle(p, { output_id: command.id, kind: "OUT-12", audience: r.audience, manifest_hash: hash, html: (o) => recordHtml(manifest, who, o), head: `${access.pkg.customer_name} · ${access.site_name ?? ""} · ${l.row.reference}`, foot: `${r.reference} revision ${r.revision_number}` }, render);
  }
  return sharedOperation<Access>(p, command, `CommissioningRelease:${command.action}`, async (c) => {
    const access = await commissioningAccess(c, p, packageId);
    if (!duty.some((d) => access.can[d])) requireDuty(access, duty[0]);
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l } = await opened(c, p, access, command.record_id), ws = p.workspace_id, bump = "version=version+1,updated_at=clock_timestamp(),updated_by=$3";
    open(l);
    if (command.action === "draft") {
      currentVersion(l.row.version, command.expected_version);
      const live = l.releases.find((r) => ["Draft", "InReview", "ApprovedForIssue"].includes(r.state));
      if (live) throw refuse("CandidateOpen", `${live.reference} revision ${live.revision_number} is ${label(live.state).toLowerCase()}. Finish it before starting another candidate.`, 409);
      if (!l.approved_basis || !l.configuration) throw blocked("CandidateNotPossible", [!l.approved_basis && "No test basis is approved for test.", !l.configuration && "No installed configuration has been compared."].filter((x): x is string => !!x));
      // A successor revision follows an issued or withdrawn release of the same number and inherits none of its decisions.
      const before = command.predecessor_id ? l.releases.find((r) => r.id === command.predecessor_id && ["Issued", "Withdrawn"].includes(r.state)) : null;
      if (command.predecessor_id && !before) throw invalidField("predecessor_id", "A successor revision follows an issued or withdrawn release of this package.");
      const number = before?.release_number ?? (l.releases.reduce((n, r) => Math.max(n, r.release_number), 0) + 1), revision = before ? Math.max(...l.releases.filter((r) => r.release_number === number).map((r) => r.revision_number)) + 1 : 1;
      const included = before?.included ?? l.scope.items.filter((i) => i.disposition === "Included").map((i) => i.key), draft = { id: command.id, reference: `AB-${String(number).padStart(3, "0")}`, revision_number: revision, partial: before?.partial ?? false, included, excluded: before?.excluded ?? [], audience: before?.audience ?? "Internal" as const,
        recipients: before?.recipients ?? [], scope_id: l.scope.id, basis_id: l.approved_basis.id, configuration_id: l.configuration.id };
      const manifest = releaseManifest(l, access, draft, await names(c, p));
      await c.query(`INSERT INTO ppo.commissioning_releases(id,workspace_id,company_id,commissioning_id,created_by,updated_by,release_number,revision_number,predecessor_id,reference,partial,scope_id,basis_id,configuration_id,included,excluded,audience,recipients,manifest,manifest_hash)
        VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`, [command.id, ws, access.pkg.company_id, l.row.id, p.actor_id, number, revision, before?.id ?? null, draft.reference, draft.partial, draft.scope_id, draft.basis_id, draft.configuration_id,
        JSON.stringify(draft.included), JSON.stringify(draft.excluded), draft.audience, JSON.stringify(draft.recipients), JSON.stringify(manifest), sha256(manifest)]);
      return done(c, p, access, command, l, { subject_type: "Release", subject_id: command.id, event_type: before ? "ReleaseSuccessorDrafted" : "ReleaseDrafted", note: `${draft.reference} revision ${revision}` }, "Draft");
    }
    const r = l.releases.find((x) => x.id === command.release_id);
    if (!r) throw unavailable();
    currentVersion(r.version, command.expected_version);
    if (command.action === "save") {
      if (r.state !== "Draft") throw refuse("CandidateFrozen", "A submitted candidate is frozen. A material edit is a successor revision, which is reviewed again.", 409);
      const scopeIncluded = l.scope.items.filter((i) => i.disposition === "Included").map((i) => i.key), chosen = new Set(command.included), held = new Set(command.excluded.map((x) => x.key));
      if (command.included.some((k) => !scopeIncluded.includes(k)) || command.excluded.some((x) => !scopeIncluded.includes(x.key))) throw invalidField("included", "A release names items that are included in this package's scope.");
      // Every item of the declared scope is named, either as released or as held back with its reason. Nothing is left to be inferred.
      const unnamed = scopeIncluded.filter((k) => !chosen.has(k) && !held.has(k));
      if (unnamed.length) throw invalidField("excluded", `Say whether each scope item is released or held back: ${unnamed.map((k) => l.scope.items.find((i) => i.key === k)!.title).join(", ")}.`);
      for (const [i, x] of command.excluded.entries()) if (x.owner_id) await eligiblePerson(c, p, access, x.owner_id, `excluded-${i}`);
      for (const [i, x] of command.recipients.entries()) {
        await eligiblePerson(c, p, access, x.recipient_id, `recipients-${i}`, "receive");
        if (policyAllows(access.policy, x.recipient_id, "Receiver", { destination: x.destination })) throw invalidField(`recipients-${i}`, access.policy ? `The policy does not name this person as the receiver for ${label(x.destination)}.` : "Authority not configured: no commissioning policy covers this company and site.");
      }
      const next = { ...r, partial: command.excluded.length > 0, included: command.included, excluded: command.excluded, audience: command.audience, recipients: command.recipients, scope_id: l.scope.id, basis_id: l.approved_basis?.id ?? r.basis_id, configuration_id: l.configuration?.id ?? r.configuration_id };
      const manifest = releaseManifest(l, access, next, await names(c, p));
      await c.query(`UPDATE ppo.commissioning_releases SET ${bump},partial=$4,scope_id=$5,basis_id=$6,configuration_id=$7,included=$8,excluded=$9,audience=$10,recipients=$11,manifest=$12,manifest_hash=$13 WHERE workspace_id=$1 AND id=$2`,
        [ws, r.id, p.actor_id, next.partial, next.scope_id, next.basis_id, next.configuration_id, JSON.stringify(next.included), JSON.stringify(next.excluded), next.audience, JSON.stringify(next.recipients), JSON.stringify(manifest), sha256(manifest)]);
      return done(c, p, access, command, l, { subject_type: "Release", subject_id: r.id, event_type: "ReleaseCandidateSaved" }, "Draft");
    }
    // From here on every decision is made against what the candidate rests on now, recomputed inside this transaction.
    const now = await candidate(c, p, access, l, r), stale = () => refuse("CandidateStale", `What this candidate rests on changed after it was ${r.state === "Draft" ? "saved" : r.state === "InReview" ? "submitted" : "approved"}: a test result, a review, a redline, a source or the scope. ${r.state === "Draft" ? "Save it again to review the difference." : "The earlier decision is retained as history and is not moved onto changed content; prepare a successor revision."}`, 409);
    if (command.action === "submit") {
      if (r.state !== "Draft") throw refuse("CandidateFrozen", "This candidate was already submitted.", 409);
      if (now.hash !== r.manifest_hash) throw stale();
      const stops = gateBlockers(candidateGates(l, access, p.actor_id, r).filter((g) => g.key !== "authority"));
      if (stops.length) throw blocked("ReleaseGatesBlocked", stops);
      await c.query(`UPDATE ppo.commissioning_releases SET ${bump},state='InReview',submitted_hash=manifest_hash,submitted_by=$3,submitted_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2`, [ws, r.id, p.actor_id]);
      return done(c, p, access, command, l, { subject_type: "Release", subject_id: r.id, event_type: "ReleaseSubmitted" }, "InReview");
    }
    if (command.action === "return") {
      if (r.state !== "InReview") throw refuse("NotInReview", "Only a candidate in review is returned.", 409);
      authority(policyAllows(access.policy, p.actor_id, "AsBuiltApprover"));
      await c.query(`UPDATE ppo.commissioning_releases SET ${bump},state='Draft',return_reason=$4,returned_by=$3,returned_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2`, [ws, r.id, p.actor_id, command.decision_reason]);
      return done(c, p, access, command, l, { subject_type: "Release", subject_id: r.id, event_type: "ReleaseReturned", note: command.decision_reason }, "Draft");
    }
    if (command.action === "approve") {
      if (r.state !== "InReview") throw refuse("NotInReview", "Only a candidate in review is approved for issue.", 409);
      if (now.hash !== r.submitted_hash) throw stale();
      const stops = gateBlockers(candidateGates(l, access, p.actor_id, r));
      if (stops.length) throw blocked("ReleaseGatesBlocked", stops);
      const independent = access.policy!.independence.as_built;
      await c.query(`UPDATE ppo.commissioning_releases SET ${bump},state='ApprovedForIssue',approved_by=$3,approved_at=clock_timestamp(),approval_reason=$4,approval_source_state=$5,policy_id=$6,policy_version=$7,independence_required=$8,approval_operation_id=$9 WHERE workspace_id=$1 AND id=$2`,
        [ws, r.id, p.actor_id, command.decision_reason, sourceState(l), access.policy!.id, access.policy!.policy_version, independent, command.operation_id]);
      await recordCheck(c, p, access, command, l);
      return done(c, p, access, command, l, { subject_type: "Release", subject_id: r.id, event_type: "ReleaseApprovedForIssue", note: command.decision_reason }, "ApprovedForIssue", { manifest_hash: r.submitted_hash, policy_version: access.policy!.policy_version });
    }
    if (command.action === "prepare") {
      if (r.state !== "ApprovedForIssue" || now.hash !== r.manifest_hash || prepared!.manifest_hash !== r.manifest_hash) throw stale();
      const o = prepared!;
      // Prepared is not issued, sent, delivered or acknowledged. It is exact bytes waiting for the issue decision.
      await c.query(`INSERT INTO ppo.commissioning_outputs(id,workspace_id,company_id,commissioning_id,release_id,kind,audience,template_version,renderer_version,manifest_hash,content,bundle_sha256,bundle_bytes,html_sha256,html_bytes,pdf_sha256,pdf_bytes,prepared_by,prepared_at,prepare_operation_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) ON CONFLICT (id) DO NOTHING`, [o.id, ws, access.pkg.company_id, l.row.id, r.id, o.kind, o.audience, o.template_version, o.renderer_version, o.manifest_hash, JSON.stringify({ reference: r.reference, revision: r.revision_number }),
        o.bundle_sha256, o.bundle_bytes, o.html_sha256, o.html_bytes, o.pdf_sha256, o.pdf_bytes, p.actor_id, o.prepared_at, command.operation_id]);
      return done(c, p, access, command, l, { subject_type: "Output", subject_id: o.id, event_type: "OutputPrepared", note: `${o.kind} ${o.pdf_sha256}${o.recovered ? " (recovered from the original preparation)" : ""}` }, "Prepared", { output_id: o.id, pdf_sha256: o.pdf_sha256, html_sha256: o.html_sha256 });
    }
    authority(policyAllows(access.policy, p.actor_id, "Issuer"));
    if (command.action === "withdraw") {
      if (r.state !== "Issued") throw refuse("NotIssued", "Only an issued release is withdrawn.", 409);
      await c.query(`UPDATE ppo.commissioning_releases SET ${bump},state='Withdrawn',withdrawn_by=$3,withdrawn_at=clock_timestamp(),withdrawn_reason=$4 WHERE workspace_id=$1 AND id=$2`, [ws, r.id, p.actor_id, command.decision_reason]);
      const recipients = l.requests.filter((x) => x.handover.release_id === r.id).map((x) => x.handover.recipient_name);
      // The issued bytes, manifests, decisions and receiving outcomes stay exactly as they were. Recording a withdrawal recalls no file, notifies nobody and stops no site work.
      return done(c, p, access, command, l, { subject_type: "Release", subject_id: r.id, event_type: "ReleaseWithdrawn", note: `${command.decision_reason}${recipients.length ? ` Recipients to follow up: ${recipients.join(", ")}.` : ""}` }, "Withdrawn");
    }
    // issue: eligibility, authority, expected version, exact content and source applicability are all rechecked here, at the commit boundary.
    if (r.state !== "ApprovedForIssue") throw refuse("NotApproved", "A release is issued after it is approved for issue. Approval and issue are separate decisions.", 409);
    if (now.hash !== r.manifest_hash) throw stale();
    const stops = gateBlockers(candidateGates(l, access, r.approved_by!, r));
    if (stops.length) throw blocked("ReleaseGatesBlocked", stops);
    const o = l.outputs.find((x) => x.id === command.output_id && x.release_id === r.id && x.kind === "OUT-12");
    if (!o || o.state !== "Prepared" || o.manifest_hash !== r.manifest_hash) throw blocked("OutputNotPrepared", ["Prepare the exact output for this approved candidate first. A release is never issued without its durable bytes."]);
    // The bytes that were previewed are the bytes that are issued: they are read back and verified against every recorded hash.
    await readBundle(p, o);
    await c.query("UPDATE ppo.commissioning_outputs SET version=version+1,state='Issued',issued_at=clock_timestamp(),issue_operation_id=$3 WHERE workspace_id=$1 AND id=$2", [ws, o.id, command.operation_id]);
    await c.query("UPDATE ppo.commissioning_outputs SET version=version+1,state='Discarded' WHERE workspace_id=$1 AND release_id=$2 AND id<>$3 AND state='Prepared'", [ws, r.id, o.id]);
    await c.query(`UPDATE ppo.commissioning_releases SET ${bump},state='Issued',issued_by=$3,issued_at=clock_timestamp(),issue_operation_id=$4,issue_source_state=$5 WHERE workspace_id=$1 AND id=$2`, [ws, r.id, p.actor_id, command.operation_id, sourceState(l)]);
    if (r.predecessor_id) await c.query(`UPDATE ppo.commissioning_releases SET ${bump},state='Superseded',successor_id=$4 WHERE workspace_id=$1 AND id=$2 AND state='Issued'`, [ws, r.predecessor_id, p.actor_id, r.id]);
    await recordCheck(c, p, access, command, l);
    await record(c, p, access, command, { commissioning_id: l.row.id, subject_type: "Output", subject_id: o.id, event_type: "OutputIssued", note: `${o.kind} ${o.pdf_sha256}` });
    return done(c, p, access, command, l, { subject_type: "Release", subject_id: r.id, event_type: r.partial ? "PartialReleaseIssued" : "ReleaseIssued", note: `${r.reference} revision ${r.revision_number}. Nothing was sent to anyone, no Project was completed and no warranty was started.` }, "Issued",
      { release_id: r.id, output_id: o.id, pdf_sha256: o.pdf_sha256, manifest_hash: r.manifest_hash });
  }, "CommissioningPackage", command.action === "issue" ? "CommissioningReleaseIssued" : command.action === "approve" || command.action === "return" || command.action === "withdraw" ? "CommissioningReleaseDecided" : "CommissioningRecordSaved");
}

// ---------------------------------------------------------------------------------------------
export async function handoverCommand(p: Principal, packageId: string, value: unknown, render: Renderer = renderPdf) {
  const command = parseHandoverCommand(value), duty: Duty = command.action === "decide" ? "receive" : "edit";
  let prepared: Prepared | null = null;
  if (command.action === "request" || command.action === "resubmit") {
    const c = database(), access = await commissioningAccess(c, p, packageId);
    requireDuty(access, duty);
    const l = (await loadRecords(c, p, access, await loadSources(c, p, access))).find((x) => x.row.id === command.record_id);
    if (!l) throw unavailable();
    const built = await packFor(c, p, access, l, command);
    prepared = await prepareBundle(p, { output_id: command.output_id, kind: "OUT-13", audience: "Internal", manifest_hash: built.hash, html: (o) => packHtml(built.manifest, o), head: `${access.pkg.customer_name} · ${access.site_name ?? ""} · ${l.row.reference}`, foot: `Handover to ${label(built.manifest.destination)}` }, render);
  }
  return sharedOperation<Access>(p, command, `CommissioningHandover:${command.action}`, async (c) => {
    const access = await commissioningAccess(c, p, packageId);
    if (command.action === "obligation_state" ? !(access.can.edit || access.can.review) : !access.can[duty]) requireDuty(access, duty);
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l } = await opened(c, p, access, command.record_id), ws = p.workspace_id, company = access.pkg.company_id, bump = "version=version+1,updated_at=clock_timestamp(),updated_by=$3";
    open(l);
    if (command.action === "obligation") {
      await eligiblePerson(c, p, access, command.owner_id, "owner_id");
      const o = l.obligations.find((x) => x.id === command.id);
      if (o) {
        currentVersion(o.version, command.expected_version ?? 0);
        await c.query(`UPDATE ppo.commissioning_obligations SET ${bump},title=$4,subject=$5,content_revision=$6,source_reference=$7,owner_id=$8,due=$9 WHERE workspace_id=$1 AND id=$2`, [ws, o.id, p.actor_id, command.title, command.subject, command.content_revision, command.source_reference, command.owner_id, command.due]);
      } else await c.query("INSERT INTO ppo.commissioning_obligations(id,workspace_id,company_id,commissioning_id,created_by,updated_by,kind,title,required_stage,subject,content_revision,source_reference,owner_id,due) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
        [command.id, ws, company, l.row.id, p.actor_id, command.kind, command.title, command.required_stage, command.subject, command.content_revision, command.source_reference, command.owner_id, command.due]);
      return done(c, p, access, command, l, { subject_type: "Obligation", subject_id: command.id, event_type: o ? "ObligationUpdated" : "ObligationRecorded", note: `${command.title} (${label(command.required_stage).toLowerCase()})` }, o?.state ?? "Open");
    }
    if (command.action === "obligation_state") {
      const o = l.obligations.find((x) => x.id === command.obligation_id);
      if (!o) throw unavailable();
      currentVersion(o.version, command.expected_version);
      // A hold is released by evidence from its source, or dispositioned by a named authority with a reason. There is no general "proceed".
      if (o.kind === "Hold") { requireDuty(access, "review"); if (command.state === "Dispositioned" && !command.disposition_authority) throw invalidField("disposition_authority", "Name the source authority that permits this exception."); }
      const delivered = command.delivered_on ?? o.delivered_on, evidence = command.evidence ?? o.evidence, competence = command.competence_note ?? o.competence_note;
      const stops = [["Delivered", "EvidenceRecorded", "CompetenceConfirmed"].includes(command.state) && !delivered && "Record the date it was actually delivered. A planned date is not a delivery.", ["EvidenceRecorded", "CompetenceConfirmed", "Complete"].includes(command.state) && !evidence && "Record the evidence. Attendance that was not recorded is not completed training.",
        command.state === "CompetenceConfirmed" && !competence && "Say how competence was confirmed. Attendance alone does not establish it.", command.state === "Dispositioned" && (!command.disposition_reason || !command.disposition_authority) && "A disposition names its reason and the authority for it."].filter((x): x is string => !!x);
      if (stops.length) throw blocked("ObligationFactsNeeded", stops);
      await c.query(`UPDATE ppo.commissioning_obligations SET ${bump},state=$4,planned_on=coalesce($5,planned_on),delivered_on=$6,evidence=$7,competence_note=$8,disposition_reason=coalesce($9,disposition_reason),disposition_authority=coalesce($10,disposition_authority) WHERE workspace_id=$1 AND id=$2`,
        [ws, o.id, p.actor_id, command.state, command.planned_on, delivered, evidence, competence, command.disposition_reason, command.disposition_authority]);
      return done(c, p, access, command, l, { subject_type: "Obligation", subject_id: o.id, event_type: `Obligation${command.state}`, note: command.evidence ?? command.disposition_reason ?? null }, command.state);
    }
    if (command.action === "request" || command.action === "resubmit") {
      const built = await packFor(c, p, access, l, command), o = prepared!;
      // Confirmation applies exactly what was prepared, or nothing. Changed content is prepared again; it is never sent under the earlier bytes.
      if (built.hash !== o.manifest_hash) throw refuse("PreviewStale", "What this pack rests on changed while it was being prepared. Nothing was sent; prepare it again.", 409);
      const handoverId = command.action === "request" ? command.id : command.handover_id, submissionId = command.action === "request" ? command.submission_id : command.id;
      if (command.action === "request") {
        currentVersion(l.row.version, command.expected_version);
        await c.query("INSERT INTO ppo.commissioning_handovers(id,workspace_id,company_id,commissioning_id,release_id,created_by,updated_by,destination,recipient_id,purpose,support_owner_id,due,created_operation_id) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12)",
          [command.id, ws, company, l.row.id, command.release_id, p.actor_id, command.destination, command.recipient_id, command.purpose, command.support_owner_id, command.due, command.operation_id]);
      } else { currentVersion(built.existing!.handover.version, command.expected_version); await c.query(`UPDATE ppo.commissioning_handovers SET ${bump} WHERE workspace_id=$1 AND id=$2`, [ws, handoverId, p.actor_id]); }
      await c.query(`INSERT INTO ppo.commissioning_outputs(id,workspace_id,company_id,commissioning_id,release_id,handover_id,kind,audience,template_version,renderer_version,manifest_hash,content,bundle_sha256,bundle_bytes,html_sha256,html_bytes,pdf_sha256,pdf_bytes,state,prepared_by,prepared_at,prepare_operation_id,issued_at,issue_operation_id)
        VALUES($1,$2,$3,$4,$5,$6,'OUT-13','Internal',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'Issued',$17,$18,$19,clock_timestamp(),$19)`, [o.id, ws, company, l.row.id, built.release.id, handoverId, o.template_version, o.renderer_version, o.manifest_hash, JSON.stringify({ destination: built.manifest.destination }),
        o.bundle_sha256, o.bundle_bytes, o.html_sha256, o.html_bytes, o.pdf_sha256, o.pdf_bytes, p.actor_id, o.prepared_at, command.operation_id]);
      const delivery = command.simulate_delivery;
      await c.query("INSERT INTO ppo.commissioning_handover_submissions(id,workspace_id,company_id,handover_id,submission_number,manifest,manifest_hash,output_id,correction_note,submitted_by,operation_id,delivery,delivery_checked_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,clock_timestamp())",
        [submissionId, ws, company, handoverId, (built.existing?.submissions.length ?? 0) + 1, JSON.stringify(built.manifest), built.hash, o.id, command.action === "resubmit" ? command.correction_note : null, p.actor_id, command.operation_id, delivery]);
      return done(c, p, access, command, l, { subject_type: "Submission", subject_id: submissionId, event_type: command.action === "request" ? "ReceivingRequested" : "CorrectedManifestSubmitted",
        note: `${label(built.manifest.destination)} · ${built.manifest.recipient_name}. Synthetic receiver: ${delivery === "Delivered" ? "request recorded for the receiver; no message was sent to anyone" : `the receiver answered “${delivery.toLowerCase()}”, so the outcome is not known`}.` }, delivery === "Delivered" ? "Requested" : "OutcomeUnknown", { handover_id: handoverId, manifest_hash: built.hash, output_id: o.id });
    }
    const found = l.requests.find((x) => x.handover.id === command.handover_id);
    if (!found || !found.last) throw unavailable();
    const h = found.handover, last = found.last;
    if (command.action === "reconcile") {
      currentVersion(h.version, command.expected_version);
      if (last.delivery === "Delivered") throw refuse("NothingToReconcile", "The receiver already holds this request. There is nothing to recover.", 409);
      // The original operation is looked up again with the synthetic receiver. It is never resent: one request, one identity.
      await c.query("UPDATE ppo.commissioning_handover_submissions SET version=version+1,delivery='Delivered',delivery_checked_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2", [ws, last.id]);
      await c.query(`UPDATE ppo.commissioning_handovers SET ${bump} WHERE workspace_id=$1 AND id=$2`, [ws, h.id, p.actor_id]);
      return done(c, p, access, command, l, { subject_type: "Submission", subject_id: last.id, event_type: "ReceivingReconciled", note: `Original operation ${last.operation_id} was found with the synthetic receiver. No second request was made.` }, "Requested");
    }
    if (command.action === "cancel") {
      currentVersion(h.version, command.expected_version);
      if (last.outcome === "Accepted") throw refuse("NotCancellable", "An accepted handover is not cancelled. A later change is a successor release and its own request.", 409);
      await c.query(`UPDATE ppo.commissioning_handovers SET ${bump},cancelled_by=$3,cancelled_at=clock_timestamp(),cancelled_reason=$4 WHERE workspace_id=$1 AND id=$2`, [ws, h.id, p.actor_id, command.reason]);
      return done(c, p, access, command, l, { subject_type: "Handover", subject_id: h.id, event_type: "ReceivingRequestCancelled", note: command.reason }, "Cancelled");
    }
    // decide: the named receiver's own outcome on the exact manifest in front of them.
    currentVersion(last.version, command.expected_version);
    if (last.id !== command.submission_id) throw refuse("SubmissionSuperseded", "A corrected manifest exists. Decide the latest exact manifest; an earlier decision does not carry over to it.", 409);
    if (last.outcome) throw refuse("AlreadyDecided", `This exact manifest was already ${label(last.outcome).toLowerCase()} by operation ${last.outcome_operation_id}. Recover that original outcome; it is never decided twice.`, 409);
    if (last.delivery !== "Delivered") throw refuse("NotDelivered", "The receiver has not been reached with this request yet. Its sender recovers the original operation first.", 409);
    if (h.recipient_id !== p.actor_id || last.submitted_by === p.actor_id) throw new AppError(403, "IndependenceRequired", `This request is addressed to ${h.recipient_name}. A manifest is decided by the receiver it names, never by whoever sent it.`);
    authority(policyAllows(access.policy, p.actor_id, "Receiver", { destination: h.destination }));
    if (sha256(last.manifest) !== last.manifest_hash) throw refuse("ManifestTampered", "The stored manifest no longer matches its hash. It cannot be decided.", 409);
    if (command.outcome === "Accepted") {
      const release = l.releases.find((r) => r.id === h.release_id)!, stage = h.destination === "Service" ? ["ServiceAcceptance"] : h.destination === "Projects" ? ["CustomerHandover"] : [];
      const stops = [release.state !== "Issued" && `${release.reference} revision ${release.revision_number} is ${label(release.state).toLowerCase()}. It cannot be accepted; return it with your reason.`,
        ...l.obligations.filter((o) => stage.includes(o.required_stage) && !["EvidenceRecorded", "CompetenceConfirmed", "Complete", "Dispositioned"].includes(o.state)).map((o) => `${o.title}: required ${label(o.required_stage).toLowerCase()} and still ${label(o.state).toLowerCase()}. Return the pack, or wait for it.`)].filter((x): x is string => !!x);
      if (stops.length) throw blocked("AcceptanceBlocked", stops);
    }
    if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id", "edit");
    await c.query("UPDATE ppo.commissioning_handover_submissions SET version=version+1,outcome=$3,outcome_reason=$4,outcome_by=$5,outcome_at=clock_timestamp(),outcome_operation_id=$6,return_owner_id=$7,return_due=$8 WHERE workspace_id=$1 AND id=$2",
      [ws, last.id, command.outcome, command.outcome_reason, p.actor_id, command.operation_id, command.owner_id, command.due]);
    await c.query(`UPDATE ppo.commissioning_handovers SET ${bump} WHERE workspace_id=$1 AND id=$2`, [ws, h.id, p.actor_id]);
    // One outcome, for one destination, on one manifest. It completes no Project, starts no warranty, books nobody and changes no installed-base record.
    return done(c, p, access, command, l, { subject_type: "Submission", subject_id: last.id, event_type: `Receiving${command.outcome}`, note: command.outcome_reason }, command.outcome, { handover_id: h.id, manifest_hash: last.manifest_hash });
  }, "CommissioningPackage", command.action === "request" || command.action === "resubmit" ? "CommissioningHandoverSubmitted" : command.action === "decide" ? "CommissioningReceivingDecided" : "CommissioningRecordSaved");
}
type PackCommand = Extract<ReturnType<typeof parseHandoverCommand>, { action: "request" | "resubmit" }>;
// The exact pack for one request, from the issued release it hands over. The same function builds it before the
// transaction (to render it) and inside it (to prove nothing moved in between).
async function packFor(c: QueryClient, p: Principal, access: Access, l: Loaded, command: PackCommand) {
  const existing = command.action === "resubmit" ? l.requests.find((x) => x.handover.id === command.handover_id) ?? null : null;
  if (command.action === "resubmit" && (!existing || !existing.last)) throw unavailable();
  const release = l.releases.find((r) => r.id === (existing?.handover.release_id ?? (command.action === "request" ? command.release_id : "")));
  if (!release) throw unavailable();
  if (release.state !== "Issued") throw blocked("ReleaseNotIssued", [`${release.reference} revision ${release.revision_number} is ${label(release.state).toLowerCase()}. A handover is prepared against an issued release.`]);
  if (command.action === "request") {
    await eligiblePerson(c, p, access, command.recipient_id, "recipient_id", "receive");
    const refusal = policyAllows(access.policy, command.recipient_id, "Receiver", { destination: command.destination });
    if (refusal) throw invalidField("recipient_id", access.policy ? `The policy does not name this person as the receiver for ${label(command.destination)}.` : refusal);
    if (command.support_owner_id) await eligiblePerson(c, p, access, command.support_owner_id, "support_owner_id");
    const same = l.requests.find((x) => x.handover.release_id === release.id && x.handover.destination === command.destination && x.handover.recipient_id === command.recipient_id && x.handover.id !== command.id);
    if (same) throw refuse("RequestExists", `${same.handover.recipient_name} already has a request for ${label(command.destination)} on this release (${label(same.state).toLowerCase()}). ${same.state === "Returned" || same.state === "ClarificationRequired" ? "Correct and resubmit it" : same.state === "OutcomeUnknown" || same.state === "Unavailable" ? "Recover its original operation" : "Wait for its outcome"}; a second request would be a duplicate.`, 409);
  } else if (!["Returned", "ClarificationRequired"].includes(existing!.state)) throw refuse("NotReturned", "Only a returned request is corrected and resubmitted. It keeps its identity; the returned manifest stays exactly as it was judged.", 409);
  const request = command.action === "request" ? command : { destination: existing!.handover.destination, recipient_id: existing!.handover.recipient_id, purpose: existing!.handover.purpose, support_owner_id: existing!.handover.support_owner_id };
  const manifest = handoverManifest(l, access, release, request, await names(c, p), command.action === "resubmit" ? { note: command.correction_note, previous_hash: existing!.last!.manifest_hash } : null);
  return { manifest, hash: sha256(manifest), release, existing };
}

// Original-operation recovery rechecks present access, by the same duty the command needed, before any receipt is disclosed.
export async function commissioningReceiptAuthority(c: QueryClient, p: Principal, recordId: string, commandName: string) {
  const owner = (await c.query<{ package_id: string }>("SELECT package_id FROM ppo.commissioning_packages WHERE workspace_id=$1 AND id=$2", [p.workspace_id, recordId])).rows[0];
  if (!owner) throw unavailable();
  const access = await commissioningAccess(c, p, owner.package_id), [family, action] = commandName.split(":");
  const duties: Duty[] = family === "CommissioningBasis" ? (action === "approve" || action === "return" ? ["review"] : ["edit"]) : family === "CommissioningInspection" ? inspectionDuty(action) : family === "CommissioningConfiguration" ? configurationDuty(action)
    : family === "CommissioningRelease" ? (action === "approve" || action === "return" ? ["review"] : action === "issue" || action === "withdraw" ? ["issue"] : action === "prepare" ? ["issue", "edit"] : ["edit"])
    : family === "CommissioningHandover" ? (action === "decide" ? ["receive"] : ["edit"]) : action === "assess" ? ["source"] : action === "check" ? (Object.keys(access.can) as Duty[]) : ["edit"];
  if (!duties.some((d) => access.can[d])) throw unavailable();
}
