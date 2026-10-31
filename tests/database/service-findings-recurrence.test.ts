import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readFinding, readFindings } from "../../src/service/findings/reads";
import { inspectionCommand } from "../../src/inspections/service-commands";
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
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "save",
      attempt_id: id,
      expected_version: saved.row.version,
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
    },
    "capture",
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
  const d = (await inspect(f.tech, f.id)).defects.find(
    (d) => d.source_attempt_id === id,
  )!;
  assert.ok(d);
  return d;
}
test("SV07 recurrence uses the original failed-check key at the exact 90-day boundary, excludes older observations and revoked actions", async () => {
  const f = await inspectionFixture(),
    g = f,
    now = new Date(),
    at = now.toISOString();
  const boundary = await failure(
    f,
    new Date(now.getTime() - 90 * 86400000).toISOString(),
  );
  const outside = await failure(
    f,
    new Date(now.getTime() - 90 * 86400000 - 1).toISOString(),
  );
  const latest = await failure(g, at),
    key = `inspection:${latest.id}`;
  const row = (await readFinding(g.co, key)).item;
  assert.equal(row.recurrence?.basis, "FailedCheck");
  assert.ok(
    row.recurrence?.earlier.some((r) => r.id === `inspection:${boundary.id}`),
  );
  assert.ok(
    !row.recurrence?.earlier.some((r) => r.id === `inspection:${outside.id}`),
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
    "UPDATE ppo.activities SET access_class='RestrictedFinance',version=version+1 WHERE id=$1",
    [boundary.activity_id],
  );
  const hidden = (await readFinding(g.co, key)).item;
  assert.ok(
    !hidden.recurrence?.earlier.some(
      (r) => r.id === `inspection:${boundary.id}`,
    ),
  );
  assert.ok(!JSON.stringify(hidden.recurrence).includes(boundary.id));
});
