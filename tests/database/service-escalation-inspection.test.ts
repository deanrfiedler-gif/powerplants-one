import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  createCase,
  commandCase,
} from "../../src/service/escalations/commands";
import { readCase, retainedFile } from "../../src/service/escalations/reads";
import { readFinding } from "../../src/service/findings/reads";
import { inspectionCommand } from "../../src/inspections/service-commands";
import {
  inspectionFixture,
  openInspection,
  saveInspection,
  inspect,
  base,
} from "../helpers/service-inspections";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
test("SV08 senior technician captures native submitted readings, instrument attribution and immutable configuration without contact or commercial fields", async () => {
  const f = await inspectionFixture(),
    attemptId = await openInspection(f, f.tech, 1),
    attempt = await saveInspection(f, attemptId);
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: attemptId,
      expected_version: attempt.row.version,
    },
    "capture",
  );
  const defect = (await inspect(f.tech, f.id)).defects[0],
    key = `inspection:${defect.id}`,
    finding = (await readFinding(f.tech, key)).item;
  const assetId = finding.equipment!.id;
  // Explicit test authoring only: the fixture uses the fictional manufacturer in accepted frame 04.
  await database().query(
    "UPDATE ppo.assets SET manufacturer='SYN Boiler Controls',warranty_end='2027-03-31' WHERE id=$1",
    [assetId],
  );
  const id = randomUUID();
  await createCase(f.tech, {
    ...base(),
    id,
    finding_key: key,
    asset_id: assetId,
    owner_id: f.tech.actor_id,
    fault: "SYN pressure outside the inspection range",
    fault_type: "Sensor reading",
  });
  const act = async (action: string, fields: Record<string, unknown> = {}) =>
    commandCase(f.tech, id, {
      ...base(),
      action,
      expected_version: (await readCase(f.tech, id)).record.version,
      ...fields,
    });
  await act("diagnose", {
    attempted_at: new Date().toISOString(),
    diagnostic: "SYN compared retained pressure result",
    result: "SYN failed result requires remote advice",
    source_reference: finding.source_record.reference,
  });
  await act("capture_configuration");
  const captured = (await readCase(f.tech, id)).configuration;
  assert.ok(captured);
  await act("prepare_pack");
  const record = await readCase(f.tech, id),
    pack = record.packs[0];
  assert.equal(record.equipment.warranty_end, "2027-03-31");
  const evidence = (
    await database().query(
      "SELECT evidence FROM ppo.service_escalation_packs WHERE id=$1",
      [pack.id],
    )
  ).rows[0].evidence;
  assert.equal(evidence.observations.length, 1);
  assert.equal(evidence.observations[0].attempt_id, attemptId);
  const numeric = attempt.results.find((r) => r.raw_value !== null)!;
  const reading = evidence.observations[0].readings.find(
    (r: { check: string }) => r.check === numeric.check_key,
  );
  assert.equal(reading.value, numeric.raw_value);
  assert.equal(reading.unit, numeric.unit);
  assert.notEqual(reading.instrument, "Not recorded");
  assert.doesNotMatch(reading.calibration, /Not recorded/);
  assert.deepEqual(Object.keys(evidence.equipment).sort(), [
    "manufacturer",
    "model",
    "reference",
    "serial",
  ]);
  const html = (
    await retainedFile(f.tech, id, {
      kind: "pack",
      file_id: pack.id,
      format: "html",
    })
  ).bytes.toString();
  assert.ok(html.includes(reading.instrument));
  assert.ok(html.includes(reading.calibration));
  await assert.rejects(
    database().query(
      "UPDATE ppo.service_escalation_configurations SET description='changed' WHERE id=$1",
      [captured.id],
    ),
  );
  assert.deepEqual((await readCase(f.tech, id)).configuration, captured);
  assert.deepEqual((await readFinding(f.tech, key)).item, finding);
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "correct",
      defect_id: defect.id,
      expected_version: defect.version,
      note: "SYN sensor connection inspected; retest required",
    },
    "capture",
  );
  await assert.rejects(
    act("review_pack", {
      pack_id: pack.id,
      html_sha256: pack.html_sha256,
      pdf_sha256: pack.pdf_sha256,
      confirmed_exclusions: true,
    }),
    (e: unknown) => (e as { code: string }).code === "EvidenceChanged",
  );
  await act("prepare_pack");
  const revised = (await readCase(f.tech, id)).packs[0];
  const revisedHtml = (
    await retainedFile(f.tech, id, {
      kind: "pack",
      file_id: revised.id,
      format: "html",
    })
  ).bytes.toString();
  assert.match(revisedHtml, /SYN sensor connection inspected; retest required/);
  assert.notEqual(revised.evidence_sha256, pack.evidence_sha256);
});
