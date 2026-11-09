import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  commandClaims,
  readClaims,
} from "../../src/projects/commercial/claims";
import { commandCommercial } from "../../src/projects/commercial/commands";
import { readOperation } from "../../src/shared/receipts";
import {
  commercialFixture,
  approvedBasis,
  commercialAction,
  variation,
} from "../helpers/project-commercial";
import { crmBase } from "../helpers/crm";
import { recordFinding } from "../../src/library/commands";
import { readDocument } from "../../src/library/reads";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
const action = (
  basis_id: string,
  expected_version: number,
  action: string,
) => ({ ...crmBase(), basis_id, expected_version, action });
async function fixture() {
  const f = await commercialFixture();
  await approvedBasis(f);
  const milestones = [
    {
      id: randomUUID(),
      title: "Acceptance",
      trigger: "Reviewed contract acceptance",
      amount: "105.00",
    },
    {
      id: randomUUID(),
      title: "Delivery",
      trigger: "Reviewed delivery evidence",
      amount: "245.00",
    },
  ];
  const save = { ...action(f.create.id, 0, "Save"), milestones };
  return { ...f, milestones, save };
}
async function approved(f: Awaited<ReturnType<typeof fixture>>) {
  await commandClaims(f.owner, f.project.id, f.save);
  await commandClaims(f.owner, f.project.id, action(f.create.id, 1, "Submit"));
  return commandClaims(
    f.reviewer,
    f.project.id,
    action(f.create.id, 2, "Approve"),
  );
}
function completion(f: Awaited<ReturnType<typeof fixture>>, v = 3) {
  return {
    ...action(f.create.id, v, "RecordEvidence"),
    completion: {
      kind: "Milestone",
      target_id: f.milestones[0].id,
      target_version: 1,
      document_id: f.document.id,
      revision_id: f.document.revision_id,
      review_id: f.options.source.input.document_review_id,
      document_version: f.options.source.input.document_version,
      occurred_at: "2026-10-01T00:00:00.000Z",
      explanation: "SYN reviewed document substantiates acceptance",
    },
  };
}
test("B2 native approved basis -> independent schedule -> exact milestone/variation evidence; no Finance effects and repeat-safe receipts", async () => {
  const f = await fixture();
  await approved(f);
  const input = completion(f),
    result = await commandClaims(f.owner, f.project.id, input);
  const v = variation(f, "12.34", "12.34");
  await commandCommercial(f.owner, f.project.id, v);
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(v.id, 1, "Submit"),
  );
  await commandCommercial(f.reviewer, f.project.id, {
    ...commercialAction(v.id, 2, "Decide"),
    outcome: "Approved",
  });
  await commandClaims(f.owner, f.project.id, {
    ...completion(f, 4),
    completion: {
      ...input.completion,
      kind: "Variation",
      target_id: v.id,
      target_version: 3,
    },
  });
  const read = await readClaims(f.owner, f.project.id, {
    basis_id: f.create.id,
  });
  assert.equal(read.state, "Approved");
  assert.equal(read.version, 5);
  assert.deepEqual(read.milestones, f.milestones);
  assert.deepEqual(read.completions.map((e) => e.amount).sort(), [
    "105.00",
    "12.34",
  ]);
  assert.ok(read.completions.every((e) => e.eligible_for_claim));
  assert.equal(read.finance_processing_available, false);
  assert.equal(
    (await database().query("SELECT count(*) FROM ppo.finance_handoffs"))
      .rows[0].count,
    "0",
  );
  await migrate();
  await seed();
  await closeDatabase();
  assert.deepEqual(
    (await commandClaims(f.owner, f.project.id, input)).receipt,
    result.receipt,
  );
  assert.deepEqual(
    await readOperation(f.owner, input.operation_id),
    result.receipt,
  );
  await assert.rejects(
    commandClaims(f.owner, f.project.id, {
      ...input,
      reason: "Different replay payload",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    commandClaims(f.owner, f.project.id, {
      ...f.save,
      ...action(f.create.id, 5, "Save"),
    }),
    code("ClaimScheduleInUse"),
  );
});
test("B2 exact totals, independent review, stale concurrency and immutable evidence graph", async () => {
  const f = await fixture();
  await assert.rejects(
    commandClaims(f.owner, f.project.id, {
      ...f.save,
      milestones: [{ ...f.milestones[0], amount: "350.01" }],
    }),
    code("ClaimScheduleTotal"),
  );
  await commandClaims(f.owner, f.project.id, f.save);
  const results = await Promise.allSettled(
    [1, 2].map(() =>
      commandClaims(f.owner, f.project.id, action(f.create.id, 1, "Submit")),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.ok(
    results.some(
      (r) => r.status === "rejected" && code("VersionConflict")(r.reason),
    ),
  );
  await assert.rejects(
    commandClaims(f.owner, f.project.id, action(f.create.id, 2, "Approve")),
    code("IndependentReviewRequired"),
  );
  await commandClaims(
    f.reviewer,
    f.project.id,
    action(f.create.id, 2, "Return"),
  );
  await commandClaims(f.owner, f.project.id, {
    ...f.save,
    ...action(f.create.id, 3, "Save"),
  });
  await commandClaims(f.owner, f.project.id, action(f.create.id, 4, "Submit"));
  await commandClaims(
    f.reviewer,
    f.project.id,
    action(f.create.id, 5, "Approve"),
  );
  assert.equal(
    (await readClaims(f.owner, f.project.id, { basis_id: f.create.id }))
      .schedule_version,
    4,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.project_claim_events SET state='Approved' WHERE basis_id=$1",
      [f.create.id],
    ),
  );
  await assert.rejects(
    transaction((c) =>
      c.query(
        `INSERT INTO ppo.project_claim_events(workspace_id,basis_id,version,command,state,schedule_version,milestones,completion,reason,created_by,operation_id,created_at)
    SELECT workspace_id,basis_id,7,'Save','Draft',7,milestones,NULL,reason,created_by,$2,created_at
    FROM ppo.project_claim_events WHERE basis_id=$1 AND version=1`,
        [f.create.id, randomUUID()],
      ),
    ),
    code("23514"),
  );
});
test("B2 original recovery rechecks permissions; current evidence drift holds eligibility without erasing originals", async () => {
  const f = await fixture();
  await approved(f);
  const input = completion(f),
    saved = await commandClaims(f.owner, f.project.id, input);
  const other = (await createSession("second-company")).principal;
  await assert.rejects(
    readClaims(other, f.project.id, { basis_id: f.create.id }),
    code("RecordUnavailable"),
  );
  const d = await readDocument(f.owner, f.document.id);
  await recordFinding(f.owner, f.document.id, {
    ...crmBase(),
    expected_version: d.document.version,
    revision_id: d.revision.id,
    finding_id: randomUUID(),
    action: "Open",
    text: "SYN missing acceptance evidence",
    owner_id: f.owner.actor_id,
    due_date: "2031-10-01",
  });
  // The completion uses the same document as the basis; source and evidence become Held.
  const read = await readClaims(f.owner, f.project.id, {
    basis_id: f.create.id,
  });
  assert.equal(read.completions[0].eligible_for_claim, false);
  assert.deepEqual(
    (await commandClaims(f.owner, f.project.id, input)).receipt,
    saved.receipt,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='project.commercial.prepare'",
    [f.owner.actor_id],
  );
  await assert.rejects(commandClaims(f.owner, f.project.id, input));
  await assert.rejects(readOperation(f.owner, input.operation_id));
});
test("B2 refuses mismatched targets, unreached/negative variations and future or unrelated evidence", async () => {
  const f = await fixture();
  await approved(f);
  const input = completion(f);
  await assert.rejects(
    commandClaims(f.owner, f.project.id, {
      ...input,
      completion: { ...input.completion, target_version: 2 },
    }),
    code("ClaimMilestoneChanged"),
  );
  await assert.rejects(
    commandClaims(f.owner, f.project.id, {
      ...input,
      completion: { ...input.completion, occurred_at: "2099-01-01T00:00:00Z" },
    }),
    code("FutureClaimEvidence"),
  );
  await assert.rejects(
    commandClaims(f.owner, f.project.id, {
      ...input,
      completion: { ...input.completion, document_id: randomUUID() },
    }),
  );
  const v = variation(f, "-1.00", "-1.00");
  await commandCommercial(f.owner, f.project.id, v);
  const vi = {
    ...input,
    completion: {
      ...input.completion,
      kind: "Variation",
      target_id: v.id,
      target_version: 3,
    },
  };
  await assert.rejects(
    commandClaims(f.owner, f.project.id, vi),
    code("ApprovedVariationRequired"),
  );
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(v.id, 1, "Submit"),
  );
  await commandCommercial(f.reviewer, f.project.id, {
    ...commercialAction(v.id, 2, "Decide"),
    outcome: "Approved",
  });
  await assert.rejects(
    commandClaims(f.owner, f.project.id, vi),
    code("ClaimCorrectionPolicyRequired"),
  );
});
