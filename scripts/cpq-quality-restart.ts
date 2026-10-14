// Private checkpoint before, exact evidence verification after real app/DB restart.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { hash } from "../src/cpq/hash";
import { cpqHttp } from "../tests/helpers/cpq-products";
import { cpqQualityHttpScenario } from "../tests/helpers/cpq-quality-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
const directory = "verification-evidence/cpq-quality-restart";
type Scenario = Awaited<ReturnType<typeof cpqQualityHttpScenario>>;
const postmaster = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text AS value"))
    .rows[0].value as string;
async function snapshot(s: Scenario) {
  return (
    await database().query(
      `SELECT * FROM (
    SELECT 'release' kind,to_jsonb(r) value FROM ppo.cpq_releases r WHERE id=$1
    UNION ALL SELECT 'revision',to_jsonb(r) FROM ppo.cpq_revisions r WHERE release_id=$1
    UNION ALL SELECT 'review',to_jsonb(r) FROM ppo.cpq_reviews r WHERE revision_id IN(SELECT id FROM ppo.cpq_revisions WHERE release_id=$1)
    UNION ALL SELECT 'activation',to_jsonb(a) FROM ppo.cpq_activations a WHERE revision_id IN(SELECT id FROM ppo.cpq_revisions WHERE release_id=$1)
    UNION ALL SELECT 'audit',to_jsonb(a) FROM ppo.audit_events a WHERE object_type='CpqRelease' AND object_id=$1
    UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE operation_id=ANY($3::uuid[])
    UNION ALL SELECT 'outbox',to_jsonb(o) FROM ppo.outbox_jobs o WHERE operation_id=ANY($3::uuid[])
    UNION ALL SELECT 'estimate',to_jsonb(e) FROM ppo.estimates e WHERE id=$2
    UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$2
    UNION ALL SELECT 'run',to_jsonb(r) FROM ppo.cpq_runs r WHERE id IN(SELECT run_id FROM ppo.cpq_adoptions WHERE estimate_id=$2)
  ) evidence ORDER BY kind,value::text`,
      [
        s.id,
        s.estimate_id,
        [s.assess.operation_id, s.review.operation_id, s.activate.operation_id],
      ],
    )
  ).rows;
}
try {
  if (process.argv[2] === "write") {
    const scenario = await cpqQualityHttpScenario();
    await mkdir(directory, { recursive: true });
    // Session tokens are deliberately excluded from committed/CI uploaded evidence.
    await writeFile(
      `${directory}/checkpoint.json`,
      JSON.stringify({
        scenario,
        evidence: await snapshot(scenario),
        postmaster: await postmaster(),
      }),
    );
    console.log(
      "Saved exact quality assessment, review and activation. Restart the app and PostgreSQL before verify.",
    );
  } else if (process.argv[2] === "verify") {
    const checkpoint = JSON.parse(
      await readFile(`${directory}/checkpoint.json`, "utf8"),
    ) as { scenario: Scenario; evidence: unknown; postmaster: string };
    const s = checkpoint.scenario,
      restarted = await postmaster();
    assert.notEqual(
      restarted,
      checkpoint.postmaster,
      "Restart the actual PostgreSQL instance before verifying.",
    );
    assert.deepEqual(await cpqHttp(s.cookie, s.historicalPath), s.historical);
    for (const [cookie, path, command, receipt] of [
      [s.cookie, s.path + "/assess", s.assess, s.assessmentReceipt],
      [s.reviewerCookie, s.path + "/review", s.review, s.reviewReceipt],
      [
        s.publisherCookie,
        `cpq/releases/${s.id}/activate`,
        s.activate,
        s.activationReceipt,
      ],
    ] as const) {
      assert.deepEqual(
        await cpqHttp(cookie, `operations/${command.operation_id}`),
        receipt,
      );
      assert.deepEqual(await cpqHttp(cookie, path, command), receipt);
    }
    assert.deepEqual(await snapshot(s), checkpoint.evidence);
    await writeFile(
      `${directory}/verified.json`,
      JSON.stringify(
        {
          passed: true,
          graph_hash: hash(checkpoint.evidence),
          report_hash: s.historical.assessment.details.report_hash,
          original_receipts: 3,
          duplicate_effects: 0,
          postmaster_before: checkpoint.postmaster,
          postmaster_after: restarted,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Exact quality report, independent decision, native evidence and three original receipts survived restart with no duplicate effects.",
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
