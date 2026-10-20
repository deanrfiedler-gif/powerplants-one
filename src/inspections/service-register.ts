import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { loadInspections } from "./service";
import type { ReviewState } from "./model";

export type InspectionVisit = {
  id: string;
  reference: string;
  work_order: string;
  status: string;
  site_id: string;
  site: string;
  start_at: Date;
};
export type InspectionRegisterRow = InspectionVisit & {
  attempt_id: string | null;
  procedure: string;
  procedure_reference: string;
  attempt_number: number | null;
  predecessor_number: number | null;
  performer: string;
  performer_id: string | null;
  submitted_at: Date | null;
  review: ReviewState;
  state: "Draft" | "Submitted" | "NotStarted";
  result: string;
  failed: number;
  defects: number;
  retest_due: boolean;
  issued: boolean;
  equipment: string;
};
// Caller has checked every visit through Service authority. All joins stay within that permitted set.
export async function inspectionRegister(
  c: QueryClient,
  p: Principal,
  visits: InspectionVisit[],
  capture: boolean,
) {
  const ids = visits.map((v) => v.id);
  const loaded = await loadInspections(
    c,
    p,
    "ServiceAppointment",
    ids,
    new Date().toISOString().slice(0, 10),
  );
  const bindings = ids.length
    ? (
        await c.query<{
          attempt_id: string;
          title: string;
          reference: string;
          equipment: string;
        }>(
          `
    SELECT b.attempt_id,t.title,t.source_reference AS reference,b.snapshot->'asset'->>'display_number' AS equipment
    FROM ppo.service_inspection_bindings b JOIN ppo.service_inspection_templates t ON (t.workspace_id,t.id)=(b.workspace_id,b.template_id)
    WHERE b.workspace_id=$1 AND b.appointment_id=ANY($2::uuid[])`,
          [p.workspace_id, ids],
        )
      ).rows
    : [];
  const issued = ids.length
    ? (
        await c.query<{ attempt_id: string }>(
          "SELECT attempt_id FROM ppo.service_inspection_outputs WHERE workspace_id=$1 AND appointment_id=ANY($2::uuid[])",
          [p.workspace_id, ids],
        )
      ).rows
    : [];
  const rows: InspectionRegisterRow[] = [];
  for (const visit of visits) {
    const attempts = loaded.attempts.filter(
      (a) =>
        a.row.host_id === visit.id &&
        (!capture || a.row.performer_id === p.actor_id),
    );
    for (const a of attempts) {
      const binding = bindings.find((b) => b.attempt_id === a.row.id);
      if (!binding || (!capture && a.row.state !== "Submitted")) continue;
      const defects = loaded.defects.filter((d) =>
        a.defects.some((l) => l.defect_id === d.id),
      );
      const passed = a.results.filter((r) => r.evaluation === "Pass").length;
      const failed = a.results.filter((r) => r.evaluation === "Fail").length;
      rows.push({
        ...visit,
        attempt_id: a.row.id,
        procedure: binding.title,
        procedure_reference: binding.reference,
        attempt_number: a.row.attempt_number,
        predecessor_number:
          loaded.attempts.find((x) => x.row.id === a.row.predecessor_id)?.row
            .attempt_number ?? null,
        performer: a.row.performer_name,
        performer_id: a.row.performer_id,
        submitted_at: a.row.submitted_at,
        review: a.review,
        state: a.row.state,
        result:
          a.row.state === "Draft"
            ? `${a.results.filter((r) => r.raw_value !== null || r.choice !== null || r.entry_state !== "Recorded").length} of ${a.row.check_keys.length} recorded`
            : failed
              ? `${failed} failed`
              : `${passed} of ${a.row.check_keys.length} pass`,
        failed,
        defects: defects.length,
        retest_due: defects.some((d) => d.state !== "Closed"),
        issued: issued.some((o) => o.attempt_id === a.row.id),
        equipment: binding.equipment ?? "Retained equipment",
      });
    }
    if (capture && !attempts.length)
      rows.push({
        ...visit,
        attempt_id: null,
        procedure: "Choose an applicable procedure",
        procedure_reference: "",
        attempt_number: null,
        predecessor_number: null,
        performer: "",
        performer_id: null,
        submitted_at: null,
        review: "NotSubmitted",
        state: "NotStarted",
        result: "Not started",
        failed: 0,
        defects: 0,
        retest_due: false,
        issued: false,
        equipment: "",
      });
  }
  return rows;
}
