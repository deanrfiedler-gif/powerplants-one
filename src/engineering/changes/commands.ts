import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import type { QueryClient } from "../../platform/permissions";
import {
  authority, blocked, changesAccess, contributors, currentVersion, documentOf, eligiblePerson, loadPackageChanges, loadSources, record, refuse, requireDuty, revisionHash, sha256, snapshotOf, stamp, touch,
  type Access, type Duty, type LiveSource, type LoadedChange,
} from "./context";
import { buildPreview, handoverContext, requestPayload, type ProposedRequest } from "./preview";
import { parseChangeCommand, parseHandoverCommand, parsePrerequisiteCommand, parseReviewCommand, parseRevisionCommand, parseVerificationCommand } from "./validation";
import {
  closureBlockers, isOpen, label, policyAllows, prerequisiteFrom, requestBlockers, sourcePresentation, submitBlockers,
  type AffectedObject, type ClosureFacts, type ProposalDocument, type SourceSnapshot,
} from "./model";

type Saved = { id: string; version: number; state: string; updated_at: Date; audit_details?: Record<string, unknown> };
const invalidField = (field: string, message: string) => new AppError(422, "InvalidData", "Check the highlighted details.", [{ field, message }]);
async function opened(c: PoolClient, p: Principal, access: Access, changeId: string) {
  const sources = await loadSources(c, p, access), all = await loadPackageChanges(c, p, access, sources, changeId), l = all.find((x) => x.row.id === changeId);
  if (!l) throw unavailable();
  return { sources, all, l };
}
const independent = async (c: QueryClient, p: Principal, l: LoadedChange, act: string) => {
  if ((await contributors(c, p, l.row)).has(p.actor_id)) throw new AppError(403, "IndependenceRequired", `You authored or changed this proposal, so you cannot ${act} it. Reassigning the change does not remove your contribution.`);
};
// One eligibility answer per person and duty inside a command, however many fields name them.
function people(c: QueryClient, p: Principal, access: Access) {
  const seen = new Map<string, Promise<unknown>>();
  return (id: string | null, field: string, duty: Duty | null = null) => (id ? (seen.get(`${id}:${duty}`) ?? seen.set(`${id}:${duty}`, eligiblePerson(c, p, access, id, field, duty)).get(`${id}:${duty}`)!) : Promise.resolve(null));
}
// A recorded source check: what the upstream adapter answered, when, and for whom. Decisions that rest on
// current sources write one in the same transaction, so "Sources current" always has a real check behind it.
async function recordCheck(c: PoolClient, p: Principal, access: Access, command: { operation_id: string; reason: string }, l: LoadedChange) {
  const id = randomUUID();
  await c.query("INSERT INTO ppo.change_source_checks(id,workspace_id,company_id,change_id,revision_id,result,details,adapter,operation_id,checked_by) VALUES($1,$2,$3,$4,$5,$6,$7,'SyntheticUpstreamFixture',$8,$9)",
    [id, p.workspace_id, access.pkg.company_id, l.row.id, l.revision.id, l.condition.condition, JSON.stringify({ reasons: l.condition.reasons, capability: "Local retained snapshots only; no live provider is connected", sources: l.links.map((s) => ({ source_id: s.source_id, role: s.role, required: s.required, snapshot: s.snapshot, live: s.live })) }), command.operation_id, p.actor_id]);
  return id;
}

// ---------------------------------------------------------------------------------------------
export async function changeCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseChangeCommand(value);
  return sharedOperation<Access>(p, command, `Change:${command.action}`, async (c) => {
    const access = await changesAccess(c, p, packageId);
    requireDuty(access, "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    const named = people(c, p, access);
    if (command.action === "create") {
      await named(command.next_owner_id, "next_owner_id");
      if (command.predecessor_change_id && !(await c.query("SELECT 1 FROM ppo.engineering_changes WHERE workspace_id=$1 AND package_id=$2 AND id=$3 AND stage='Closed'", [p.workspace_id, access.pkg.id, command.predecessor_change_id])).rowCount)
        throw invalidField("predecessor_change_id", "A successor follows a closed change of this package.");
      const number = (await c.query<{ next: number }>("SELECT coalesce(max(change_number),0)+1 AS next FROM ppo.engineering_changes WHERE workspace_id=$1 AND package_id=$2", [p.workspace_id, access.pkg.id])).rows[0].next;
      const saved = (await c.query<Saved>(
        `INSERT INTO ppo.engineering_changes(id,workspace_id,company_id,package_id,created_by,updated_by,change_number,reference,title,category,discipline,location,system_name,author_id,next_owner_id,due,priority,priority_reason,predecessor_change_id)
         VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$5,$13,$14,$15,$16,$17) RETURNING id,version,stage AS state,updated_at`,
        [command.id, p.workspace_id, access.pkg.company_id, access.pkg.id, p.actor_id, number, `SYN-EN07-${String(number).padStart(3, "0")}`, command.title, command.category, command.discipline, command.location, command.system_name,
          command.next_owner_id, command.due, command.priority, command.priority_reason, command.predecessor_change_id])).rows[0];
      const empty: ProposalDocument = { rationale: null, proposed_reference: null, proposed_revision: null, scope_statement: null, comparison: [], options: [], selected_option: null, categories: [], costs: [], dates: [], objects: [], sources: [], retests: [], requires_revised_release: true };
      await c.query("INSERT INTO ppo.change_revisions(id,workspace_id,company_id,change_id,created_by,updated_by,revision_number,content_hash) VALUES($1,$2,$3,$4,$5,$5,1,$6)",
        [command.revision_id, p.workspace_id, access.pkg.company_id, command.id, p.actor_id, revisionHash(command, empty, new Map())]);
      await record(c, p, access, command, { change_id: command.id, subject_type: "Change", subject_id: command.id, event_type: "ChangeCreated" });
      return saved;
    }
    const { l } = await opened(c, p, access, command.change_id);
    currentVersion(l.row.version, command.expected_version);
    if (!isOpen(l.row.stage)) throw refuse("ChangeClosed", "This change is closed or withdrawn. Later evidence is handled through a linked successor change.", 409);
    if (command.action === "coordinate") {
      await named(command.next_owner_id, "next_owner_id");
      const saved = await touch(c, p, l.row.id, "next_owner_id=$4,due=$5,priority=$6,priority_reason=$7", [command.next_owner_id, command.due, command.priority, command.priority_reason]);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Change", subject_id: l.row.id, event_type: "ChangeCoordinated" });
      return saved;
    }
    // Withdrawal stops the proposal. It erases nothing: issued requests still need an outcome or a cancellation,
    // and a receiver who already accepted implementation work is asked to acknowledge the withdrawal.
    await c.query("UPDATE ppo.change_handovers SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,acknowledgement_required=true WHERE workspace_id=$1 AND change_id=$2 AND state='Accepted' AND purpose='Implementation'", [p.workspace_id, l.row.id, p.actor_id]);
    const saved = await touch(c, p, l.row.id, "stage='Withdrawn',stage_before_withdrawal=$4,withdrawn_at=clock_timestamp(),withdrawn_by=$3,withdrawn_reason=$5", [l.row.stage, command.reason]);
    await record(c, p, access, command, { change_id: l.row.id, subject_type: "Change", subject_id: l.row.id, event_type: "ChangeWithdrawn", note: command.reason });
    return saved;
  }, "EngineeringChange", "ChangeRecordSaved");
}

