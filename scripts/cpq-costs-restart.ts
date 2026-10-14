// Run write before, verify after stopping/starting the compiled app and PostgreSQL.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { hash } from "../src/cpq/hash";
import { cpqHttp } from "../tests/helpers/cpq-products";
import { cpqCostHttpScenario } from "../tests/helpers/cpq-costs-http";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
const directory = "verification-evidence/cpq-costs-restart",
  file = `${directory}/checkpoint.json`;
const started = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text AS value"))
    .rows[0].value as string;
type Scenario = Awaited<ReturnType<typeof cpqCostHttpScenario>>;
async function snapshot(s: Scenario) {
  return (
    await database().query(
      `SELECT * FROM (
    SELECT 'run' kind,to_jsonb(r) value FROM ppo.cpq_runs r WHERE id=$1
    UNION ALL SELECT 'adoption',to_jsonb(a) FROM ppo.cpq_adoptions a WHERE run_id=$1
    UNION ALL SELECT 'estimate',to_jsonb(e) FROM ppo.estimates e WHERE id=$2
    UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$2
    UNION ALL SELECT 'source_binding',to_jsonb(b) FROM ppo.estimate_cost_source_bindings b WHERE estimate_version_id IN(SELECT id FROM ppo.estimate_versions WHERE estimate_id=$2)
    UNION ALL SELECT 'revision',to_jsonb(v) FROM ppo.cpq_revisions v WHERE release_id=$3
    UNION ALL SELECT 'review',to_jsonb(r) FROM ppo.cpq_reviews r WHERE revision_id IN(SELECT id FROM ppo.cpq_revisions WHERE release_id=$3)
    UNION ALL SELECT 'activation',to_jsonb(a) FROM ppo.cpq_activations a WHERE revision_id IN(SELECT id FROM ppo.cpq_revisions WHERE release_id=$3)
    UNION ALL SELECT 'source',to_jsonb(s) FROM ppo.cost_sources s WHERE id=ANY($5::uuid[])
    UNION ALL SELECT 'source_revision',to_jsonb(r) FROM ppo.cost_source_revisions r WHERE source_id=ANY($5::uuid[])
    UNION ALL SELECT 'source_review',to_jsonb(e) FROM ppo.cost_source_events e WHERE source_id=ANY($5::uuid[])
    UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE operation_id=ANY($4::uuid[])
    UNION ALL SELECT 'audit',to_jsonb(a) FROM ppo.audit_events a WHERE operation_id=ANY($4::uuid[])
    UNION ALL SELECT 'outbox',to_jsonb(j) FROM ppo.outbox_jobs j WHERE operation_id=ANY($4::uuid[])
  ) evidence ORDER BY kind,value::text`,
      [
        s.run.id,
        s.estimate.id,
        s.release.release.id,
        [s.command.operation_id, s.adoption.operation_id],
        s.refs.map((ref) => ref.source_id),
      ],
    )
  ).rows;
}
try {
  if (process.argv[2] === "write") {
    const scenario = await cpqCostHttpScenario();
    const evidence = await snapshot(scenario);
    await mkdir(directory, { recursive: true });
    // Contains local synthetic session token; ignored/private, never commit checkpoint.
    await writeFile(
      file,
      JSON.stringify({ scenario, evidence, postmaster: await started() }),
    );
    console.log(
      "Saved exact cost/source review evidence, adopted estimate and original operations; source then revised. Restart app and database before verify.",
    );
  } else if (process.argv[2] === "verify") {
    const checkpoint = JSON.parse(await readFile(file, "utf8")) as {
      scenario: Scenario;
      evidence: unknown;
      postmaster: string;
    };
    const s = checkpoint.scenario,
      postmaster = await started();
    assert.notEqual(
      postmaster,
      checkpoint.postmaster,
      "Restart the actual PostgreSQL instance before verification.",
    );
    assert.deepEqual(await cpqHttp(s.cookie, `cpq/runs/${s.run.id}`), s.run);
    assert.deepEqual(
      await cpqHttp(s.cookie, `estimating/estimates/${s.estimate.id}`),
      s.estimate,
    );
    for (const [path, input, receipt] of [
      [s.endpoint, s.command, s.calculationReceipt],
      [`cpq/runs/${s.run.id}/adoption`, s.adoption, s.adoptionReceipt],
    ] as const) {
      assert.deepEqual(
        await cpqHttp(s.cookie, `operations/${input.operation_id}`),
        receipt,
      );
      assert.deepEqual(await cpqHttp(s.cookie, path, input), receipt);
    }
    assert.equal(
      (
        await cpqHttp<{ code: string }>(
          s.cookie,
          `cpq/runs/${s.run.id}/adoption`,
          undefined,
          409,
        )
      ).code,
      "CpqCostSourceChanged",
    );
    assert.deepEqual(await snapshot(s), checkpoint.evidence);
    await writeFile(
      `${directory}/verified.json`,
      JSON.stringify(
        {
          passed: true,
          postmaster_before: checkpoint.postmaster,
          postmaster_after: postmaster,
          graph_hash: hash(checkpoint.evidence),
          run_content_hash: s.run.content_hash,
          result_hash: s.run.result.result_hash,
          source_count: s.run.binding.cost_sources!.length,
          bound_lines: s.estimate.saved.source_bindings!.length,
          original_receipts: 2,
          duplicate_effects: 0,
          changed_source_refused: true,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Exact governed cost evidence, estimate and original receipts survived restart; retries added no effects and new adoption was refused.",
    );
  } else
    throw Error(
      "Use write or verify; restart app and database between phases.",
    );
} finally {
  await closeDatabase();
}
