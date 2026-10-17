import { randomUUID } from "node:crypto";
import type { Principal } from "../../src/platform/identity";
import {
  createWorkOrder,
  saveWorkScope,
  readWorkOrder,
  assessWorkReadiness,
  authoriseWorkOrder,
  proposeVisit,
} from "../../src/service/work-orders";
import {
  recordContact,
  readAppointment,
  confirmAppointment,
} from "../../src/scheduling/planner";
import {
  createPack,
  checkPack,
  requestIssue,
  readPack,
} from "../../src/documents/packs";
import { processRenderJob } from "../../src/documents/worker";
import { base, principal, id, content } from "./packs";

// Field readiness gate (PPO-SVC-FIELD-READINESS-GATE-PROP). A visit on a newly saved scope binds
// SYN-PPO-P04 v2, whose Dispatch-stage PartsReadiness criterion is derived from Supply Chain.
export const gateEvidence = {
  title: "SYN field readiness gate authority",
  content_text:
    "SYN limited non-intervention replacement preparation. No financial approval.",
  source_reference: "SYN-PPO-FIELD-READINESS-GATE",
  source_version: "1",
};
// The preparer's statement that the visit needs no parts (R1). Dispatch on a v2 visit otherwise
// waits for Supply Chain readiness of linked demands or a permitted exception.
export async function noPartsNeeded(
  p: Principal,
  workOrderId: string,
  appointmentId: string,
  outcome: "NotApplicable" | "PermittedException" = "NotApplicable",
) {
  const w = (await readWorkOrder(p, workOrderId)).items[0],
    a = (await readAppointment(p, appointmentId)).items[0];
  if (
    !a.readiness?.some(
      (x: { criterion_code: string }) => x.criterion_code === "PartsReadiness",
    )
  )
    return null;
  return assessWorkReadiness(p, workOrderId, {
    ...base(),
    expected_version: w.version,
    assessment: {
      scope_revision_id: a.scope_revision_id,
      scope_version: a.scope_version,
      appointment_id: appointmentId,
      criterion_code: "PartsReadiness",
      outcome,
      reason:
        outcome === "NotApplicable"
          ? "SYN no parts needed for this visit: inspection only"
          : "SYN urgent work: motor missing, accepted by the service owner on condition of a follow-up visit",
      evidence: gateEvidence,
      source_as_at: new Date(Date.now() - 60000).toISOString(),
    },
  });
}
// A single-task visit on a new v2 scope, confirmed with two crew and its pack issued.
export async function v2Issued(start = "2031-12-05T00:00:00Z") {
  const co = await principal(),
    wid = randomUUID(),
    aid = randomUUID(),
    pid = randomUUID();
  await createWorkOrder(co, {
    ...base(),
    id: wid,
    company_id: id("20"),
    site_id: id("70"),
    customer_id: id("50"),
    service_owner_id: co.actor_id,
    tickets: [
      {
        ticket_id: id("40", 20),
        issue_disposition: "SYN shade screen drive motor needs replacing",
      },
    ],
  });
  let w = (await readWorkOrder(co, wid)).items[0];
  await saveWorkScope(co, wid, {
    ...base(),
    expected_version: w.version,
    scope: {
      summary: "SYN inspect the shade screen drive before replacement",
      exclusions: "No shutdown, energised access or extra work.",
      diagnostic_limit: "External observation only.",
      pending_account_plan:
        "SYN service owner resolves account questions; Finance independent.",
      authority_evidence: gateEvidence,
      coverage: {
        status: "Disputed",
        agreement_reference: null,
        source_version: null,
        effective_from: null,
        effective_to: null,
        assessment: "SYN coverage remains unresolved",
        reason: "SYN no verified agreement",
        charging_route: "FinanceReview",
      },
      items: [
        {
          task_kind: "Inspection",
          task_description: "SYN inspect the shade screen drive nameplate",
          expected_outcome: "Record the drive model",
          completion_requirements: ["Record findings"],
          required_skill_codes: ["SYN-VISUAL"],
          shutdown_condition: null,
          access_condition: null,
          assets: [
            {
              asset_id: id("80"),
              configuration_id: null,
              identification_plan: null,
            },
          ],
        },
      ],
    },
  });
  w = (await readWorkOrder(co, wid)).items[0];
  const scope = w.scopes.find((s) => s.id === w.scope_revision_id)!;
  for (const criterion_code of [
    "SiteAccess",
    "SiteControls",
    "CompetencyPlan",
    "MandatoryIsolation",
    "ShutdownAuthority",
  ]) {
    w = (await readWorkOrder(co, wid)).items[0];
    await assessWorkReadiness(co, wid, {
      ...base(),
      expected_version: w.version,
      assessment: {
        scope_revision_id: scope.id,
        scope_version: scope.version,
        criterion_code,
        outcome: ["MandatoryIsolation", "ShutdownAuthority"].includes(
          criterion_code,
        )
          ? "NotApplicable"
          : "Pass",
        reason: "SYN reviewed exact external non-intervention scope",
        evidence: gateEvidence,
        source_as_at: "2026-09-05T00:00:00Z",
      },
    });
  }
  w = (await readWorkOrder(co, wid)).items[0];
  await authoriseWorkOrder(co, wid, {
    ...base(),
    expected_version: w.version,
    scope_revision_id: scope.id,
    scope_version: scope.version,
    policy_version_id: scope.policy_version_id,
  });
  w = (await readWorkOrder(co, wid)).items[0];
  await proposeVisit(co, wid, {
    ...base(),
    id: aid,
    expected_version: w.version,
    scope_revision_id: scope.id,
    scope_version: scope.version,
    start_at: start,
    end_at: new Date(Date.parse(start) + 2 * 3600000).toISOString(),
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  w = (await readWorkOrder(co, wid)).items[0];
  await assessWorkReadiness(co, wid, {
    ...base(),
    expected_version: w.version,
    assessment: {
      scope_revision_id: scope.id,
      scope_version: scope.version,
      appointment_id: aid,
      criterion_code: "ToolPreparation",
      outcome: "Pass",
      reason: "SYN reviewed fictional visual inspection kit",
      evidence: gateEvidence,
      source_as_at: "2026-09-05T00:00:00Z",
    },
  });
  let a = (await readAppointment(co, aid)).items[0];
  await recordContact(co, aid, {
    ...base(),
    id: randomUUID(),
    expected_version: a.version,
    recipient_id: id("60"),
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
    notes: "SYN manually recorded customer date agreement",
  });
  a = (await readAppointment(co, aid)).items[0];
  await confirmAppointment(co, aid, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: scope.id,
    scope_version: scope.version,
    policy_version_id: scope.policy_version_id,
    scheduling_policy_id: id("a0"),
    scheduling_policy_version: 1,
    scheduling_policy_hash:
      "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
    publication_head_version: 1,
    selected_policy: {
      id: "a0000000-0000-4000-8000-000000000001",
      version: 1,
      content_hash:
        "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
    },
    crew: [9, 2].map((n, i) => ({
      resource_id: id("a4", n),
      resource_version: 1,
      calendar_version: 1,
      crew_role: i ? "Technician" : "Lead",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason: "SYN explicitly zero same-site allowance",
    })),
  });
  a = (await readAppointment(co, aid)).items[0];
  await createPack(co, {
    ...base(),
    id: pid,
    appointment_id: aid,
    expected_appointment_version: a.version,
    content: content(),
  });
  let pack = (await readPack(co, pid)).items[0];
  await checkPack(co, pid, {
    ...base(),
    expected_version: pack.version,
    decision: "Checked",
  });
  pack = (await readPack(co, pid)).items[0];
  await requestIssue(co, pid, { ...base(), expected_version: pack.version });
  pack = (await readPack(co, pid)).items[0];
  await processRenderJob(pack.jobs[0].id);
  pack = (await readPack(co, pid)).items[0];
  return { co, wid, aid, pid, pack, scope };
}
// The exact-recipient fields an acknowledgement or a return carries.
export function recipientFields(
  pack: {
    readiness: {
      recipients: {
        user_id: string;
        assignment_id: string;
        assignment_version: number;
      }[];
    };
    issues: { output_hash: string }[];
  },
  p: Principal,
) {
  const r = pack.readiness.recipients.find((x) => x.user_id === p.actor_id)!;
  return {
    ...base(),
    assignment_id: r.assignment_id,
    assignment_version: r.assignment_version,
    presented_hash: pack.issues[0].output_hash,
    captured_at: new Date().toISOString(),
  };
}
