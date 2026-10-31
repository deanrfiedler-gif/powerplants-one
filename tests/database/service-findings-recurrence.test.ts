import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readFinding, readFindings } from "../../src/service/findings/reads";
import { inspectionCommand } from "../../src/inspections/service-commands";
import { saveAttempt } from "../../src/inspections/service";
import { serviceHost } from "../../src/inspections/service-context";
import {
  inspectionFixture,
  openInspection,
  saveInspection,
  inspect,
  base,
} from "../helpers/service-inspections";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
async function failure(
  f: Awaited<ReturnType<typeof inspectionFixture>>,
  at: string,
) {
  const id = await openInspection(f, f.tech, 1),
    saved = await saveInspection(f, id);
  // Historical synthetic fixture: retain engine hashes and constraints without
  // pretending today's attendance can capture a reading from 90 days ago.
  await transaction((c) =>
    saveAttempt(c, f.tech, serviceHost(f.id), id, saved.row.version, {
      configuration_reference: saved.row.configuration_reference,
      configuration_source_id: saved.row.configuration_source_id,
      timezone: saved.row.timezone,
      clock_concern: null,
      prerequisites: saved.row.prerequisites,
      findings: saved.row.findings,
      occurred_at: at,
      instrument_ids: ["e9550000-0000-4000-8000-000000000003"],
      reading_instruments: saved.row.plan
        .filter((d) => d.instrument_required)
        .map((d) => ({
          check_key: d.key,
          instrument_id: "e9550000-0000-4000-8000-000000000003",
        })),
      readings: saved.row.plan.map((d) => ({
        check_key: d.key,
        state: "Recorded",
        ...(d.check_type === "Numeric"
          ? { value: "120", unit: "kPa" }
          : { choice: "Clear" }),
      })),
    }),
  );
  const ready = (await inspect(f.tech, f.id)).attempts.find(
    (a) => a.row.id === id,
  )!;
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: id,
      expected_version: ready.row.version,
    },
    "capture",
  );
  const linked = (
    await database().query(
      "SELECT defect_id FROM ppo.inspection_defect_attempts WHERE attempt_id=$1",
      [id],
    )
  ).rows[0];
  const d = (await inspect(f.tech, f.id)).defects.find(
    (d) => d.id === linked.defect_id,
  )!;
  assert.ok(d);
  return d;
}
test("SV07 recurrence uses the original failed-check key at the exact 90-day boundary, excludes older observations and revoked actions", async () => {
  const f = await inspectionFixture(),
    g = f,
    now = new Date(),
    at = now.toISOString();
  await failure(f, new Date(now.getTime() - 90 * 86400000).toISOString());
  await failure(f, new Date(now.getTime() - 90 * 86400000 - 1).toISOString());
  const latest = await failure(g, at),
    key = `inspection:${latest.id}`;
  const row = (await readFinding(g.co, key)).item;
  assert.equal(row.recurrence?.basis, "FailedCheck");
  assert.ok(
    row.recurrence?.earlier.some(
      (r) =>
        r.occurred_at === new Date(now.getTime() - 90 * 86400000).toISOString(),
    ),
  );
  assert.ok(
    !row.recurrence?.earlier.some(
      (r) =>
        r.occurred_at ===
        new Date(now.getTime() - 90 * 86400000 - 1).toISOString(),
    ),
  );
  assert.ok(
    (await readFindings(g.co, { view: "recurring", limit: 50 })).items.some(
      (r) => r.id === key,
    ),
  );
  const before = (
    await database().query(
      "SELECT state FROM ppo.inspection_defects WHERE id=$1",
      [latest.id],
    )
  ).rows;
  await readFinding(g.co, key);
  assert.deepEqual(
    (
      await database().query(
        "SELECT state FROM ppo.inspection_defects WHERE id=$1",
        [latest.id],
      )
    ).rows,
    before,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.read'",
    [g.co.actor_id],
  );
  await assert.rejects(readFinding(g.co, key), (e: unknown) =>
    [403, 404].includes((e as { status: number }).status),
  );
});
