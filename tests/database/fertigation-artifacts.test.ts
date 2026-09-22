import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { readOperation } from "../../src/shared/receipts";
import { digest } from "../../src/documents/store";
import {
  prepareOutput,
  readOutput,
  exportScope,
} from "../../src/estimating/fertigation/artifacts";
import {
  attachEvidence,
  readEvidence,
  listEvidence,
} from "../../src/estimating/fertigation/evidence";
import {
  recordReview,
  prepareHandover,
  acceptHandover,
  readReviewLedger,
} from "../../src/estimating/fertigation/review";
import { saveScope } from "../../src/estimating/fertigation/service";
import {
  readDiscoveryWorkspace,
  readDiscoveryRevision,
} from "../../src/estimating/discovery-workspaces";
import { readReceivedFertigation } from "../../src/estimating/fertigation/receiving-reads";
import { previewDiscoveryCosting } from "../../src/estimating/cost-basis-service";
import { readScope } from "../../src/estimating/fertigation/reads";
import {
  fertigationFixture,
  fertigationBase,
  saveCommand,
} from "../helpers/fertigation";
import { png } from "../helpers/field";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (value: string) => (e: unknown) =>
  (e as { code?: string }).code === value;
test("FN-T36/T37 immutable authenticated unresolved review cannot forge authority or follow a revised valve", async () => {
  const f = await fertigationFixture(),
    input = {
      ...fertigationBase(),
      expected_version: 1,
      revision_id: f.detail.revision.id,
      note: "SYN capture review only; supplier configuration and technical suitability unresolved",
    };
  await assert.rejects(
    recordReview(f.p, f.create.id, { ...input, reviewer_id: randomUUID() }),
    code("InvalidData"),
  );
  const result = await recordReview(f.p, f.create.id, input);
  assert.deepEqual(
    (await recordReview(f.p, f.create.id, input)).receipt,
    result.receipt,
  );
  assert.deepEqual(
    await readOperation(f.p, input.operation_id),
    result.receipt,
  );
  const ledger = await readReviewLedger(f.p, f.create.id);
  assert.equal(ledger.reviews[0].created_by, f.p.actor_id);
  assert.equal(ledger.engineering_approval, "not_configured");
  const change = saveCommand(f.detail);
  change.proposal.valves[0].design_flow_m3h = 4;
  await saveScope(f.p, f.create.id, change);
  const later = await readReviewLedger(f.p, f.create.id);
  assert.equal(later.reviews[0].revision_id, f.detail.revision.id);
  assert.notEqual(later.current_revision_id, f.detail.revision.id);
  await assert.rejects(
    database().query(
      "UPDATE ppo.fertigation_reviews SET note='rewrite' WHERE id=$1",
      [input.operation_id],
    ),
  );
});
test("FN-T45/T46 reports retain exact safe bytes through valve edits; replay and direct download reauthorise", async () => {
  const f = await fertigationFixture(),
    input = {
      ...fertigationBase(),
      expected_version: 1,
      revision_id: f.detail.revision.id,
      audience: "customer",
    };
  const review = {
    ...fertigationBase(),
    expected_version: 1,
    revision_id: f.detail.revision.id,
    note: "PRIVATE_REVIEW_CANARY",
  };
  await recordReview(f.p, f.create.id, review);
  const result = await prepareOutput(f.p, f.create.id, input),
    before = await readOutput(f.p, f.create.id, input.operation_id);
  assert.equal(digest(before.bytes), before.hash);
  assert.match(Buffer.from(before.bytes).toString(), /not for construction/);
  assert.ok(Buffer.from(before.bytes).toString().includes(review.operation_id));
  assert.ok(Buffer.from(before.bytes).toString().includes(f.p.actor_id));
  assert.match(
    Buffer.from(before.bytes).toString(),
    /No authenticated review|Reviewed; unresolved/,
  );
  assert.doesNotMatch(
    Buffer.from(before.bytes).toString(),
    /PRIVATE_REVIEW_CANARY/,
  );
  assert.deepEqual(
    (await prepareOutput(f.p, f.create.id, input)).receipt,
    result.receipt,
  );
  const change = saveCommand(f.detail);
  change.proposal.valves[0].label = "SYN changed valve";
  await saveScope(f.p, f.create.id, change);
  assert.deepEqual(
    (await readOutput(f.p, f.create.id, input.operation_id)).bytes,
    before.bytes,
  );
  const foreign = (await createSession("second-company")).principal;
  await assert.rejects(
    readOutput(foreign, f.create.id, input.operation_id),
    code("RecordUnavailable"),
  );
  const portable = await exportScope(
    f.p,
    f.create.id,
    f.detail.revision.id,
    "json",
  );
  assert.equal(
    JSON.parse(portable.body).basis.revision_id,
    f.detail.revision.id,
  );
});
test("FN-T38/T39 exact PNG evidence survives reconnect, rejects active content, stale finalisation and foreign access", async () => {
  const f = await fertigationFixture(),
    input = {
      ...fertigationBase(),
      expected_version: 1,
      revision_id: f.detail.revision.id,
      label: "SYN valve photograph",
      filename: "SYN-valve.png",
      source_revision: "SYN observation r01",
      attribution: "SYN fixture author",
      applicability: "SYN valve label observation; no engineering confirmation",
    },
    bytes = png();
  await attachEvidence(f.p, f.create.id, input, bytes);
  assert.equal(
    (await attachEvidence(f.p, f.create.id, input, bytes)).replayed,
    true,
  );
  await closeDatabase();
  assert.deepEqual(
    Buffer.from(
      (await readEvidence(f.p, f.create.id, input.operation_id)).bytes,
    ),
    bytes,
  );
  assert.equal(
    (await listEvidence(f.p, f.create.id)).items[0].sha256,
    digest(bytes),
  );
  await assert.rejects(
    attachEvidence(
      f.p,
      f.create.id,
      { ...input, ...fertigationBase() },
      Buffer.from('<svg onload="alert(1)"/>'),
    ),
    code("UnsupportedImage"),
  );
  const change = saveCommand(f.detail);
  change.proposal.valves[0].label = "SYN changed";
  change.proposal.evidence = [
    {
      id: randomUUID(),
      label: "SYN exact prepared PNG",
      kind: "document_reference",
      reference: `ppo-file:${input.operation_id}`,
      sha256: digest(bytes),
      source_revision: "SYN observation r01",
      captured_date: null,
      attribution: "SYN fixture author",
      applicability: "Label observation",
      notes: "",
    },
  ];
  const forged = structuredClone(change);
  forged.operation_id = randomUUID();
  forged.proposal.evidence[0].sha256 = "a".repeat(64);
  await assert.rejects(
    saveScope(f.p, f.create.id, forged),
    code("RecordUnavailable"),
  );
  await saveScope(f.p, f.create.id, change);
  await assert.rejects(
    attachEvidence(
      f.p,
      f.create.id,
      { ...input, ...fertigationBase(), expected_version: 2 },
      bytes,
    ),
    code("FertigationEvidenceStale"),
  );
  const foreign = (await createSession("second-company")).principal;
  await assert.rejects(
    readEvidence(foreign, f.create.id, input.operation_id),
    code("RecordUnavailable"),
  );
});
test("FN-T15/T48/T49/T50 notes-only receiving has one effect, retains Discovery bytes and creates no estimate", async () => {
  const f = await fertigationFixture(),
    revisionId = f.detail.revision.id,
    review = {
      ...fertigationBase(),
      expected_version: 1,
      revision_id: revisionId,
      note: "SYN exact capture reviewed; technical configuration remains unresolved",
    };
  await recordReview(f.p, f.create.id, review);
  const prepared = {
    ...fertigationBase(),
    expected_version: 1,
    revision_id: revisionId,
    review_id: review.operation_id,
  };
  await prepareHandover(f.p, f.create.id, prepared);
  const before = (
    await database().query(
      "SELECT to_jsonb(r) AS row FROM ppo.estimation_revisions r WHERE id=$1",
      [f.revisionId],
    )
  ).rows;
  const estimates = (
    await database().query("SELECT count(*)::integer AS n FROM ppo.estimates")
  ).rows[0].n;
  const input = {
    ...fertigationBase(),
    expected_version: 1,
    prepared_id: prepared.operation_id,
    expected_workspace_version: 1,
    receiving_revision_id: f.revisionId,
  };
  const result = await acceptHandover(f.p, f.create.id, input);
  assert.equal((await acceptHandover(f.p, f.create.id, input)).replayed, true);
  assert.deepEqual(
    await readOperation(f.p, input.operation_id),
    result.receipt,
  );
  await assert.rejects(
    acceptHandover(f.p, f.create.id, { ...input, ...fertigationBase() }),
    code("RelationshipConflict"),
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(r) AS row FROM ppo.estimation_revisions r WHERE id=$1",
        [f.revisionId],
      )
    ).rows,
    before,
  );
  assert.equal(
    (await database().query("SELECT count(*)::integer AS n FROM ppo.estimates"))
      .rows[0].n,
    estimates,
  );
  const ledger = await readReviewLedger(f.p, f.create.id);
  assert.equal(ledger.handovers.length, 2);
  assert.equal(
    ledger.handovers.filter((h) => h.receiving_revision_id).length,
    1,
  );
  const discovery = await readDiscoveryWorkspace(f.p, f.workspaceId),
    received = (await readReceivedFertigation(f.p, f.workspaceId, f.revisionId))
      .items;
  assert.equal(
    discovery.options[0].fertigation_handovers[0].id,
    input.operation_id,
  );
  assert.equal(received[0].content_hash, f.detail.revision.content_hash);
  assert.equal(received[0].adopted_for_costing, false);
  const costing = await previewDiscoveryCosting(f.p, f.workspaceId, {
    option_id: f.optionId,
    revision_id: f.revisionId,
  });
  assert.deepEqual(costing.fertigation_handovers, received);
  assert.equal(costing.current_saved, null);
  const immutable = await readDiscoveryRevision(
    f.p,
    f.workspaceId,
    f.revisionId,
  );
  assert.equal("fertigation_handovers" in immutable, false);
  const change = saveCommand(f.detail);
  change.proposal.valves[0].design_flow_m3h = 9;
  await saveScope(f.p, f.create.id, change);
  const historical = (
    await readReceivedFertigation(f.p, f.workspaceId, f.revisionId)
  ).items;
  assert.equal(historical[0].scope_current, false);
  assert.equal(historical[0].quantities.connected_flow.value, 2.5);
  await database().query(
    "UPDATE ppo.facilities SET version=version+1 WHERE id=$1",
    [f.create.coverage.facility_ids[0]],
  );
  assert.equal(
    (await readReceivedFertigation(f.p, f.workspaceId, f.revisionId)).items[0]
      .source_current,
    false,
  );
  const foreign = (await createSession("second-company")).principal;
  await assert.rejects(
    readReceivedFertigation(foreign, f.workspaceId, f.revisionId),
    code("RecordUnavailable"),
  );
});

