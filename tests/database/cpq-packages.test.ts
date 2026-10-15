import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  savePackage,
  decidePackage,
  readPackage,
} from "../../src/cpq/packages";
import {
  saveRelease,
  reviewRelease,
  activateRelease,
} from "../../src/cpq/releases";
import { readRelease, readRun } from "../../src/cpq/reads";
import { previewAdoption, adoptRun } from "../../src/cpq/runs";
import { readOperation } from "../../src/shared/receipts";
import { prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { reviseCostSource } from "../../src/estimating/sources/commands";
import {
  qualityActors,
  currentQuality,
  assessAndReview,
  qualityEstimate,
} from "../helpers/cpq-quality";
import { costDefinition, reviewedCost } from "../helpers/cpq-costs";
import {
  packageFixture,
  publishedFixture,
  packageDecision,
} from "../helpers/cpq-packages";
import { crmBase, CRM } from "../helpers/crm";
import { quoteCommand } from "../helpers/estimating";
import { cpqDefinition } from "../helpers/cpq";
import { definition } from "../../src/cpq/validation";
import { hash } from "../../src/cpq/hash";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
const evidence = () =>
  rows(
    `SELECT * FROM (
      SELECT 'package' kind,to_jsonb(p) value FROM ppo.cpq_packages p
      UNION ALL SELECT 'package_revision',to_jsonb(r) FROM ppo.cpq_package_revisions r
      UNION ALL SELECT 'event',to_jsonb(e) FROM ppo.cpq_package_events e
      UNION ALL SELECT 'release',to_jsonb(r) FROM ppo.cpq_releases r
      UNION ALL SELECT 'release_revision',to_jsonb(r) FROM ppo.cpq_revisions r
      UNION ALL SELECT 'audit',to_jsonb(a) FROM ppo.audit_events a
      UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r
      UNION ALL SELECT 'outbox',to_jsonb(j) FROM ppo.outbox_jobs j
    ) x ORDER BY kind,value::text`,
  );
async function releaseCommand(
  d = cpqDefinition(),
  packages?: Awaited<ReturnType<typeof publishedFixture>>["reference"][],
) {
  return {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    expected_version: 0,
    definition: d,
    ...(packages ? { packages } : {}),
  };
}
test("owned package publication, exact release quality, frozen adoption and private quotation survive withdrawal and original recovery", async () => {
  const actors = await qualityActors(),
    pkg = await publishedFixture(actors);
  const command = await releaseCommand(pkg.content.definition, [pkg.reference]);
  await saveRelease(actors.p, command);
  let view = await readRelease(actors.p, command.id);
  assert.equal(
    view.current.package_manifest![0].fixture_owner_id,
    actors.p.actor_id,
  );
  await reviewRelease(actors.reviewer, command.id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: view.current.id,
    content_hash: view.current.content_hash,
    outcome: "Approved",
  });
  const activate = {
    ...crmBase(),
    expected_version: 2,
    revision_id: view.current.id,
    content_hash: view.current.content_hash,
    expected_activation_version: 0,
  };
  await assert.rejects(
    activateRelease(actors.publisher, command.id, activate),
    code("CpqQualityReviewRequired"),
  );
  assert.equal((await currentQuality(actors.p, command.id)).enrolled, true);
  await assessAndReview({ ...actors, view } as Parameters<
    typeof assessAndReview
  >[0]);
  view = await readRelease(actors.p, command.id);
  await activateRelease(actors.publisher, command.id, {
    ...activate,
    operation_id: randomUUID(),
    expected_version: view.release.version,
  });
  const estimate = await qualityEstimate(actors.p),
    run = await readRun(actors.p, estimate.calculation.run.id);
  assert.deepEqual(run.binding.packages, view.current.package_manifest);
  const native = await readEstimate(actors.p, estimate.command.estimate_id);
  const quote = await prepareQuote(
    actors.p,
    native.id,
    quoteCommand(native.saved, native.version),
  );
  const safe = (
    await rows(
      "SELECT safe_snapshot,input_html FROM ppo.draft_quote_revisions WHERE id=$1",
      [quote.receipt.record_id],
    )
  )[0];
  assert.doesNotMatch(
    JSON.stringify(safe),
    /fixture_owner|evaluation_ms|publication_id|cpq_package|SyntheticInWorkerEvaluation/,
  );
  const prior = await evidence(),
    withdraw = packageDecision(pkg.view);
  await decidePackage(actors.p, pkg.command.id, "Withdraw", withdraw);
  await assert.rejects(
    previewAdoption(actors.p, run.id),
    code("CpqPackageReviewRequired"),
  );
  assert.deepEqual((await readRun(actors.p, run.id)).binding, run.binding);
  assert.deepEqual(
    (await adoptRun(actors.p, run.id, estimate.command)).receipt,
    estimate.receipt.receipt,
  );
  assert.deepEqual(
    await readOperation(actors.p, estimate.command.operation_id),
    estimate.receipt.receipt,
  );
  assert.equal(
    (
      await decidePackage(
        actors.publisher,
        pkg.command.id,
        "Publish",
        pkg.publish,
      )
    ).replayed,
    true,
  );
  assert.deepEqual(
    (await savePackage(actors.p, pkg.command)).receipt,
    await readOperation(actors.p, pkg.command.operation_id),
  );
  assert.ok((await evidence()).length > prior.length);
  await assert.rejects(
    saveRelease(actors.p, {
      ...(await releaseCommand(pkg.content.definition, [pkg.reference])),
    }),
    code("CpqPackageReviewRequired"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.cpq_revisions SET package_manifest=NULL WHERE id=$1",
      [view.current.id],
    ),
  );
});
test("fixture ownership is an acknowledgement; independent actors, exact hashes and atomic concurrent replay are enforced", async () => {
  const actors = await qualityActors();
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'cpq.author','Company',$3)",
    [CRM.workspace, actors.reviewer.actor_id, CRM.company],
  );
  const content = packageFixture(actors.reviewer.actor_id),
    command = {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      kind: "Rules",
      expected_version: 0,
      content,
    };
  const results = await Promise.all([
    savePackage(actors.p, command),
    savePackage(actors.p, command),
  ]);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  let v = await readPackage(actors.p, command.id);
  await assert.rejects(
    decidePackage(actors.p, command.id, "Attest", packageDecision(v)),
    code("RecordUnavailable"),
  );
  const attest = packageDecision(v);
  await decidePackage(actors.reviewer, command.id, "Attest", attest);
  v = await readPackage(actors.reviewer, command.id);
  assert.equal(v.package.state, "Tested");
  const snapshot = await evidence();
  await assert.rejects(
    decidePackage(actors.reviewer, command.id, "Review", {
      ...packageDecision(v),
      evidence_hash: v.events.at(-1)!.report_hash,
      outcome: "Approved",
    }),
    code("CpqIndependentReview"),
  );
  assert.deepEqual(await evidence(), snapshot);
  await assert.rejects(
    savePackage(actors.p, {
      ...command,
      content: { ...content, label: "changed" },
    }),
    code("OperationConflict"),
  );
  assert.equal(
    (await decidePackage(actors.reviewer, command.id, "Attest", attest))
      .replayed,
    true,
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.cpq_package_events WHERE package_id=$1", [
      command.id,
    ]),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.cpq_packages SET version=version+1,state='Published' WHERE id=$1",
      [command.id],
    ),
  );
  assert.equal(
    (await readPackage(actors.p, command.id)).package.state,
    "Tested",
  );
  const beforeFailure = await evidence();
  await database()
    .query(`CREATE FUNCTION ppo.package_test_outbox_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF NEW.payload->>'object_type'='CpqPackage' THEN RAISE EXCEPTION 'synthetic outbox failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER package_test_failure BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.package_test_outbox_failure()`);
  try {
    await assert.rejects(
      savePackage(actors.p, {
        ...command,
        operation_id: randomUUID(),
        expected_version: 2,
        content: { ...content, label: "SYN rollback successor" },
      }),
      /synthetic outbox failure/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER package_test_failure ON ppo.outbox_jobs; DROP FUNCTION ppo.package_test_outbox_failure()",
    );
  }
  assert.deepEqual(await evidence(), beforeFailure);
  const recovered = await readPackage(actors.p, command.id);
  assert.equal(recovered.package.version, 2);
  assert.equal(recovered.revisions.length, 1);
  await assert.rejects(
    database().query(
      "UPDATE ppo.cpq_packages SET owner_id=$2,version=version+1 WHERE id=$1",
      [command.id, actors.reviewer.actor_id],
    ),
    /Package identity, owner and sequential versions are retained/,
  );
  const competitors = await Promise.allSettled(
    ["A", "B"].map((label) =>
      savePackage(actors.p, {
        ...command,
        operation_id: randomUUID(),
        expected_version: 2,
        content: { ...content, label: `SYN competing successor ${label}` },
      }),
    ),
  );
  assert.equal(competitors.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    competitors.filter(
      (r) => r.status === "rejected" && r.reason.code === "VersionConflict",
    ).length,
    1,
  );
  const serial = await readPackage(actors.p, command.id);
  assert.equal(serial.package.version, 3);
  assert.equal(serial.revisions.length, 2);
  assert.equal(serial.events.length, 3);
});
test("failed workload evidence is retained; changed, missing and overlapping members refuse without side effects", async () => {
  const actors = await qualityActors(),
    content = packageFixture(actors.p.actor_id);
  content.workload.result_bytes = 1024;
  const command = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    kind: "Rules",
    expected_version: 0,
    content,
  };
  await savePackage(actors.p, command);
  let v = await readPackage(actors.p, command.id);
  await decidePackage(actors.p, command.id, "Attest", packageDecision(v));
  v = await readPackage(actors.p, command.id);
  assert.equal(v.package.state, "TestFailed");
  assert.equal(v.events.at(-1)!.report.passed, false);
  await assert.rejects(
    decidePackage(actors.reviewer, command.id, "Review", {
      ...packageDecision(v),
      evidence_hash: v.events.at(-1)!.report_hash,
      outcome: "Approved",
    }),
    code("CpqPackageReviewRequired"),
  );
  const pkg = await publishedFixture(actors),
    other = await publishedFixture(actors);
  const before = await evidence(),
    changed = structuredClone(pkg.content.definition);
  changed.rules[0].quantity = "count * 2";
  const repriced = structuredClone(pkg.content.definition);
  repriced.parts[0].tiers[0].unit_cost = "12.00";
  for (const command of [
    await releaseCommand(changed, [pkg.reference]),
    await releaseCommand(repriced, [pkg.reference]),
    await releaseCommand(pkg.content.definition, [
      pkg.reference,
      other.reference,
    ]),
  ])
    await assert.rejects(
      saveRelease(actors.p, command),
      code("CpqPackageReviewRequired"),
    );
  assert.deepEqual(await evidence(), before);
  const saved = await releaseCommand(pkg.content.definition, [pkg.reference]);
  await saveRelease(actors.p, saved);
  await assert.rejects(
    database().query(
      `INSERT INTO ppo.cpq_revisions(id,workspace_id,company_id,release_id,version,predecessor_id,definition,content_hash,reason,created_by,package_manifest)
     SELECT $1,workspace_id,company_id,release_id,version+1,id,$2,$3,reason,created_by,package_manifest FROM ppo.cpq_revisions WHERE release_id=$4`,
      [randomUUID(), changed, hash(changed), saved.id],
    ),
    /Exact complete package members required/,
  );
  assert.equal((await readRelease(actors.p, saved.id)).revisions.length, 1);
  await assert.rejects(
    saveRelease(actors.p, {
      ...saved,
      operation_id: randomUUID(),
      expected_version: 1,
      packages: undefined,
    }),
  );
  await savePackage(actors.p, {
    ...pkg.command,
    operation_id: randomUUID(),
    expected_version: 4,
    content: { ...pkg.content, label: "SYN revision 2" },
  });
  await assert.rejects(
    saveRelease(
      actors.p,
      await releaseCommand(pkg.content.definition, [pkg.reference]),
    ),
    code("CpqPackageReviewRequired"),
  );
  assert.equal(
    (await readPackage(actors.p, pkg.command.id)).revisions.length,
    2,
  );
});
test("schema 4 packages reuse exact Cost Sources and retain historical authority after source revision", async () => {
  const actors = await qualityActors(),
    refs = [
      await reviewedCost(actors.p),
      await reviewedCost(actors.p, "hour", "40"),
    ];
  const pkg = await publishedFixture(actors, costDefinition(refs));
  await saveRelease(
    actors.p,
    await releaseCommand(pkg.content.definition, [pkg.reference]),
  );
  await reviseCostSource(actors.p, refs[0].source_id, {
    ...crmBase(),
    expected_version: 3,
    content: { ...refs[0].content, title: "SYN successor awaiting review" },
  });
  await assert.rejects(
    saveRelease(
      actors.p,
      await releaseCommand(pkg.content.definition, [pkg.reference]),
    ),
  );
  assert.equal(
    (await readPackage(actors.p, pkg.command.id)).current.content_hash,
    pkg.reference.content_hash,
  );
  assert.equal(
    (
      await decidePackage(
        actors.publisher,
        pkg.command.id,
        "Publish",
        pkg.publish,
      )
    ).replayed,
    true,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.read'",
    [CRM.workspace, actors.publisher.actor_id],
  );
  await assert.rejects(
    readOperation(actors.publisher, pkg.publish.operation_id),
    code("RecordUnavailable"),
  );
});
test("company and actor scope hide package content and prevent wrong-company use", async () => {
  const actors = await qualityActors(),
    pkg = await publishedFixture(actors),
    outsider = (await createSession("technician")).principal;
  await assert.rejects(
    readPackage(outsider, pkg.command.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readPackage({ ...actors.p, workspace_id: randomUUID() }, pkg.command.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    saveRelease(actors.p, {
      ...(await releaseCommand(pkg.content.definition, [pkg.reference])),
      company_id: randomUUID(),
    }),
    code("RecordUnavailable"),
  );
  for (const capability of ["shared.read", "cpq.read", "cpq.author"])
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3) ON CONFLICT DO NOTHING",
      [CRM.workspace, actors.p.actor_id, CRM.companyB, capability],
    );
  // Authority in both real synthetic companies must not permit a cross-company binding.
  await assert.rejects(
    saveRelease(actors.p, {
      ...(await releaseCommand(pkg.content.definition, [pkg.reference])),
      company_id: CRM.companyB,
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    savePackage(actors.reviewer, {
      ...pkg.command,
      operation_id: randomUUID(),
      expected_version: 4,
    }),
    code("RecordUnavailable"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='cpq.review'",
    [CRM.workspace, actors.reviewer.actor_id],
  );
  await assert.rejects(
    saveRelease(
      actors.p,
      await releaseCommand(pkg.content.definition, [pkg.reference]),
    ),
    code("RecordUnavailable"),
  );
});
test("schema 3 table package and rule package compose exact members while legacy schemas remain unenrolled", async () => {
  const actors = await qualityActors(),
    d = definition({
      ...cpqDefinition(),
      schema_version: 3,
      design: {
        option_sets: [],
        structure: [],
        shared_capacity: [],
        decision_tables: [
          {
            key: "installation_choice",
            label: "SYN choice",
            hit_policy: "UNIQUE",
            required: true,
            columns: ["install"],
            rows: [
              {
                key: "yes",
                when: { op: "EQ", fact: "install", value: true },
                rules: ["install_sensors"],
                priority: 1,
              },
              {
                key: "no",
                when: { op: "EQ", fact: "install", value: false },
                rules: ["install_sensors"],
                priority: 2,
              },
            ],
          },
        ],
        pricing: { mode: "Catalog", percent: "0", allow_override: true },
      },
    });
  const rules = await publishedFixture(actors, d);
  for (const [actor, cap] of [
    [actors.reviewer, "cpq.author"],
    [actors.p, "cpq.review"],
  ] as const)
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3) ON CONFLICT DO NOTHING",
      [CRM.workspace, actor.actor_id, CRM.company, cap],
    );
  const tables = await publishedFixture(
    { p: actors.reviewer, reviewer: actors.p, publisher: actors.publisher },
    d,
    "Tables",
  );
  assert.notEqual(rules.view.package.owner_id, tables.view.package.owner_id);
  await assert.rejects(
    saveRelease(
      actors.p,
      await releaseCommand(rules.content.definition, [rules.reference]),
    ),
    code("CpqPackageReviewRequired"),
  );
  const cmd = await releaseCommand(rules.content.definition, [
    rules.reference,
    tables.reference,
  ]);
  await saveRelease(actors.p, cmd);
  assert.equal(
    (await readRelease(actors.p, cmd.id)).current.package_manifest!.length,
    2,
  );
  const legacy = await releaseCommand();
  await saveRelease(actors.p, legacy);
  assert.equal((await currentQuality(actors.p, legacy.id)).enrolled, false);
  assert.equal(
    (await readRelease(actors.p, legacy.id)).current.package_manifest,
    null,
  );
  await migrate();
  await seed();
  assert.equal(
    (await readPackage(actors.p, tables.command.id)).events.length,
    4,
  );
});
