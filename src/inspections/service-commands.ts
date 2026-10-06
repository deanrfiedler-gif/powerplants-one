import { randomUUID } from "node:crypto";
import { incidentHolds } from "../incidents/holds";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { unavailable } from "../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  optionalId,
  narrative,
  label,
} from "../shared/validation";
import { parseInspectionCommand } from "../engineering/commissioning/validation";
import {
  prepareBundle,
  readBundle as readOutputBundle,
} from "../engineering/commissioning/outputs";
import { readBundle as readPackBundle } from "../documents/worker";
import { escapeHtml } from "../documents/render";
import {
  evidenceBytes,
  openAttempt,
  saveAttempt,
  submitAttempt,
  addEvidence,
  removeEvidence,
  reviewAttempt,
  updateDefect,
} from "./service";
import { isRequired, criterionText, readingProblems } from "./model";
import {
  hash,
  serviceHost,
  serviceInspectionAccess,
  requireCapture,
  serviceBinding,
  boundChecks,
  templates,
  loadServiceInspections,
  stop,
  type Mode,
} from "./service-context";

function parse(input: unknown, id: string) {
  const initial = object(input, [
    ...commonKeys,
    "action",
    "id",
    "template_id",
    "scope_item_id",
    "asset_id",
    "predecessor_id",
    "binding_hash",
    "attempt_id",
    "expected_version",
    "configuration_reference",
    "configuration_source_id",
    "occurred_at",
    "timezone",
    "clock_concern",
    "prerequisites",
    "findings",
    "readings",
    "instrument_ids",
    "evidence",
    "evidence_id",
    "decision",
    "decision_reason",
    "owner_id",
    "due",
    "severity",
    "defect_id",
    "proposed_correction",
    "retest_required",
    "changes_system",
    "change_id",
    "note",
  ]);
  if (initial.action === "open") {
    object(input, [
      ...commonKeys,
      "action",
      "id",
      "template_id",
      "scope_item_id",
      "asset_id",
      "predecessor_id",
      "binding_hash",
    ]);
    return {
      ...common(initial),
      action: "open" as const,
      id: uuid(initial.id, "id"),
      template_id: uuid(initial.template_id, "template_id"),
      scope_item_id: uuid(initial.scope_item_id, "scope_item_id"),
      asset_id: uuid(initial.asset_id, "asset_id"),
      predecessor_id: optionalId(initial.predecessor_id, "predecessor_id"),
      binding_hash: label(initial.binding_hash, "binding_hash", 64),
    };
  }
  if (initial.action === "release") {
    object(input, [
      ...commonKeys,
      "action",
      "id",
      "attempt_id",
      "decision_reason",
    ]);
    return {
      ...common(initial),
      action: "release" as const,
      id: uuid(initial.id, "id"),
      attempt_id: uuid(initial.attempt_id, "attempt_id"),
      decision_reason: narrative(
        initial.decision_reason,
        "decision_reason",
        2000,
      ),
    };
  }
  // Shared parser owns raw readings, precision, evidence size/type and review commands.
  const parsed = parseInspectionCommand({ ...initial, record_id: id });
  if (parsed.action === "open") throw unavailable();
  return parsed;
}
export async function inspectionCommand(
  p: Principal,
  id: string,
  input: unknown,
  mode: Mode,
) {
  id = uuid(id, "appointment_id");
  const cmd = parse(input, id),
    h = serviceHost(id);
  const reviewer = ["review", "release", "defect"].includes(cmd.action);
  if ((mode === "review") !== reviewer) throw unavailable();
  const original = { ...cmd, appointment_id: id };
  return sharedOperation(
    p,
    original,
    `ServiceInspection:${cmd.action}`,
    (c) => serviceInspectionAccess(c, p, id, mode, cmd.action),
    async (c, ctx) => {
      const view = await loadServiceInspections(c, p, id, mode);
      const result = (state: string, version = ctx.a.version) => ({
        id,
        version,
        state,
        updated_at: new Date(),
      });
      const remember = async (details: unknown) => {
        await c.query(
          "INSERT INTO ppo.service_inspection_events(id,workspace_id,appointment_id,actor_id,action,details,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            randomUUID(),
            p.workspace_id,
            id,
            p.actor_id,
            cmd.action,
            JSON.stringify(details),
            cmd.operation_id,
          ],
        );
      };
      if (cmd.action === "open") {
        await requireCapture(c, p, id);
        const t = view.catalogue.find((x) => x.id === cmd.template_id);
        if (!t) throw unavailable();
        const b = await serviceBinding(
          c,
          p,
          id,
          t,
          cmd.scope_item_id,
          cmd.asset_id,
        );
        if (b.binding_hash !== cmd.binding_hash)
          stop(
            "SourceChanged",
            "The selected preparation changed. Inspect the current sources before opening a draft.",
          );
        if (b.blockers.length) stop("InspectionHeld", b.blockers.join(" "));
        const plan = boundChecks(t, cmd.scope_item_id, cmd.asset_id);
        if (cmd.predecessor_id) {
          const old = view.attempts.find(
            (x) => x.row.id === cmd.predecessor_id,
          );
          if (
            !old ||
            old.row.state !== "Submitted" ||
            old.binding.scope_item_id !== cmd.scope_item_id ||
            old.binding.asset_id !== cmd.asset_id ||
            old.row.plan.some((d) => !plan.some((n) => n.key === d.key))
          )
            stop(
              "WrongRetest",
              "A retest must follow the same submitted procedure and equipment occurrence.",
            );
        }
        await openAttempt(c, p, {
          id: cmd.id,
          host: { ...h, company_id: ctx.a.company_id, site_id: ctx.a.site_id },
          plan_source: {
            type: "ServiceTemplate",
            id: t.id,
            reference: `${t.source_reference} version ${t.revision}`,
            hash: hash(t),
            slot: b.binding_hash,
          },
          plan,
          scope_keys: [cmd.scope_item_id],
          check_keys: plan.map((d) => d.key),
          predecessor_id: cmd.predecessor_id,
          performer_id: p.actor_id,
          prerequisites: [],
          timezone: ctx.a.site_timezone,
        });
        await c.query(
          "INSERT INTO ppo.service_inspection_bindings(attempt_id,workspace_id,company_id,appointment_id,template_id,scope_item_id,asset_id,snapshot,binding_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            cmd.id,
            p.workspace_id,
            ctx.a.company_id,
            id,
            t.id,
            cmd.scope_item_id,
            cmd.asset_id,
            JSON.stringify(b.snapshot),
            b.binding_hash,
          ],
        );
        await remember({
          attempt_id: cmd.id,
          predecessor_id: cmd.predecessor_id,
          binding_hash: b.binding_hash,
        });
        return result("Draft", 1);
      }
      if (cmd.action === "correct" || cmd.action === "defect") {
        const d = view.defects.find((x) => x.id === cmd.defect_id);
        if (!d) throw unavailable();
        if (cmd.action === "correct") {
          await requireCapture(c, p, id);
          if (d.owner_id !== p.actor_id)
            stop(
              "CorrectionOwner",
              "Only the current named defect owner records the correction.",
            );
          await updateDefect(c, p, h, d.id, cmd.expected_version, {
            kind: "correct",
            note: cmd.note,
          });
        } else {
          if (cmd.owner_id !== d.owner_id || cmd.due !== d.due)
            stop(
              "OwnershipHandoverUnavailable",
              "This increment retains the original corrective owner and due date. Coordinated reassignment with the owning Activity is not available here.",
            );
          if (!cmd.retest_required)
            stop(
              "RetestRequired",
              "Service inspection defects require a fresh linked retest and independent acceptance.",
            );
          await serviceInspectionAccess(
            c,
            { ...p, actor_id: cmd.owner_id },
            id,
            "capture",
            "save",
          );
          if (cmd.changes_system)
            stop(
              "EngineeringActionRequired",
              "System-changing corrections require the owning Engineering workflow. This Service inspection cannot authorise that work.",
            );
          await updateDefect(c, p, h, d.id, cmd.expected_version, {
            kind: "coordinate",
            update: cmd,
          });
        }
        await remember(cmd);
        return result(
          cmd.action === "correct" ? "CorrectionRecorded" : d.state,
          d.version + 1,
        );
      }
      const at = view.attempts.find((x) => x.row.id === cmd.attempt_id);
      if (!at) throw unavailable();
      if (!reviewer && at.row.performer_id !== p.actor_id) throw unavailable();
      if (
        !["review", "clarify"].includes(cmd.action) &&
        at.applicability !== "Current"
      )
        stop("ReassessmentRequired", at.applicability_reasons.join(" "));
      const verifyEvidence = async () => {
        for (const e of at.evidence) {
          if (e.state !== "Complete" || e.kind !== "StoredFile")
            stop(
              "EvidenceIncomplete",
              "Every attached item must have readable verified retained bytes.",
            );
          await evidenceBytes(p, e);
        }
        const pack = (
          await c.query(
            "SELECT i.* FROM ppo.pack_issues i JOIN ppo.packs k ON k.workspace_id=i.workspace_id AND k.current_issue_id=i.id WHERE k.workspace_id=$1 AND k.appointment_id=$2",
            [p.workspace_id, id],
          )
        ).rows[0];
        if (!pack)
          stop(
            "ExactDocumentUnavailable",
            "The exact issued pack is unavailable.",
          );
        await readPackBundle(p, pack.manifest);
      };
      if (cmd.action === "save") {
        const attendance = await requireCapture(c, p, id);
        if (
          cmd.occurred_at &&
          new Date(cmd.occurred_at) <
            new Date(attendance.started_at ?? attendance.captured_at)
        )
          stop(
            "InvalidTestTime",
            "Test time must be within your actual attendance.",
          );
        if (
          cmd.occurred_at &&
          new Date(cmd.occurred_at).getTime() > Date.now() + 300000
        )
          stop(
            "InvalidTestTime",
            "A future test time cannot establish performed evidence. Check the device clock and actual test time.",
          );
        for (const r of cmd.readings) {
          const d = at.row.plan.find((x) => x.key === r.check_key);
          if (!d) throw unavailable();
          const problems = readingProblems(d, r);
          if (problems.length) stop("InvalidReading", problems.join(" "));
          if (
            r.state === "Recorded" &&
            d.numeric &&
            r.unit !== d.numeric.unit &&
            !d.numeric.conversions.some((x) => x.from_unit === r.unit)
          )
            stop(
              "InvalidUnit",
              "That unit has no approved conversion in this exact template.",
            );
        }
        if (cmd.configuration_source_id || cmd.prerequisites.length)
          stop(
            "ServerOwnedBasis",
            "Configuration and readiness prerequisites come from the exact Service binding.",
          );
        const b = await serviceBinding(
          c,
          p,
          id,
          view.catalogue.find((t) => t.id === at.binding.template_id)!,
          at.binding.scope_item_id,
          at.binding.asset_id,
        );
        const saved = await saveAttempt(
          c,
          p,
          h,
          at.row.id,
          cmd.expected_version,
          {
            ...cmd,
            configuration_reference: b.configuration_reference,
            configuration_source_id: null,
            timezone: b.timezone,
            prerequisites: [],
          },
        );
        await remember({
          attempt_id: at.row.id,
          version: saved.version,
          hash: saved.content_hash,
        });
        return result("Draft", saved.version);
      }
      if (cmd.action === "evidence" || cmd.action === "remove_evidence") {
        await requireCapture(c, p, id);
        if (cmd.action === "evidence" && cmd.evidence.kind !== "StoredFile")
          stop(
            "EvidenceTypeUnsupported",
            "Service inspections accept verified PNG or plain-text originals. Upstream source and field-entry linking are unavailable here.",
          );
        const saved =
          cmd.action === "evidence"
            ? (
                await addEvidence(
                  c,
                  p,
                  h,
                  at.row.id,
                  cmd.expected_version,
                  cmd.evidence,
                  cmd.operation_id,
                )
              ).at
            : await removeEvidence(
                c,
                p,
                h,
                at.row.id,
                cmd.expected_version,
                cmd.evidence_id,
              );
        await remember({
          attempt_id: at.row.id,
          version: saved.version,
          action: cmd.action,
        });
        return result("Draft", saved.version);
      }
      if (cmd.action === "submit") {
        await requireCapture(c, p, id);
        await verifyEvidence();
        for (const d of at.row.plan) {
          if (
            d.instrument_basis &&
            at.results.find((r) => r.check_key === d.key)?.entry_state ===
              "Recorded" &&
            !at.instruments.some(
              (i) =>
                i.snapshot.measurement_type ===
                  d.instrument_basis!.measurement_type &&
                i.snapshot.measurement_unit === d.instrument_basis!.unit &&
                i.snapshot.measurement_range === d.instrument_basis!.range &&
                i.snapshot.certificate_reference &&
                i.snapshot.certificate_revision,
            )
          )
            stop(
              "InstrumentBasisUnavailable",
              "The retained instrument must establish the exact measurement type, unit, range and certificate required by this synthetic procedure.",
            );
        }
        // Recheck after reading external retained bytes; no cached read grants capture.
        await serviceInspectionAccess(c, p, id, "capture", "submit");
        await requireCapture(c, p, id);
        const owner = cmd.owner_id ?? p.actor_id;
        await serviceInspectionAccess(
          c,
          { ...p, actor_id: owner },
          id,
          "capture",
          "save",
        );
        const submitted = await submitAttempt(
          c,
          p,
          h,
          at.row.id,
          cmd.expected_version,
          cmd.operation_id,
          new Date().toISOString().slice(0, 10),
          {
            owner_id: owner,
            due:
              cmd.due ??
              new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            severity: cmd.severity,
            company_id: ctx.a.company_id,
            site_id: ctx.a.site_id,
            host_reference: ctx.a.display_number,
          },
        );
        await remember({
          attempt_id: at.row.id,
          submitted_hash: submitted.attempt.submitted_hash,
          defects: submitted.defects,
        });
        return result("Submitted", submitted.attempt.version);
      }
      if (cmd.action === "review" || cmd.action === "clarify") {
        if (cmd.action === "review" && cmd.owner_id)
          await serviceInspectionAccess(
            c,
            { ...p, actor_id: cmd.owner_id },
            id,
            "capture",
          );
        if (cmd.action === "review" && cmd.decision === "Accepted") {
          if (at.applicability !== "Current")
            stop("ReassessmentRequired", at.applicability_reasons.join(" "));
          await verifyEvidence();
          for (const d of at.row.plan.filter(isRequired)) {
            const r = at.results.find((x) => x.check_key === d.key);
            if (r?.evaluation !== "Pass" || d.condition?.outcome === "Unknown")
              stop(
                "AcceptanceIncomplete",
                "Acceptance requires each required check to pass against known applicability and criteria. Return, clarify or hold incomplete evidence.",
              );
          }
          for (const d of view.defects.filter(
            (d) =>
              d.state !== "Closed" && at.row.check_keys.includes(d.check_key),
          )) {
            if (
              d.state !== "CorrectionRecorded" ||
              !at.row.predecessor_id ||
              !at.row.occurred_at ||
              !d.correction_at ||
              new Date(d.correction_at) > new Date(at.row.occurred_at) ||
              !view.links.some(
                (l) =>
                  l.defect_id === d.id &&
                  l.attempt_id === at.row.predecessor_id,
              )
            )
              stop(
                "CorrectionRetestRequired",
                "Record the owned correction and perform a fresh linked retest before accepting this defect's evidence.",
              );
          }
        }
        const reviewed = await reviewAttempt(c, p, h, at.row.id, {
          id: cmd.id,
          decision:
            cmd.action === "clarify" ? "ClarificationProvided" : cmd.decision,
          reason: cmd.decision_reason,
          owner_id: cmd.action === "review" ? cmd.owner_id : null,
          due: cmd.action === "review" ? cmd.due : null,
          policy: { contract: "Service inspections v1", audience: "Internal" },
          independence_required: true,
          applicability: {
            state: at.applicability,
            binding_hash: at.binding.binding_hash,
          },
          operation_id: cmd.operation_id,
        });
        await remember({
          attempt_id: at.row.id,
          review_id: cmd.id,
          closed: reviewed.closed,
        });
        return result(
          cmd.action === "clarify" ? "InReview" : cmd.decision,
          at.row.version,
        );
      }
      if (cmd.action !== "release") throw unavailable();
      if ((await incidentHolds(c,p,id,at.binding)).length)
        stop("IncidentHold", "This exact inspection scope has an independent incident hold. Passing evidence does not clear it.");
      if (at.review !== "Accepted" || at.row.performer_id === p.actor_id)
        stop(
          "IndependentAcceptanceRequired",
          "Release needs the exact independently accepted attempt.",
        );
      await verifyEvidence();
      const open = view.defects.filter(
        (d) => d.state !== "Closed" && at.row.check_keys.includes(d.check_key),
      );
      if (open.length)
        stop(
          "OpenDefects",
          "Resolve the correctly linked defects before releasing this inspection scope.",
        );
      const review = at.reviews.at(-1)!;
      const existing = view.outputs.find(
        (o) => o.attempt_id === at.row.id && o.review_id === review.id,
      );
      if (existing) {
        await readOutputBundle(
          p,
          existing.bundle as unknown as Parameters<typeof readOutputBundle>[1],
        );
        return result("Issued", at.row.version);
      }
      const manifest = {
        synthetic: true,
        scope: "One Service procedure and equipment occurrence",
        audience: "Internal",
        attempt_id: at.row.id,
        review_id: review.id,
        reviewed_hash: at.row.submitted_hash,
        decision_reason: cmd.decision_reason,
        binding: at.binding,
        attempts: view.attempts.filter(
          (x) =>
            x.binding.asset_id === at.binding.asset_id &&
            x.binding.scope_item_id === at.binding.scope_item_id &&
            x.row.plan.some((d) => at.row.check_keys.includes(d.key)),
        ),
        defects: view.defects.filter((d) =>
          at.row.check_keys.includes(d.check_key),
        ),
        corrections: view.events.filter(
          (e) => e.action === "correct" && view.defects.some(
            (d) => d.id === e.details.defect_id && at.row.check_keys.includes(d.check_key),
          ),
        ),
        remaining_work: view.defects.filter((d) => d.state !== "Closed"),
        exclusions: [
          "Other procedures and equipment",
          "Appointment and work-order completion",
          "Project/customer acceptance",
          "Finance",
          "Other incident scopes; this inspection never closes an incident",
        ],
        handover: {
          owned_corrective_work: "Existing Activity records",
          service_report:
            "Open Service Review; inspection does not submit or issue a Service report",
        },
      };
      const manifest_hash = hash(manifest);
      const bundle = await prepareBundle(p, {
        output_id: cmd.id,
        kind: "OUT-12",
        audience: "Internal",
        manifest_hash,
        template_version: "Service inspection internal v1",
        head: "Powerplants One · Service inspection",
        foot: ctx.a.display_number,
        html: (output) =>
          `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reviewed Service inspection</title><style>body{font:16px/1.5 Verdana,sans-serif;margin:24px;color:#242a37}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}h2{margin-top:28px}table{border-collapse:collapse;width:100%}td,th{text-align:left;border:1px solid #ccc;padding:8px;overflow-wrap:anywhere}</style><h1>Reviewed Service inspection</h1><p>Synthetic · fictional engineering limits · Internal audience</p><p>${escapeHtml(ctx.a.display_number)} · output ${escapeHtml(output.id)} · prepared ${escapeHtml(output.prepared_at)}</p><p>${escapeHtml(cmd.decision_reason)}</p><h2>Exact checks</h2><table><tr><th>Check</th><th>Criterion</th><th>Raw result</th><th>Evaluation</th></tr>${at.row.plan
            .map((d) => {
              const r = at.results.find((x) => x.check_key === d.key);
              return `<tr><td>${escapeHtml(d.name)}</td><td>${escapeHtml(criterionText(d))}</td><td>${escapeHtml(r?.choice ?? `${r?.raw_value ?? ""} ${r?.unit ?? ""}`)}</td><td>${escapeHtml(r?.evaluation ?? "Not tested")}</td></tr>`;
            })
            .join(
              "",
            )}</table><h2>Scope, original failures, corrections, evidence and exact review</h2><pre>${escapeHtml(JSON.stringify(manifest, null, 2))}</pre><p>Retained output. Current applicability must be checked in Powerplants One. This output completes no other domain.</p></html>`,
      });
      // Rendering can be slow: recheck current authority before committing the output.
      await serviceInspectionAccess(c, p, id, "review", "release");
      if ((await incidentHolds(c,p,id,at.binding)).length)
        stop("IncidentHold", "The incident restriction must be resolved before scoped release.");
      const refreshed = (
        await loadServiceInspections(c, p, id, "review")
      ).attempts.find((x) => x.row.id === at.row.id);
      if (!refreshed || refreshed.applicability !== "Current")
        stop(
          "ReassessmentRequired",
          "The inspection basis changed while preparing this output. Retained evidence remains available; reassess before release.",
        );
      await c.query(
        "INSERT INTO ppo.service_inspection_outputs(id,workspace_id,company_id,appointment_id,attempt_id,review_id,audience,manifest,manifest_hash,bundle,issued_by) VALUES($1,$2,$3,$4,$5,$6,'Internal',$7,$8,$9,$10)",
        [
          cmd.id,
          p.workspace_id,
          ctx.a.company_id,
          id,
          at.row.id,
          review.id,
          JSON.stringify(manifest),
          manifest_hash,
          JSON.stringify(bundle),
          p.actor_id,
        ],
      );
      await remember({
        output_id: cmd.id,
        attempt_id: at.row.id,
        review_id: review.id,
        manifest_hash,
      });
      return result("Issued", at.row.version);
    },
    "Appointment",
    cmd.action === "submit" ? "InspectionSubmitted" : "InspectionReviewed",
  );
}
export async function previewServiceInspection(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  object(query, ["template_id", "scope_item_id", "asset_id"]);
  return transaction(async (c) => {
    const ctx = await serviceInspectionAccess(c, p, id, "capture");
    const t = (await templates(c, p, ctx.a.company_id)).find(
      (x) => x.id === uuid(query.template_id, "template_id"),
    );
    if (!t) throw unavailable();
    return {
      ...(await serviceBinding(
        c,
        p,
        id,
        t,
        uuid(query.scope_item_id, "scope_item_id"),
        uuid(query.asset_id, "asset_id"),
      )),
      checks: boundChecks(t, query.scope_item_id, query.asset_id),
    };
  });
}
export async function serviceInspectionReceiptAuthority(
  c: Parameters<typeof serviceInspectionAccess>[0],
  p: Principal,
  id: string,
  command: string,
) {
  const action = command.slice("ServiceInspection:".length);
  return serviceInspectionAccess(
    c,
    p,
    id,
    ["review", "release", "defect"].includes(action) ? "review" : "capture",
    action,
  );
}