// ---------------------------------------------------------------------------------------------
const localTypes = { MaterialLine: "line", MaterialRelease: "release", DrawingIssue: "source", InstalledAsset: "asset" } as const;
async function typedObjects(c: QueryClient, p: Principal, access: Access, sources: LiveSource[], objects: Omit<AffectedObject, "object_key">[]): Promise<AffectedObject[]> {
  const ids = (type: keyof typeof localTypes) => objects.filter((o) => o.object_type === type && o.object_id).map((o) => o.object_id!);
  const found = new Set<string>([
    ...(await c.query<{ id: string }>("SELECT l.id FROM ppo.material_lines l JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(l.workspace_id,l.set_id) WHERE l.workspace_id=$1 AND s.package_id=$2 AND l.id=ANY($3::uuid[])", [p.workspace_id, access.pkg.id, ids("MaterialLine")])).rows.map((r) => `MaterialLine:${r.id}`),
    ...(await c.query<{ id: string }>("SELECT r.id FROM ppo.material_releases r JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(r.workspace_id,r.set_id) WHERE r.workspace_id=$1 AND s.package_id=$2 AND r.id=ANY($3::uuid[])", [p.workspace_id, access.pkg.id, ids("MaterialRelease")])).rows.map((r) => `MaterialRelease:${r.id}`),
    // An installed asset belongs to this package's company and, where the package names one, its site.
    ...(await c.query<{ id: string }>("SELECT id FROM ppo.assets WHERE workspace_id=$1 AND company_id=$2 AND id=ANY($3::uuid[]) AND ($4::uuid IS NULL OR site_id=$4)", [p.workspace_id, access.pkg.company_id, ids("InstalledAsset"), access.pkg.site_id])).rows.map((r) => `InstalledAsset:${r.id}`),
    ...sources.filter((s) => s.kind === "DrawingIssue").map((s) => `DrawingIssue:${s.id}`),
  ]);
  return objects.map((o, i) => {
    if (o.object_id && !(o.object_type in localTypes)) throw invalidField(`objects-${i}`, `No local record exists for a ${label(o.object_type).toLowerCase()}; identify it by its exact reference.`);
    if (o.object_id && !found.has(`${o.object_type}:${o.object_id}`)) throw invalidField(`objects-${i}`, `${o.reference} is not a ${label(o.object_type).toLowerCase()} of this package's scope.`);
    // The identity two changes are compared by: the local UUID where one exists, otherwise the exact typed reference.
    return { ...o, object_key: `${o.object_type}:${o.object_id ?? o.reference.trim().replace(/\s+/g, " ").toUpperCase()}` };
  });
}