test("FN-T45/T46/T47 retained customer and long internal PDFs use exact authorised scope and replay bytes", async () => {
  const f = await fertigationFixture(),
    change = saveCommand(f.detail);
  change.proposal.valves = Array.from({ length: 64 }, (_, i) => ({
    ...change.proposal.valves[0],
    id: randomUUID(),
    label: `SYN long report irrigation valve ${String(i + 1).padStart(3, "0")} with readable units`,
    notes: "PRIVATE_PDF_NOTE_CANARY",
  }));
  await saveScope(f.p, f.create.id, change);
  const detail = await readScope(f.p, f.create.id);
  await mkdir("verification-evidence/fertigation-reports", { recursive: true });
  for (const audience of ["customer", "internal"] as const) {
    const input = {
      ...fertigationBase(),
      expected_version: 2,
      revision_id: detail.revision.id,
      audience,
      format: "pdf",
    };
    await prepareOutput(f.p, f.create.id, input);
    const report = await readOutput(f.p, f.create.id, input.operation_id);
    assert.equal(report.mime, "application/pdf");
    assert.equal(Buffer.from(report.bytes).subarray(0, 5).toString(), "%PDF-");
    assert.equal(digest(report.bytes), report.hash);
    assert.equal((await prepareOutput(f.p, f.create.id, input)).replayed, true);
    assert.deepEqual(
      (await readOutput(f.p, f.create.id, input.operation_id)).bytes,
      report.bytes,
    );
    await writeFile(
      `verification-evidence/fertigation-reports/${audience}.pdf`,
      report.bytes,
    );
  }
});
