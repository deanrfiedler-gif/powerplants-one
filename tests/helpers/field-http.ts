import { siteContactInput } from "./site-readiness";
import { randomUUID } from "node:crypto";
import { base, id, content } from "./packs";
export async function prepareFieldAppointment(
  call: (
    path: string,
    body?: unknown,
  ) => Promise<Awaited<ReturnType<Response["json"]>>>,
  day: string,
  source = {
    work_order_id: id("a9"),
    scope_revision_id: id("aa"),
    scope_version: 1,
  },
  crew = [id("a4", 9), id("a4", 2)],
) {
  const order = (await call(`service/work-orders/${source.work_order_id}`)).items[0],
    aid = crypto.randomUUID();
  await call(`service/work-orders/${order.id}/visits`, {
    ...base(),
    id: aid,
    expected_version: order.version,
    scope_revision_id: source.scope_revision_id,
    scope_version: source.scope_version,
    start_at: day + "T00:00:00Z",
    end_at: day + "T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  let a = (await call(`appointments/${aid}`)).items[0];
  await call(`service/work-orders/${order.id}/readiness`, {
    ...base(),
    expected_version: a.work_order_version,
    assessment: {
      scope_revision_id: source.scope_revision_id,
      scope_version: source.scope_version,
      appointment_id: aid,
      criterion_code: "ToolPreparation",
      outcome: "Pass",
      reason: "SYN reviewed kit and collection",
      source_as_at: "2026-09-05T00:00:00Z",
      evidence: {
        title: "SYN P06 preparation",
        content_text: "SYN collection reviewed; visual inspection only.",
        source_reference: "SYN-PPO-P06-BROWSER",
        source_version: "1",
      },
    },
  });
  // A visit on a new scope binds SYN-PPO-P04 v2 or later: record the preparer's "No parts needed" statement
  // (field readiness gate R1), or dispatch waits on Parts. Seeded visits keep v1 and skip this.
  a = (await call(`appointments/${aid}`)).items[0];
  if (a.readiness?.some((x: { criterion_code: string }) => x.criterion_code === "PartsReadiness"))
    await call(`service/work-orders/${order.id}/readiness`, {
      ...base(),
      expected_version: a.work_order_version,
      assessment: {
        scope_revision_id: source.scope_revision_id,
        scope_version: source.scope_version,
        appointment_id: aid,
        criterion_code: "PartsReadiness",
        outcome: "NotApplicable",
        reason: "SYN no parts needed for this visit: inspection only",
        source_as_at: "2026-09-05T00:00:00Z",
        evidence: {
          title: "SYN no parts needed",
          content_text: "SYN visual inspection only; no parts are fitted.",
          source_reference: "SYN-PPO-FIELD-READINESS-GATE",
          source_version: "1",
        },
      },
    });
  await call(`appointments/${aid}/contacts`, {
    ...base(),
    id: crypto.randomUUID(),
    expected_version: a.version,
    recipient_id: id("60"),
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
    notes: "SYN manually recorded date agreement; no pack response.",
  });
  a = (await call(`appointments/${aid}`)).items[0];
  await call(`appointments/${aid}/confirm`, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: id("a0"),
    scheduling_policy_version: 1, scheduling_policy_hash: "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44", publication_head_version: 1, selected_policy: {id: "a0000000-0000-4000-8000-000000000001", version: 1, content_hash: "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44"},
    crew: crew.map((resource_id, i) => ({
      resource_id,
      resource_version: 1,
      calendar_version: 1,
      crew_role: i ? "Technician" : "Lead",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason:
        "SYN explicit zero travel allowance at the same fictional site",
    })),
  });
  a = (await call(`appointments/${aid}`)).items[0];
  if (a.preparation)
    await call(`appointments/${aid}/contacts`, siteContactInput(a.version));
  const appointment = (await call(`appointments/${aid}`)).items[0],
    pid = randomUUID();
  await call("packs", {
    ...base(),
    id: pid,
    appointment_id: aid,
    expected_appointment_version: appointment.version,
    content: content(),
  });
  let pack = (await call(`packs/${pid}`)).items[0];
  await call(`packs/${pid}/check`, {
    ...base(),
    expected_version: pack.version,
    decision: "Checked",
  });
  pack = (await call(`packs/${pid}`)).items[0];
  await call(`packs/${pid}/issue`, {
    ...base(),
    expected_version: pack.version,
  });
  pack = (await call(`packs/${pid}`)).items[0];
  await call(`render-jobs/${pack.jobs[0].id}/retry`, {});
  return { appointment_id: aid, pack: (await call(`packs/${pid}`)).items[0] };
}
