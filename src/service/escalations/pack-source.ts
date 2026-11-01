import { randomUUID } from "node:crypto";
import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { invalid } from "../../shared/validation";
import { currentConfiguration, safeEvidence } from "../../equipment/changes";
import { caseContext } from "./context";
import { hashBytes, hashValue } from "./model";
import { redactedTechnical, type TechnicalEvidence } from "./evidence";
export async function captureConfiguration(
  c: QueryClient,
  p: Principal,
  ctx: Awaited<ReturnType<typeof caseContext>>,
) {
  const source = await currentConfiguration(
    c,
    p.workspace_id,
    ctx.row.asset_id,
  );
  if (!source)
    invalid(
      "configuration",
      "Record the controller configuration in Equipment before capturing it here.",
    );
  const snapshot = {
    source_id: source.id,
    revision: source.revision,
    description: safeEvidence(
      redactedTechnical(source.description),
      "configuration",
      10000,
    ),
  };
  const id = randomUUID();
  await c.query(
    "INSERT INTO ppo.service_escalation_configurations(id,workspace_id,case_id,source_id,revision,description,sha256,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      id,
      p.workspace_id,
      ctx.row.id,
      snapshot.source_id,
      snapshot.revision,
      snapshot.description,
      hashValue(snapshot),
      p.actor_id,
    ],
  );
  return id;
}
export async function technicalEvidence(
  c: QueryClient,
  p: Principal,
  ctx: Awaited<ReturnType<typeof caseContext>>,
): Promise<TechnicalEvidence> {
  const { row, asset, finding } = ctx;
  const configuration = (
    await c.query<TechnicalEvidence["configuration"]>(
      "SELECT source_id,revision,description,sha256 FROM ppo.service_escalation_configurations WHERE workspace_id=$1 AND case_id=$2 AND id=$3",
      [p.workspace_id, row.id, row.current_configuration_id],
    )
  ).rows[0];
  const current = await currentConfiguration(c, p.workspace_id, row.asset_id);
  if (!configuration || current?.id !== configuration.source_id)
    invalid(
      "configuration",
      "Capture the current Equipment configuration before preparing or using this pack.",
    );
  const diagnostics = (
    await c.query<TechnicalEvidence["diagnostics"][number]>(
      `SELECT e.occurred_at::text AS attempted_at,u.display_name AS recorded_by,e.details->>'diagnostic' AS diagnostic,e.details->>'result' AS result,e.details->>'source_reference' AS source_reference FROM ppo.service_escalation_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by) WHERE e.workspace_id=$1 AND e.case_id=$2 AND e.kind='Diagnostic' ORDER BY e.occurred_at,e.id`,
      [p.workspace_id, row.id],
    )
  ).rows;
  if (!diagnostics.length)
    invalid(
      "diagnostics",
      "Record at least one diagnostic attempt and its result before preparing the evidence pack.",
    );
  const photos = (
    await c.query<{
      id: string;
      media_type: string;
      sha256: string;
      content: Buffer;
    }>(
      "SELECT id,media_type,sha256,content FROM ppo.service_escalation_files WHERE workspace_id=$1 AND case_id=$2 AND kind='Photo' ORDER BY created_at,id",
      [p.workspace_id, row.id],
    )
  ).rows.map((f) => ({
    id: f.id,
    media_type: f.media_type,
    sha256: f.sha256,
    bytes: f.content.length,
    content_base64: f.content.toString("base64"),
  }));
  if (
    photos.some(
      (f) => hashBytes(Buffer.from(f.content_base64, "base64")) !== f.sha256,
    )
  )
    throw Error("Retained photo hash mismatch");
  const observations: TechnicalEvidence["observations"] = [];
  let correction: TechnicalEvidence["finding"]["correction"] = null;
  if (finding.source.source === "inspection") {
    const defect = (
      await c.query<{
        correction_note: string | null;
        correction_at: Date | null;
      }>(
        "SELECT correction_note,correction_at FROM ppo.inspection_defects WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, finding.source.id],
      )
    ).rows[0];
    if (defect?.correction_note)
      correction = {
        note: redactedTechnical(defect.correction_note),
        recorded_at: defect.correction_at?.toISOString() ?? null,
      };
    const attempts = (
      await c.query<{ id: string; occurred_at: Date | null; state: string }>(
        `SELECT DISTINCT a.id,a.occurred_at,a.state FROM ppo.inspection_defect_attempts d JOIN ppo.inspection_attempts a ON (a.workspace_id,a.id)=(d.workspace_id,d.attempt_id) WHERE d.workspace_id=$1 AND d.defect_id=$2 AND a.company_id=$3 AND a.site_id=$4 AND a.state<>'Draft' ORDER BY a.occurred_at,a.id`,
        [p.workspace_id, finding.source.id, row.company_id, row.site_id],
      )
    ).rows;
    for (const a of attempts) {
      const readings = (
        await c.query<{
          check: string;
          value: string;
          unit: string;
          instrument: string;
          calibration: string;
        }>(
          `SELECT r.check_key AS check,coalesce(r.raw_value,r.choice,r.entry_state) AS value,coalesce(r.unit,'') AS unit,coalesce(u.snapshot->>'reference','Not recorded') AS instrument,coalesce(u.snapshot->>'calibration_reference','Not recorded') || ' / ' || coalesce(u.snapshot->>'calibration_version','Not recorded') AS calibration FROM ppo.inspection_results r LEFT JOIN ppo.inspection_reading_instruments ri ON (ri.workspace_id,ri.attempt_id,ri.check_key)=(r.workspace_id,r.attempt_id,r.check_key) LEFT JOIN ppo.inspection_instrument_uses u ON (u.workspace_id,u.attempt_id,u.instrument_id)=(ri.workspace_id,ri.attempt_id,ri.instrument_id) WHERE r.workspace_id=$1 AND r.attempt_id=$2 ORDER BY r.sort_order,r.check_key`,
          [p.workspace_id, a.id],
        )
      ).rows;
      observations.push({
        attempt_id: a.id,
        occurred_at: a.occurred_at?.toISOString() ?? null,
        state: a.state,
        readings,
      });
    }
  }
  const text = (value: unknown) =>
    value == null ? null : redactedTechnical(String(value));
  return {
    schema_version: 1,
    case_reference: row.display_number,
    fault: row.fault,
    site: redactedTechnical(finding.item.site.name),
    equipment: {
      reference: asset.display_number,
      manufacturer: text(asset.manufacturer),
      model: text(asset.model),
      serial: text(asset.serial),
    },
    configuration,
    diagnostics: diagnostics.map((d) => ({
      ...d,
      recorded_by: redactedTechnical(d.recorded_by),
    })),
    observations: observations.map((a) => ({
      ...a,
      readings: a.readings.map((r) => ({
        check: redactedTechnical(r.check),
        value: redactedTechnical(String(r.value)),
        unit: redactedTechnical(r.unit),
        instrument: redactedTechnical(r.instrument),
        calibration: redactedTechnical(r.calibration),
      })),
    })),
    finding: {
      reference: finding.item.source_record.reference,
      source: finding.item.source,
      state: finding.item.native_state,
      summary: redactedTechnical(finding.item.what_remains),
      correction,
    },
    photos,
  };
}
