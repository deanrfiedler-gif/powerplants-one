import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { hash } from "../src/cpq/hash";
import { cpqPackageHttpScenario } from "../tests/helpers/cpq-packages-http";
import { cpqHttp } from "../tests/helpers/cpq-products";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
const directory = "verification-evidence/cpq-packages-restart";
type Scenario = Awaited<ReturnType<typeof cpqPackageHttpScenario>>;
const postmaster = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text value"))
    .rows[0].value as string;
async function snapshot(s: Scenario) {
  return (
    await database().query(
      `SELECT * FROM (
    SELECT 'package' kind,to_jsonb(x) value FROM ppo.cpq_packages x WHERE id=$1
    UNION ALL SELECT 'package_revision',to_jsonb(x) FROM ppo.cpq_package_revisions x WHERE package_id=$1
    UNION ALL SELECT 'package_event',to_jsonb(x) FROM ppo.cpq_package_events x WHERE package_id=$1
    UNION ALL SELECT 'release',to_jsonb(x) FROM ppo.cpq_releases x WHERE id=$2
    UNION ALL SELECT 'revision',to_jsonb(x) FROM ppo.cpq_revisions x WHERE release_id=$2
    UNION ALL SELECT 'run',to_jsonb(x) FROM ppo.cpq_runs x WHERE id=$3
    UNION ALL SELECT 'estimate',to_jsonb(x) FROM ppo.estimates x WHERE id=$4
    UNION ALL SELECT 'estimate_version',to_jsonb(x) FROM ppo.estimate_versions x WHERE estimate_id=$4
    UNION ALL SELECT 'audit',to_jsonb(x) FROM ppo.audit_events x WHERE operation_id=ANY($5::uuid[])
    UNION ALL SELECT 'receipt',to_jsonb(x) FROM ppo.operation_receipts x WHERE operation_id=ANY($5::uuid[])
    UNION ALL SELECT 'outbox',to_jsonb(x) FROM ppo.outbox_jobs x WHERE operation_id=ANY($5::uuid[])
  ) e ORDER BY kind,value::text`,
      [
        s.id,
        s.release_id,
        s.run.id,
        s.estimate_id,
        s.operations.map((o) => o.command.operation_id),
      ],
    )
  ).rows;
}
try {
  if (process.argv[2] === "write") {
    const scenario = await cpqPackageHttpScenario();
    await mkdir(directory, { recursive: true });
    // Private session credentials remain in the ignored checkpoint; never upload it.
    await writeFile(
      `${directory}/checkpoint.json`,
      JSON.stringify({
        scenario,
        evidence: await snapshot(scenario),
        postmaster: await postmaster(),
      }),
    );
    console.log(
      "Saved package/workload/manifest/adoption graph and original operations. Restart the application and PostgreSQL before verify.",
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
      "Restart the actual PostgreSQL instance.",
    );
    assert.deepEqual(await cpqHttp(s.cookie, s.path), s.historical);
    for (const o of s.operations) {
      assert.deepEqual(
        await cpqHttp(o.cookie, `operations/${o.command.operation_id}`),
        o.receipt,
      );
      assert.deepEqual(await cpqHttp(o.cookie, o.path, o.command), o.receipt);
    }
    await cpqHttp(s.cookie, `cpq/runs/${s.run.id}/adoption`, undefined, 409);
    assert.deepEqual(await snapshot(s), checkpoint.evidence);
    await writeFile(
      `${directory}/verified.json`,
      JSON.stringify(
        {
          passed: true,
          graph_hash: hash(checkpoint.evidence),
          package_hash: s.historical.current.content_hash,
          manifest_hash: s.composed.manifest_hash,
          original_receipts: s.operations.length,
          duplicate_effects: 0,
          postmaster_before: checkpoint.postmaster,
          postmaster_after: restarted,
        },
        null,
        2,
      ) + "\n",
    );
    const attestation = s.historical.events.find((e) => e.action === "Attest")!;
    await writeFile(
      `${directory}/workload.json`,
      JSON.stringify(
        {
          content_hash: s.historical.current.content_hash,
          evidence_hash: attestation.report_hash,
          report: attestation.report,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Exact package, owned workload evidence, release/run/estimate graph and original operations survived actual restart without duplicate effects.",
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
