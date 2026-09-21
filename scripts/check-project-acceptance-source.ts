import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { PJ, seedStage, stable } from "../tests/helpers/acceptance";
import { detail } from "../tests/helpers/acceptance-journey";
import { principalOf } from "../tests/helpers/engineering-materials-direct";
import { packageCommand } from "../src/engineering/commissioning/commands";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Run only on the synthetic test clone with the A–L scenario");
try {
  const source = stable("en08:record:006"),
    row = (
      await database().query(
        "SELECT * FROM ppo.commissioning_packages WHERE id=$1",
        [source],
      )
    ).rows[0];
  assert(row, "Clone the PJ-09 synthetic review fixture first");
  const s = await seedStage(
    PJ.project,
    "native-" + randomUUID(),
    "SYN exact EN-08 source integration",
    "Satisfied",
    source,
    "control-system",
  );
  const initial = await detail(PJ.project, s.stage);
  assert.equal(initial.outcomes.technical, "Accepted");
  assert(
    initial.handover_gates.some(
      (g) => g.includes("Operator training") && g.includes("Planned"),
    ),
    "The real EN-08 training requirement must not be masked by a synthetic completed training observation",
  );
  const actor = await principalOf("coordinator"),
    body = {
      operation_id: randomUUID(),
      schema_version: 1,
      reason: "SYN changed source applicability after technical acceptance",
      action: "assess",
      record_id: source,
      result: "ReassessmentRequired",
      evidence: "SYN new control configuration requires scoped reassessment",
    };
  const accepted = await packageCommand(actor, row.package_id, body),
    changed = await detail(PJ.project, s.stage);
  assert.equal(changed.stage.reassessment, true);
  assert.notEqual(changed.outcomes.technical, "Accepted");
  const count = async () =>
    Number(
      (
        await database().query(
          "SELECT count(*) FROM ppo.acceptance_followups WHERE stage_id=$1 AND cause LIKE 'en08:%'",
          [s.stage],
        )
      ).rows[0].count,
    );
  assert.equal(await count(), 1);
  assert.deepEqual(
    (await packageCommand(actor, row.package_id, body)).receipt,
    accepted.receipt,
  );
  assert.equal(await count(), 1);
  assert.equal(
    changed.decisions.filter((d) => d.kind === "Technical").length,
    1,
  );
  await writeFile(
    "tmp/pj09-evidence/source-results.json",
    JSON.stringify(
      {
        source,
        stage: s.stage,
        technicalBefore: initial.outcomes.technical,
        handoverBlockers: initial.handover_gates,
        technicalAfter: changed.outcomes.technical,
        reassessment: changed.stage.reassessment,
        originalTechnicalDecisions: 1,
        followups: await count(),
        originalSourceReplayPreserved: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: real EN-08 acceptance, source-owned training gate, scoped reassessment, retained decision and one owned Activity on replay.",
  );
} finally {
  await closeDatabase();
}
