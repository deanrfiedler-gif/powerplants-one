// Run write before, verify after stopping/starting the compiled app and PostgreSQL.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { hash } from "../src/cpq/hash";
import { cpqHttp, cpqProductHttpScenario } from "../tests/helpers/cpq-products";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
const directory = "verification-evidence/cpq-products-restart",
  file = `${directory}/checkpoint.json`;
const started = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text AS value"))
    .rows[0].value as string;
type Scenario = Awaited<ReturnType<typeof cpqProductHttpScenario>>;
async function snapshot(s: Scenario) {
  return (
    await database().query(
      `SELECT * FROM (
    SELECT 'run' kind,to_jsonb(r) value FROM ppo.cpq_runs r WHERE id=$1
    UNION ALL SELECT 'adoption',to_jsonb(a) FROM ppo.cpq_adoptions a WHERE run_id=$1
    UNION ALL SELECT 'estimate',to_jsonb(e) FROM ppo.estimates e WHERE id=$2
    UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$2
    UNION ALL SELECT 'revision',to_jsonb(v) FROM ppo.cpq_revisions v WHERE release_id=$3
    UNION ALL SELECT 'review',to_jsonb(r) FROM ppo.cpq_reviews r WHERE revision_id IN(SELECT id FROM ppo.cpq_revisions WHERE release_id=$3)
    UNION ALL SELECT 'activation',to_jsonb(a) FROM ppo.cpq_activations a WHERE revision_id IN(SELECT id FROM ppo.cpq_revisions WHERE release_id=$3)
    UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE operation_id=ANY($4::uuid[])
    UNION ALL SELECT 'audit',to_jsonb(a) FROM ppo.audit_events a WHERE operation_id=ANY($4::uuid[])
    UNION ALL SELECT 'outbox',to_jsonb(j) FROM ppo.outbox_jobs j WHERE operation_id=ANY($4::uuid[])
  ) evidence ORDER BY kind,value::text`,
      [
        s.run.id,
        s.estimate.id,
        s.release.id,
        [s.command.operation_id, s.adoption.operation_id],
      ],
    )
  ).rows;
}
try {
  if (process.argv[2] === "write") {
    const scenario = await cpqProductHttpScenario();
    const evidence = await snapshot(scenario);
    await mkdir(directory, { recursive: true });
    // Contains local synthetic session token; ignored/private, never commit checkpoint.
    await writeFile(
      file,
      JSON.stringify({ scenario, evidence, postmaster: await started() }),
    );
    console.log(
      "Saved exact Product/relationship evidence, adopted estimate and original operations; publication then withdrawn. Restart app and database before verify.",
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
    assert.deepEqual(await cpqHttp(s.cookie, s.provenancePath), s.provenance);
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
      "CpqProductPublicationChanged",
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
          product_count: s.run.binding.products!.length,
          relationship_count:
            s.run.binding.products![0].relationship_evidence.length,
          adopted_product_lines: s.provenance.product_provenance.length,
          original_receipts: 2,
          duplicate_effects: 0,
          withdrawn_source_refused: true,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Exact Product/compatibility evidence, estimate and original receipts survived restart; retries added no effects and new adoption was refused.",
    );
  } else
    throw Error(
      "Use write or verify; restart app and database between phases.",
    );
} finally {
  await closeDatabase();
}