export async function revisionCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseRevisionCommand(value);
  return sharedOperation<Access>(p, command, `ChangeRevision:${command.action}`, async (c) => {
    const access = await changesAccess(c, p, packageId);
    // Asking the adapter whether sources are still current is open to everyone who acts on the answer.
    if (command.action === "check") { if (!(["edit", "review", "decide", "verify", "commercial"] as Duty[]).some((d) => access.can[d])) requireDuty(access, "edit"); } else requireDuty(access, "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l, sources } = await opened(c, p, access, command.change_id), named = people(c, p, access);
    if (command.action === "check") {
      const id = await recordCheck(c, p, access, command, l), saved = await touch(c, p, l.row.id);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "SourceCheck", subject_id: id, event_type: "SourcesChecked", note: l.condition.reasons.join(" ") || null });
      return { ...saved, state: l.condition.condition };
    }
    if (!isOpen(l.row.stage)) throw refuse("ChangeClosed", "This change is closed or withdrawn. Later evidence is handled through a linked successor change.", 409);
    if (command.action === "begin") {
      currentVersion(l.row.version, command.expected_version);
      if (l.row.stage !== "Draft") throw refuse("AlreadyAssessing", "Assessment has already started.", 409);
      const needs = [!l.revision.rationale && "the reason for the change", !l.baseline && "the exact baseline source", !l.revision.proposed_revision && "the proposed revision"].filter(Boolean);
      if (needs.length) throw blocked("CaptureIncomplete", [`Before assessment starts, capture ${needs.join(", ")}. The draft is saved as it is.`]);
      const saved = await touch(c, p, l.row.id, "stage='Assessing'");
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Change", subject_id: l.row.id, event_type: "AssessmentStarted" });
      return saved;
    }
    if (command.action === "revise") {
      currentVersion(l.row.version, command.expected_version);
      const after = l.revision.state === "Returned" || (l.revision.state === "Decided" && l.decision?.result === "Accepted");
      if (!after) throw refuse("NotRevisable", "A successor revision follows a returned proposal, or amends an accepted one. A working proposal is simply edited; a rejected one is closed.", 409);
      const number = l.revision.revision_number + 1;
      await c.query(`INSERT INTO ppo.change_revisions(id,workspace_id,company_id,change_id,created_by,updated_by,revision_number,predecessor_id,rationale,proposed_reference,proposed_revision,scope_statement,requires_revised_release,comparison,options,selected_option,categories,costs,dates,content_hash)
        SELECT $3,workspace_id,company_id,change_id,$4,$4,$5,id,rationale,proposed_reference,proposed_revision,scope_statement,requires_revised_release,comparison,options,selected_option,categories,costs,dates,content_hash FROM ppo.change_revisions WHERE workspace_id=$1 AND id=$2`,
        [p.workspace_id, l.revision.id, command.id, p.actor_id, number]);
      // The successor starts as an exact copy with identities of its own; the returned or decided revision stays as it was judged.
      await c.query(`INSERT INTO ppo.change_objects(id,workspace_id,company_id,revision_id,object_type,object_id,object_key,reference,title,current_state,proposed_effect,relation,disposition,exclusion_reason,finding,evidence,owner_id,next_action,location,served_areas,supply_state,sort_order)
        SELECT gen_random_uuid(),workspace_id,company_id,$3,object_type,object_id,object_key,reference,title,current_state,proposed_effect,relation,disposition,exclusion_reason,finding,evidence,owner_id,next_action,location,served_areas,supply_state,sort_order FROM ppo.change_objects WHERE workspace_id=$1 AND revision_id=$2`, [p.workspace_id, l.revision.id, command.id]);
      await c.query("INSERT INTO ppo.change_revision_sources(workspace_id,company_id,revision_id,source_id,role,required,snapshot) SELECT workspace_id,company_id,$3,source_id,role,required,snapshot FROM ppo.change_revision_sources WHERE workspace_id=$1 AND revision_id=$2", [p.workspace_id, l.revision.id, command.id]);
      await c.query(`INSERT INTO ppo.change_retests(id,workspace_id,company_id,revision_id,criterion,requirement_ref,asset_or_system,configuration,procedure_source_id,reason,verifier_id,due,sort_order)
        SELECT gen_random_uuid(),workspace_id,company_id,$3,criterion,requirement_ref,asset_or_system,configuration,procedure_source_id,reason,verifier_id,due,sort_order FROM ppo.change_retests WHERE workspace_id=$1 AND revision_id=$2`, [p.workspace_id, l.revision.id, command.id]);
      const saved = await touch(c, p, l.row.id, "stage='Assessing',current_revision=$4", [number]);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Revision", subject_id: command.id, event_type: "RevisionCreated", note: `Revision ${number} follows revision ${l.revision.revision_number}, which is retained exactly as it was ${l.revision.state === "Returned" ? "returned" : "decided"}.` });
      return saved;
    }
    if (l.revision.id !== command.revision_id) throw unavailable();
    currentVersion(l.revision.version, command.expected_version);
    if (l.revision.state !== "Working") throw refuse("ProposalFrozen", "A submitted proposal is frozen. Correct it through a successor revision after it is returned.", 409);

    if (command.action === "save") {
      const { operation_id: _o, schema_version: _s, reason: _r, action: _a, change_id: _c, revision_id: _v, expected_version: _e, title, category, discipline, location, system_name, objects: rawObjects, ...rest } = command;
      void [_o, _s, _r, _a, _c, _v, _e];
      const byId = new Map(sources.map((s) => [s.id, s])), snapshots = new Map<string, SourceSnapshot>();
      rest.sources.forEach((s, i) => {
        const source = byId.get(s.source_id);
        if (!source) throw invalidField(`sources-${i}`, "Choose a source retained for this package.");
        if (s.role === "Baseline" && !["DrawingIssue", "DesignBasis"].includes(source.kind)) throw invalidField(`sources-${i}`, "A baseline is an approved or released drawing issue or design basis.");
        // The snapshot is what was observed of this exact retained source. A newer file is not an approved successor.
        snapshots.set(s.source_id, snapshotOf(source));
      });
      rest.retests.forEach((r, i) => {
        if (r.procedure_source_id && byId.get(r.procedure_source_id)?.kind !== "TestProcedure") throw invalidField(`retests-${i}`, "Choose an approved test procedure retained for this package.");
      });
      const objects = await typedObjects(c, p, access, sources, rawObjects);
      if (new Set(objects.map((o) => o.object_key)).size !== objects.length) throw invalidField("objects", "The same object appears twice. One asset serving several areas is one row with its areas listed.");
      for (const [i, o] of objects.entries()) await named(o.owner_id, `objects-${i}`);
      for (const [i, k] of rest.categories.entries()) await named(k.owner_id, `categories-${i}`, k.key === "cost" || k.key === "dates" ? "commercial" : null);
      for (const [i, d] of rest.dates.entries()) await named(d.owner_id, `dates-${i}`);
      for (const [i, r] of rest.retests.entries()) await named(r.verifier_id, `retests-${i}`, "verify");
      const doc: ProposalDocument = { ...rest, objects }, hash = revisionHash({ title, category, discipline, location, system_name }, doc, snapshots);
      await c.query(`UPDATE ppo.change_revisions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,rationale=$4,proposed_reference=$5,proposed_revision=$6,scope_statement=$7,requires_revised_release=$8,comparison=$9,options=$10,selected_option=$11,categories=$12,costs=$13,dates=$14,content_hash=$15 WHERE workspace_id=$1 AND id=$2`,
        [p.workspace_id, l.revision.id, p.actor_id, doc.rationale, doc.proposed_reference, doc.proposed_revision, doc.scope_statement, doc.requires_revised_release, JSON.stringify(doc.comparison), JSON.stringify(doc.options), doc.selected_option, JSON.stringify(doc.categories), JSON.stringify(doc.costs), JSON.stringify(doc.dates), hash]);
      for (const table of ["change_objects", "change_revision_sources", "change_retests"]) await c.query(`DELETE FROM ppo.${table} WHERE workspace_id=$1 AND revision_id=$2`, [p.workspace_id, l.revision.id]);
      for (const [i, o] of objects.entries())
        await c.query(`INSERT INTO ppo.change_objects(id,workspace_id,company_id,revision_id,object_type,object_id,object_key,reference,title,current_state,proposed_effect,relation,disposition,exclusion_reason,finding,evidence,owner_id,next_action,location,served_areas,supply_state,sort_order)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
          [o.id, p.workspace_id, access.pkg.company_id, l.revision.id, o.object_type, o.object_id, o.object_key, o.reference, o.title, o.current_state, o.proposed_effect, o.relation, o.disposition, o.exclusion_reason, o.finding, o.evidence, o.owner_id, o.next_action, o.location, JSON.stringify(o.served_areas), o.supply_state, i]);
      for (const s of doc.sources)
        await c.query("INSERT INTO ppo.change_revision_sources(workspace_id,company_id,revision_id,source_id,role,required,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)", [p.workspace_id, access.pkg.company_id, l.revision.id, s.source_id, s.role, s.required, JSON.stringify(snapshots.get(s.source_id))]);
      for (const [i, r] of doc.retests.entries())
        await c.query("INSERT INTO ppo.change_retests(id,workspace_id,company_id,revision_id,criterion,requirement_ref,asset_or_system,configuration,procedure_source_id,reason,verifier_id,due,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
          [r.id, p.workspace_id, access.pkg.company_id, l.revision.id, r.criterion, r.requirement_ref, r.asset_or_system, r.configuration, r.procedure_source_id, r.reason, r.verifier_id, r.due, i]);
      const saved = await touch(c, p, l.row.id, "title=$4,category=$5,discipline=$6,location=$7,system_name=$8", [title, category, discipline, location, system_name]);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Revision", subject_id: l.revision.id, event_type: hash === l.revision.content_hash ? "ProposalResaved" : "ProposalSaved" });
      return saved;
    }

    // submit: freeze the exact proposal and name its independent reviewers.
    if (l.row.stage !== "Assessing") throw refuse("NotAssessing", "Start the assessment before submitting it for review.", 409);
    const snapshots = new Map(l.links.map((s) => [s.source_id, s.snapshot]));
    if (revisionHash(l.row, l.document, snapshots) !== l.revision.content_hash) throw refuse("ProposalTampered", "The stored proposal no longer matches its content hash. Save it again before submitting.", 409);
    const stops = submitBlockers(l.document, command.reviewers, l.row.discipline, l.condition.condition);
    if (stops.length) throw blocked("SubmitBlocked", stops);
    const authors = await contributors(c, p, l.row);
    for (const [i, r] of command.reviewers.entries()) {
      await named(r.reviewer_id, `reviewers-${i}`, "review");
      if (authors.has(r.reviewer_id) || r.reviewer_id === p.actor_id) throw invalidField(`reviewers-${i}`, "A reviewer is independent of everyone who authored or changed this proposal.");
      const refusal = policyAllows(access.policy, r.reviewer_id, "DisciplineReviewer", { discipline: r.discipline });
      if (refusal) throw invalidField(`reviewers-${i}`, refusal.replace("does not name you as", "does not name this person as").replace(/^Your/, "Their"));
    }
    await c.query("UPDATE ppo.change_revisions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Submitted',submitted_hash=content_hash,submitted_at=clock_timestamp(),submitted_by=$3 WHERE workspace_id=$1 AND id=$2", [p.workspace_id, l.revision.id, p.actor_id]);
    for (const r of command.reviewers)
      await c.query("INSERT INTO ppo.change_reviews(id,workspace_id,company_id,change_id,revision_id,created_by,discipline,reviewer_id,required) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", [r.id, p.workspace_id, access.pkg.company_id, l.row.id, l.revision.id, p.actor_id, r.discipline, r.reviewer_id, r.required]);
    await recordCheck(c, p, access, command, l);
    const saved = await touch(c, p, l.row.id, "stage='InReview'");
    await record(c, p, access, command, { change_id: l.row.id, subject_type: "Revision", subject_id: l.revision.id, event_type: "ProposalSubmitted" });
    return saved;
  }, "EngineeringChange", "ChangeRecordSaved");
}

// ---------------------------------------------------------------------------------------------
export async function reviewCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseReviewCommand(value);
  return sharedOperation<Access>(p, command, `ChangeReview:${command.action}`, async (c) => {
    const access = await changesAccess(c, p, packageId);
    requireDuty(access, command.action === "respond" ? "review" : "decide");
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l, all } = await opened(c, p, access, command.change_id);
    if (command.action === "overlap") {
      currentVersion(l.row.version, command.expected_version);
      authority(policyAllows(access.policy, p.actor_id, "TechnicalAuthority", { discipline: l.row.discipline }));
      await independent(c, p, l, "decide the sequence of");
      const other = l.overlaps.find((o) => o.change_id === command.other_change_id);
      if (!other || other.restricted) throw refuse("NoOverlap", other ? "The other change is outside your access. Its owner, or someone who can read both, records the compatibility decision." : "These changes share no included object or baseline.", 409);
      // Recorded for both changes: compatibility is one fact about the pair. Neither proposal is merged, rebased or altered.
      for (const [id, a, b] of [[command.id, l.row.id, other.change_id], [randomUUID(), other.change_id, l.row.id]])
        await c.query("INSERT INTO ppo.change_overlap_decisions(id,workspace_id,company_id,change_id,other_change_id,decision,policy_id,policy_version,operation_id,decided_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT ON CONSTRAINT uq_change_overlap_decisions_pair DO NOTHING",
          [id, p.workspace_id, access.pkg.company_id, a, b, command.decision, access.policy!.id, access.policy!.policy_version, command.operation_id, p.actor_id]);
      const saved = await touch(c, p, l.row.id);
      if (all.some((x) => x.row.id === other.change_id)) await touch(c, p, other.change_id);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "OverlapDecision", subject_id: command.id, event_type: "OverlapDecided", note: `${other.reference}: ${command.decision}` });
      return saved;
    }
    if (l.row.stage !== "InReview" || l.revision.state !== "Submitted") throw refuse("NotInReview", "Only a submitted proposal is reviewed, returned or decided.", 409);
    await independent(c, p, l, command.action === "respond" ? "review" : "decide");
    const snapshots = new Map(l.links.map((s) => [s.source_id, s.snapshot]));
    if (revisionHash(l.row, l.document, snapshots) !== l.revision.submitted_hash) throw refuse("ProposalTampered", "The stored proposal no longer matches what was submitted. Nothing can be decided on it.", 409);
    const sourceState = JSON.stringify({ condition: l.condition.condition, reasons: l.condition.reasons, sources: l.links.map((s) => ({ source_id: s.source_id, role: s.role, snapshot: s.snapshot, live: s.live })) });

    if (command.action === "respond") {
      const review = l.reviews.find((r) => r.id === command.review_id);
      if (!review) throw unavailable();
      currentVersion(review.version, command.expected_version);
      if (review.reviewer_id !== p.actor_id) throw new AppError(403, "Forbidden", `This review is assigned to ${review.reviewer_name}.`);
      if (review.result) throw refuse("AlreadyResponded", "This review response was already given. A corrected proposal earns a new review.", 409);
      authority(policyAllows(access.policy, p.actor_id, "DisciplineReviewer", { discipline: review.discipline }));
      await c.query("UPDATE ppo.change_reviews SET version=version+1,result=$3,findings=$4,revision_hash=$5,source_state=$6,policy_id=$7,policy_version=$8,responded_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, review.id, command.result, command.findings, l.revision.submitted_hash, sourceState, access.policy!.id, access.policy!.policy_version]);
      const saved = await touch(c, p, l.row.id);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Review", subject_id: review.id, event_type: `Review${command.result}`, note: command.findings });
      return saved;
    }
    if (l.revision.id !== command.revision_id) throw unavailable();
    currentVersion(l.row.version, command.expected_version);
    authority(policyAllows(access.policy, p.actor_id, "TechnicalAuthority", { discipline: l.row.discipline }));
    if (command.action === "return") {
      await eligiblePerson(c, p, access, command.owner_id, "owner_id", "edit");
      await c.query("UPDATE ppo.change_revisions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Returned',return_kind=$4,return_reason=$5,returned_by=$3,returned_at=clock_timestamp(),return_owner_id=$6,return_due=$7 WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, l.revision.id, p.actor_id, command.return_kind, command.decision_reason, command.owner_id, command.due]);
      const saved = await touch(c, p, l.row.id, "stage='Returned',next_owner_id=$4,due=$5", [command.owner_id, command.due]);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Revision", subject_id: l.revision.id, event_type: "ProposalReturned", note: command.decision_reason });
      return saved;
    }
    // decide. A rejection needs independence, authority and a reason. An acceptance additionally needs the exact
    // submitted content, every required independent response without a blocking finding, and current required sources.
    if (command.result === "Accepted") {
      const stops: string[] = [];
      for (const r of l.reviews.filter((x) => x.required)) {
        if (!r.result) stops.push(`${r.discipline}: ${r.reviewer_name} has not responded.`);
        else if (r.revision_hash !== l.revision.submitted_hash) stops.push(`${r.discipline}: the response was given on different content.`);
        else if (r.result !== "NoBlockingFinding") stops.push(`${r.discipline}: ${label(r.result).toLowerCase()} by ${r.reviewer_name}. Return the proposal for correction, or reject it; a blocking finding is never accepted with conditions.`);
      }
      if (!l.reviews.some((r) => r.required && r.discipline === l.row.discipline)) stops.push(`No required ${l.row.discipline} review exists for this revision.`);
      if (l.condition.condition !== "Current") stops.push(`${sourcePresentation[l.condition.condition].label}. ${l.condition.reasons.join(" ")} A positive decision rests on current, readable required sources.`);
      if (!l.revision.selected_option) stops.push("No option is selected.");
      if (stops.length) throw blocked("AcceptanceBlocked", stops);
    }
    await c.query("INSERT INTO ppo.change_decisions(id,workspace_id,company_id,change_id,revision_id,revision_hash,option_key,result,purpose,reason,source_state,policy_id,policy_version,operation_id,decided_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)",
      [command.id, p.workspace_id, access.pkg.company_id, l.row.id, l.revision.id, l.revision.submitted_hash, l.revision.selected_option ?? "none", command.result, command.purpose, command.decision_reason, sourceState, access.policy!.id, access.policy!.policy_version, command.operation_id, p.actor_id]);
    await c.query("UPDATE ppo.change_revisions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Decided' WHERE workspace_id=$1 AND id=$2", [p.workspace_id, l.revision.id, p.actor_id]);
    if (command.result === "Accepted") {
      // Technical acceptance settles nothing commercial. What the cost and dates findings left open becomes an owned prerequisite of implementation.
      for (const [kind, key] of [["Commercial", "cost"], ["Scheduling", "dates"]] as const) {
        const from = prerequisiteFrom(l.revision.categories.find((k) => k.key === key));
        await c.query("INSERT INTO ppo.change_prerequisites(id,workspace_id,company_id,change_id,decision_id,created_by,updated_by,kind,applicability,applicability_reason,owner_id,due) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11)",
          [randomUUID(), p.workspace_id, access.pkg.company_id, l.row.id, command.id, p.actor_id, kind, from.applicability === "Required" && !from.owner_id ? "Unknown" : from.applicability, from.reason, from.owner_id, l.row.due]);
      }
      await recordCheck(c, p, access, command, l);
    }
    const saved = await touch(c, p, l.row.id, "stage='DecisionRecorded'");
    await record(c, p, access, command, { change_id: l.row.id, subject_type: "Decision", subject_id: command.id, event_type: `Technical${command.result}`, note: command.decision_reason });
    return { ...saved, audit_details: { result: command.result, revision_hash: l.revision.submitted_hash, policy_version: access.policy!.policy_version } };
  }, "EngineeringChange", command.action === "respond" ? "ChangeRecordSaved" : "ChangeDecisionRecorded");
}

// ---------------------------------------------------------------------------------------------
// The in-module synthetic prerequisite. Its outcome is a fictional commercial or scheduling answer recorded
// by the policy-named commercial reviewer. It is never an actual Project, Finance or booking approval.
export async function prerequisiteCommand(p: Principal, packageId: string, value: unknown) {
  const command = parsePrerequisiteCommand(value);
  return sharedOperation<Access>(p, command, "ChangePrerequisite:resolve", async (c) => {
    const access = await changesAccess(c, p, packageId);
    requireDuty(access, "commercial");
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l, sources } = await opened(c, p, access, command.change_id), x = l.prerequisites.find((q) => q.id === command.prerequisite_id);
    if (!x) throw unavailable();
    currentVersion(x.version, command.expected_version);
    if (!isOpen(l.row.stage)) throw refuse("ChangeClosed", "This change is closed or withdrawn.", 409);
    if (x.applicability === "NotApplicable") throw refuse("NotApplicable", "This prerequisite was assessed as not applicable, with its reason. There is nothing to decide.", 409);
    if (x.state !== "Open") throw refuse("AlreadyResolved", `This prerequisite was already ${x.state.toLowerCase()} by operation ${x.outcome_operation_id}. Recover that original outcome; it is never decided twice.`, 409);
    authority(policyAllows(access.policy, p.actor_id, "CommercialReviewer"));
    if (x.owner_id && x.owner_id !== p.actor_id) throw new AppError(403, "Forbidden", `This ${x.kind.toLowerCase()} review is owned by ${x.owner_name}.`);
    await independent(c, p, l, "commercially review");
    if (command.evidence_source_id) {
      const evidence = sources.find((s) => s.id === command.evidence_source_id);
      if (!evidence || evidence.kind !== "CommercialDecision" || evidence.use !== "Current") throw invalidField("evidence_source_id", "Choose a current commercial decision retained for this package.");
    }
    await c.query("UPDATE ppo.change_prerequisites SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state=$4,outcome_note=$5,evidence_source_id=$6,resolved_by=$3,resolved_at=clock_timestamp(),outcome_operation_id=$7 WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, x.id, p.actor_id, command.outcome, command.note, command.evidence_source_id, command.operation_id]);
    const saved = await touch(c, p, l.row.id);
    await record(c, p, access, command, { change_id: l.row.id, subject_type: "Prerequisite", subject_id: x.id, event_type: `${x.kind}Review${command.outcome}`, note: command.note });
    return saved;
  }, "EngineeringChange", "ChangeDecisionRecorded");
}

// ---------------------------------------------------------------------------------------------
async function receiver(c: QueryClient, p: Principal, access: Access, r: Pick<ProposedRequest, "owner_id" | "destination">, field: string) {
  await eligiblePerson(c, p, access, r.owner_id, field, "receive");
  const refusal = policyAllows(access.policy, r.owner_id, "Receiver", { destination: r.destination });
  if (refusal) throw invalidField(field, access.policy ? `The policy does not name this person as the receiving owner for ${label(r.destination)}.` : refusal);
}
export async function handoverCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseHandoverCommand(value);
  return sharedOperation<Access>(p, command, `ChangeHandover:${command.action}`, async (c) => {
    const access = await changesAccess(c, p, packageId);
    requireDuty(access, command.action === "decide" || command.action === "acknowledge" ? "receive" : "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l } = await opened(c, p, access, command.change_id);
    if (command.action === "confirm") {
      currentVersion(l.row.version, command.expected_version);
      for (const [i, r] of command.requests.entries()) {
        await receiver(c, p, access, r, `requests-${i}`);
        // Reuse or correct the request that already exists; a second one for the same purpose and destination is a duplicate.
        const existing = l.requests.find((x) => !x.stale && x.handover.purpose === r.purpose && x.handover.destination === r.destination && ["Pending", "Returned", "Accepted"].includes(x.handover.state) && r.purpose !== "Amendment");
        if (existing) throw refuse("RequestExists", `${label(r.destination)} already has a ${existing.handover.state.toLowerCase()} “${label(r.purpose)}” request for this revision. ${existing.handover.state === "Returned" ? "Correct and resubmit it" : existing.handover.state === "Accepted" ? "A change to accepted work is an amendment request" : "Wait for its outcome, or cancel it with a reason"}.`, 409);
        if (r.amends_id && !l.requests.some((x) => x.handover.id === r.amends_id && x.handover.state === "Accepted" && x.handover.destination === r.destination)) throw invalidField(`requests-${i}`, "An amendment names a request this destination already accepted.");
      }
      const preview = buildPreview(l, access, command.requests);
      if (preview.blocked) throw blocked("HandoverBlocked", [...new Set(preview.requests.flatMap((r) => r.blockers.map((b) => `${label(r.purpose)}: ${b}`)))]);
      // Confirmation applies exactly what was reviewed, or nothing. A changed basis is shown again; it is never applied silently.
      if (preview.preview_hash !== command.preview_hash) throw refuse("PreviewStale", l.condition.condition === "Current" ? "The proposal, a prerequisite or the policy changed after this preview was made. Your proposed requests are retained; review the updated preview before confirming." : "Source changed — review the updated comparison. Your proposed requests are retained; nothing was created.", 409);
      for (const r of preview.requests) {
        await c.query("INSERT INTO ppo.change_handovers(id,workspace_id,company_id,change_id,revision_id,decision_id,created_by,updated_by,purpose,destination,owner_id,requested_action,due,amends_id,created_operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,$13,$14)",
          [r.id, p.workspace_id, access.pkg.company_id, l.row.id, l.revision.id, ["InformationRequired", "ImpactReview"].includes(r.purpose) ? l.decision?.id ?? null : l.decision!.id, p.actor_id, r.purpose, r.destination, r.owner_id, r.requested_action, r.due, r.amends_id, command.operation_id]);
        await c.query("INSERT INTO ppo.change_submissions(id,workspace_id,company_id,handover_id,submission_number,payload,payload_hash,submitted_by,operation_id) VALUES($1,$2,$3,$4,1,$5,$6,$7,$8)",
          [randomUUID(), p.workspace_id, access.pkg.company_id, r.id, JSON.stringify(r.payload), r.payload_hash, p.actor_id, command.operation_id]);
      }
      const saved = await touch(c, p, l.row.id);
      for (const r of preview.requests) await record(c, p, access, command, { change_id: l.row.id, subject_type: "Handover", subject_id: r.id, event_type: `${r.purpose}Requested`, note: `${label(r.destination)}: ${r.requested_action}` });
      return { ...saved, audit_details: { requests: preview.requests.map((r) => ({ id: r.id, purpose: r.purpose, destination: r.destination, payload_hash: r.payload_hash })) } };
    }
    const found = l.requests.find((x) => x.handover.id === command.handover_id);
    if (!found) throw unavailable();
    const h = found.handover, last = found.submissions.at(-1)!;
    currentVersion(h.version, command.expected_version);
    const setState = (sql: string, values: unknown[]) => c.query(`UPDATE ppo.change_handovers SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,${sql} WHERE workspace_id=$1 AND id=$2`, [p.workspace_id, h.id, p.actor_id, ...values]);
    if (command.action === "cancel") {
      if (!["Pending", "Returned"].includes(h.state)) throw refuse("NotCancellable", `A request that was ${h.state.toLowerCase()} is not cancelled. Accepted work is changed through an explicit amendment request.`, 409);
      await setState("state='Cancelled',cancelled_by=$3,cancelled_at=clock_timestamp(),cancelled_reason=$4", [command.reason]);
      const saved = await touch(c, p, l.row.id);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Handover", subject_id: h.id, event_type: "RequestCancelled", note: command.reason });
      return saved;
    }
    if (command.action === "acknowledge") {
      if (h.owner_id !== p.actor_id) throw new AppError(403, "Forbidden", `This request belongs to ${h.owner_name}.`);
      if (!h.acknowledgement_required || h.acknowledged_at) throw refuse("NothingToAcknowledge", "No acknowledgement is outstanding on this request.", 409);
      await setState("acknowledged_by=$3,acknowledged_at=clock_timestamp()", []);
      const saved = await touch(c, p, l.row.id);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Handover", subject_id: h.id, event_type: "WithdrawalAcknowledged" });
      return saved;
    }
    if (command.action === "resubmit") {
      if (h.state !== "Returned") throw refuse("NotReturned", "Only a returned request is corrected and resubmitted. It keeps its identity; the returned payload stays exactly as it was judged.", 409);
      if (!isOpen(l.row.stage)) throw refuse("ChangeClosed", "This change is closed or withdrawn.", 409);
      const proposed: ProposedRequest = { id: h.id, purpose: h.purpose, destination: h.destination, owner_id: h.owner_id, requested_action: h.requested_action, due: h.due, amends_id: h.amends_id };
      const stops = requestBlockers(h.purpose, handoverContext(l));
      if (stops.length) throw blocked("HandoverBlocked", stops);
      const preview = buildPreview(l, access, [proposed]);
      if (preview.preview_hash !== command.preview_hash) throw refuse("PreviewStale", "Source changed — review the updated comparison. Your correction note is retained; nothing was submitted.", 409);
      const payload = requestPayload(l, access, proposed, { note: command.correction_note, previous_hash: last.payload_hash });
      await c.query("INSERT INTO ppo.change_submissions(id,workspace_id,company_id,handover_id,submission_number,payload,payload_hash,submitted_by,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [command.id, p.workspace_id, access.pkg.company_id, h.id, last.submission_number + 1, JSON.stringify(payload), sha256(payload), p.actor_id, command.operation_id]);
      await setState("state='Pending'", []);
      const saved = await touch(c, p, l.row.id);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Submission", subject_id: command.id, event_type: "CorrectionSubmitted", note: command.correction_note });
      return saved;
    }
    // decide: the receiving owner's own outcome on the exact submission in front of them.
    if (last.id !== command.submission_id) throw refuse("SubmissionSuperseded", "A newer submission of this request exists. Decide the latest exact payload.", 409);
    if (last.outcome) throw refuse("AlreadyDecided", `This exact payload was already ${last.outcome.toLowerCase()} by operation ${last.outcome_operation_id}. Recover that original outcome; it is never decided twice.`, 409);
    if (h.state !== "Pending") throw refuse("NotPending", `This request is ${h.state.toLowerCase()}.`, 409);
    if (h.owner_id !== p.actor_id || last.submitted_by === p.actor_id) throw new AppError(403, "IndependenceRequired", "A payload is decided by the receiving owner it names, never by whoever sent it.");
    authority(policyAllows(access.policy, p.actor_id, "Receiver", { destination: h.destination }));
    if (sha256(last.payload) !== last.payload_hash) throw refuse("PayloadTampered", "The stored payload no longer matches its hash. It cannot be decided.", 409);
    if (command.outcome === "Accepted" && h.purpose === "Implementation") {
      const stops = found.stale ? ["The proposal was revised after this payload was sent. Return it, or wait for the amended request."] : requestBlockers(h.purpose, handoverContext(l));
      if (stops.length) throw blocked("HandoverBlocked", stops);
    }
    if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id", "edit");
    await c.query("UPDATE ppo.change_submissions SET version=version+1,outcome=$3,outcome_reason=$4,outcome_evidence=$5,outcome_by=$6,outcome_at=clock_timestamp(),outcome_operation_id=$7,return_owner_id=$8,return_due=$9 WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, last.id, command.outcome, command.outcome_reason, command.outcome_evidence, p.actor_id, command.operation_id, command.owner_id, command.due]);
    await setState("state=$4", [command.outcome]);
    const saved = await touch(c, p, l.row.id);
    await record(c, p, access, command, { change_id: l.row.id, subject_type: "Submission", subject_id: last.id, event_type: `Receiving${command.outcome}`, note: command.outcome_reason });
    return saved;
  }, "EngineeringChange", command.action === "confirm" || command.action === "resubmit" ? "ChangeRequestsSubmitted" : command.action === "decide" ? "ChangeReceivingDecided" : "ChangeRecordSaved");
}

// ---------------------------------------------------------------------------------------------
export function closureFacts(l: LoadedChange): ClosureFacts {
  return {
    ...l.facts, as_built_required: l.row.as_built_required, as_built_reference: l.row.as_built_reference,
    acknowledgements_outstanding: l.requests.filter((r) => r.handover.acknowledgement_required && !r.handover.acknowledged_at).length,
    corrective_open: l.verification.filter((v) => v.state === "Failed").length,
    // Closure counts every request of the change, including those sent on an earlier revision and never resolved.
    requests: l.requests.map((r) => ({ id: r.handover.id, purpose: r.handover.purpose, destination: r.handover.destination, state: r.handover.state })),
    stage: l.row.stage,
  };
}
export async function verificationCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseVerificationCommand(value);
  return sharedOperation<Access>(p, command, `ChangeVerification:${command.action}`, async (c) => {
    const access = await changesAccess(c, p, packageId);
    if (command.action === "as_built") { if (!access.can.verify) requireDuty(access, "edit"); } else requireDuty(access, command.action === "close" ? "close" : "verify");
    return access;
  }, async (c, access): Promise<Saved> => {
    const { l, sources } = await opened(c, p, access, command.change_id);
    currentVersion(l.row.version, command.expected_version);
    if (l.row.stage === "Closed") throw refuse("ChangeClosed", "This change is closed. Later evidence is handled through a linked successor change.", 409);
    if (command.action === "as_built") {
      const saved = await touch(c, p, l.row.id, "as_built_required=$4,as_built_reference=$5", [command.as_built_required, command.as_built_reference]);
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Change", subject_id: l.row.id, event_type: "AsBuiltReferenceRecorded", note: command.as_built_reference });
      return saved;
    }
    if (command.action === "close") {
      authority(policyAllows(access.policy, p.actor_id, "Closer"));
      await independent(c, p, l, "close");
      const stops = closureBlockers(command.meaning, closureFacts(l));
      if (stops.length) throw blocked("ClosureBlocked", stops);
      const basis = {
        schema_version: 1, meaning: command.meaning, change: { id: l.row.id, reference: l.row.reference, stage_before: l.row.stage, withdrawn_reason: l.row.withdrawn_reason },
        revision: { id: l.revision.id, number: l.revision.revision_number, hash: l.revision.submitted_hash }, decision: l.decision ? { id: l.decision.id, result: l.decision.result, purpose: l.decision.purpose, decided_at: stamp(l.decision.decided_at) } : null,
        source_condition: l.condition.condition, revised_release: l.issued ? { source_id: l.issued.id, ...snapshotOf(l.issued) } : null,
        prerequisites: l.prerequisites.map((x) => ({ id: x.id, kind: x.kind, applicability: x.applicability, state: x.state })),
        requests: l.requests.map((r) => ({ id: r.handover.id, purpose: r.handover.purpose, destination: r.handover.destination, state: r.handover.state, submissions: r.submissions.map((s) => ({ number: s.submission_number, payload_hash: s.payload_hash, outcome: s.outcome, outcome_at: stamp(s.outcome_at) })), acknowledged_at: stamp(r.handover.acknowledged_at) })),
        retests: l.verification.map((v) => ({ id: v.retest.id, criterion: v.retest.criterion, configuration: v.retest.configuration, state: v.state, attempts: v.attempts.map((a) => ({ id: a.id, number: a.attempt_number, result: a.result, tested_at: stamp(a.tested_at), evidence_reference: a.evidence_reference })) })),
        exclusions: l.objects.filter((o) => o.disposition === "Excluded").map((o) => ({ reference: o.reference, reason: o.exclusion_reason })), as_built_reference: l.row.as_built_reference,
      };
      await c.query("INSERT INTO ppo.change_closures(id,workspace_id,company_id,change_id,meaning,basis,basis_hash,reason,policy_id,policy_version,operation_id,closed_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [command.id, p.workspace_id, access.pkg.company_id, l.row.id, command.meaning, JSON.stringify(basis), sha256(basis), command.reason, access.policy!.id, access.policy!.policy_version, command.operation_id, p.actor_id]);
      const saved = await touch(c, p, l.row.id, "stage='Closed'");
      await record(c, p, access, command, { change_id: l.row.id, subject_type: "Closure", subject_id: command.id, event_type: `Closed${command.meaning}`, note: command.reason });
      return saved;
    }
    // attempt: one exact test of one frozen obligation, recorded by the competent verifier.
    authority(policyAllows(access.policy, p.actor_id, "Verifier"));
    await independent(c, p, l, "verify");
    const v = l.verification.find((x) => x.retest.id === command.retest_id);
    if (!v) throw unavailable();
    if (l.decision?.result !== "Accepted") throw refuse("NotAccepted", "A retest verifies an accepted change. This proposal has no current accepted technical decision.", 409);
    if (v.retest.verifier_id && v.retest.verifier_id !== p.actor_id) throw new AppError(403, "Forbidden", `This obligation names ${v.retest.verifier_name} as its verifier.`);
    if (v.state === "Passed") throw refuse("AlreadyPassed", "This obligation already has a passing result. Later evidence belongs to a linked successor change.", 409);
    if (!l.requests.some((r) => r.handover.purpose === "Implementation" && r.handover.state === "Accepted")) throw refuse("NotImplemented", "No receiver has accepted implementation work yet, so there is no changed configuration to test.", 409);
    const procedure = sources.find((s) => s.id === v.retest.procedure_source_id);
    // The criterion and procedure come from the approved technical basis. Without them no result can be recorded at all.
    if (!procedure || procedure.use !== "Current") throw blocked("TestBasisNeeded", [procedure ? `${procedure.reference} revision ${procedure.revision} is ${procedure.use.toLowerCase()}; a result needs a current approved procedure.` : "Test basis needed: no approved test procedure is linked to this obligation."]);
    if (command.result === "Passed" && command.configuration_present.trim() !== v.retest.configuration.trim()) throw blocked("ConfigurationMismatch", [`A pass binds to the exact configuration under test. The obligation names “${v.retest.configuration}”; the evidence names “${command.configuration_present}”.`]);
    if (command.evidence_source_id && sources.find((s) => s.id === command.evidence_source_id)?.kind !== "TestEvidence") throw invalidField("evidence_source_id", "Choose test evidence retained for this package.");
    if (command.corrective_owner_id) await eligiblePerson(c, p, access, command.corrective_owner_id, "corrective_owner_id", "edit");
    await c.query(`INSERT INTO ppo.change_retest_attempts(id,workspace_id,company_id,change_id,retest_id,attempt_number,result,tested_at,configuration_present,evidence_reference,evidence_source_id,result_source,note,corrective_action,corrective_owner_id,corrective_due,procedure_source_id,recorded_by,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SyntheticInspectionFixture',$12,$13,$14,$15,$16,$17,$18)`,
      [command.id, p.workspace_id, access.pkg.company_id, l.row.id, v.retest.id, v.attempts.length + 1, command.result, command.tested_at, command.configuration_present, command.evidence_reference, command.evidence_source_id, command.note,
        command.corrective_action, command.corrective_owner_id, command.corrective_due, procedure.id, p.actor_id, command.operation_id]);
    const saved = await touch(c, p, l.row.id);
    await record(c, p, access, command, { change_id: l.row.id, subject_type: "RetestAttempt", subject_id: command.id, event_type: `Retest${command.result}`, note: command.note });
    return saved;
  }, "EngineeringChange", command.action === "close" ? "ChangeClosed" : command.action === "attempt" ? "ChangeVerificationRecorded" : "ChangeRecordSaved");
}

// Original-operation recovery rechecks present access, by the same duty the command needed, before any receipt is disclosed.
export async function changeReceiptAuthority(c: QueryClient, p: Principal, recordId: string, commandName: string) {
  const owner = (await c.query<{ package_id: string }>("SELECT package_id FROM ppo.engineering_changes WHERE workspace_id=$1 AND id=$2", [p.workspace_id, recordId])).rows[0];
  if (!owner) throw unavailable();
  const access = await changesAccess(c, p, owner.package_id), [family, action] = commandName.split(":");
  const duty: Duty | null = family === "ChangeReview" ? (action === "respond" ? "review" : "decide") : family === "ChangePrerequisite" ? "commercial"
    : family === "ChangeHandover" ? (action === "decide" || action === "acknowledge" ? "receive" : "edit") : family === "ChangeVerification" ? (action === "close" ? "close" : action === "attempt" ? "verify" : null)
    : family === "ChangeRevision" && action === "check" ? null : "edit";
  if (duty ? !access.can[duty] : !(["edit", "review", "decide", "verify", "commercial"] as Duty[]).some((d) => access.can[d])) throw unavailable();
}
export { documentOf };
