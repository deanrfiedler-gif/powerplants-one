import { randomUUID } from "node:crypto";
import { started, principal, base, rows, png, startInput } from "./field";
import {
  createCs,
  saveCs,
  readCs,
  csAction,
} from "../../src/shared/cs/service";
import { transaction } from "../../src/platform/database";
import { loadServiceInspections } from "../../src/inspections/service-context";
import {
  inspectionCommand,
  previewServiceInspection,
} from "../../src/inspections/service-commands";
import { digest } from "../../src/documents/store";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
export { base, principal, rows, png };
export function inspectionPreparation() {
  const requirement = randomUUID(),
    evidence = randomUUID();
  return {
    schema_version: 1,
    requirements: [
      {
        id: requirement,
        revision: 1,
        title: "SYN external observation permission",
        kind: "Site approval",
        facility_id: null,
        activity: "Inspection",
        source: "SYN site source v1",
      },
    ],
    evidence: [
      {
        id: evidence,
        requirement_id: requirement,
        requirement_revision: 1,
        facility_id: null,
        activity: "Inspection",
        person_id: null,
        captured_on: "2026-01-01",
        expires_on: "2032-12-31",
        source: "SYN exact site approval evidence",
      },
    ],
    windows: [
      {
        id: randomUUID(),
        facility_id: null,
        activity: "Inspection",
        from_date: "2026-01-01",
        to_date: "2032-12-31",
        season_from: "01-01",
        season_to: "12-31",
        start_time: "00:00",
        end_time: "23:59",
        source: "SYN synthetic permitted window",
      },
    ],
  };
}
export async function inspectionFixture() {
  const q = await started(),
    co = await principal(),
    tech = q.p,
    second = await principal("second-technician");
  const source = randomUUID();
  const appointment = (
    await rows("SELECT site_id FROM ppo.appointments WHERE id=$1", [q.job.id])
  )[0];
  await createCs(co, "Readiness", {
    ...base(),
    id: source,
    context_id: appointment.site_id,
    name: "SYN inspection preparation — external observation only",
    owner_id: co.actor_id,
  });
  const preparation = inspectionPreparation(),
    record = (await readCs(co, "Readiness", source)).record;
  await saveCs(co, "Readiness", source, {
    ...base(),
    expected_version: record.version,
    name: record.name,
    owner_id: record.owner_id,
    content: preparation,
  });
  const saved = (await readCs(co, "Readiness", source)).record;
  await csAction(await principal("cs-reviewer"), "Readiness", source, {
    ...base(),
    expected_version: saved.version,
    action: "review_evidence",
    evidence_id: preparation.evidence[0].id,
  });
  const job = (await readFieldJob(second, q.job.id)).items[0];
  await startAttendance(second, job.id, startInput(job));
  return { id: q.job.id, co, tech, second, source, q };
}
export const inspect = (
  p: Awaited<ReturnType<typeof principal>>,
  id: string,
  mode: "capture" | "review" = "capture",
) => transaction((c) => loadServiceInspections(c, p, id, mode));
export async function openInspection(
  f: Awaited<ReturnType<typeof inspectionFixture>>,
  p = f.tech,
  template = 0,
  predecessor: string | null = null,
) {
  const v = await inspect(p, f.id),
    t = v.catalogue[template],
    target = v.targets[0],
    id = randomUUID();
  const preview = await previewServiceInspection(p, f.id, {
    template_id: t.id,
    scope_item_id: target.scope_item_id,
    asset_id: target.asset_id,
  });
  await inspectionCommand(
    p,
    f.id,
    {
      ...base(),
      action: "open",
      id,
      template_id: t.id,
      scope_item_id: target.scope_item_id,
      asset_id: target.asset_id,
      predecessor_id: predecessor,
      binding_hash: preview.binding_hash,
    },
    "capture",
  );
  return id;
}
export async function saveInspection(
  f: Awaited<ReturnType<typeof inspectionFixture>>,
  id: string,
  value = "120",
  p = f.tech,
) {
  let a = (await inspect(p, f.id)).attempts.find((a) => a.row.id === id)!;
  const readings = a.row.plan.map((d) => ({
    check_key: d.key,
    state: "Recorded",
    ...(d.check_type === "Numeric"
      ? { value, unit: "kPa" }
      : { choice: "Clear" }),
  }));
  await inspectionCommand(
    p,
    f.id,
    {
      ...base(),
      action: "save",
      attempt_id: id,
      expected_version: a.row.version,
      occurred_at: new Date().toISOString(),
      instrument_ids: ["e9550000-0000-4000-8000-000000000003"],
      readings,
    },
    "capture",
  );
  a = (await inspect(p, f.id)).attempts.find((a) => a.row.id === id)!;
  const bytes = png();
  await inspectionCommand(
    p,
    f.id,
    {
      ...base(),
      action: "evidence",
      attempt_id: id,
      expected_version: a.row.version,
      evidence: {
        id: randomUUID(),
        kind: "StoredFile",
        check_key: a.row.plan[0].key,
        label: "SYN original pressure photograph.png",
        purpose: "Reading evidence",
        access_class: "Internal",
        media_type: "image/png",
        byte_count: bytes.length,
        sha256: digest(bytes),
        content_base64: bytes.toString("base64"),
      },
    },
    "capture",
  );
  return (await inspect(p, f.id)).attempts.find((a) => a.row.id === id)!;
}
