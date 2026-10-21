import { saveDraft, readDraft } from "../../src/cpq/drafts";
import { createProject } from "../../src/projects/service";
import { projectInput } from "../helpers/projects";
import { createEngineeringRequest } from "../../src/engineering/service";
import { engineeringInput } from "../helpers/engineering";
import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import {
  createDocument,
  reviseDocument,
  recordFinding,
  reviewDocument,
  linkDocument,
  withdrawDocument,
  recoverDocument,
} from "../../src/library/commands";
import {
  readDocument,
  listDocuments,
  documentUsage,
  linkedDocuments,
  documentHistory,
  downloadDocument,
} from "../../src/library/reads";
import { readOperation } from "../../src/shared/receipts";
import {
  librarySetup,
  libraryInput,
  successor,
  base,
  CRM,
  grantLibrary,
} from "../helpers/library";
import { withdrawPack } from "../../src/documents/packs";
import { issued } from "../helpers/packs";
import { reportIssued } from "../helpers/reports";
import { digest } from "../../src/documents/store";
import { withWorkingCompany } from "../../src/platform/working-company";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const action = (revision_id: string, expected_version: number) => ({
  ...base(),
  revision_id,
  expected_version,
});
const review = (revision_id: string, expected_version: number) => ({
  ...action(revision_id, expected_version),
  outcome: "Reviewed",
  purpose: "SYN internal reference use",
  rationale: "SYN exact content and findings inspected.",
});
test("DK-B01 persisted identity, exact review, successor, retained links, history and original receipts", async () => {
  const { p, reviewer } = await librarySetup(),
    input = libraryInput(p.actor_id),
    created = await createDocument(p, input);
  assert.equal(created.receipt.record_version, 1);
  assert.match(
    (await readDocument(p, input.id)).document.display_number,
    /^SYN-PPO-DOC-/,
  );
  assert.deepEqual((await createDocument(p, input)).receipt, created.receipt);
  assert.deepEqual(await readOperation(p, input.operation_id), created.receipt);
  const decision = review(input.revision_id, 1);
  await assert.rejects(
    reviewDocument(p, input.id, decision),
    code("IndependentReviewRequired"),
  );
  const reviewed = await reviewDocument(reviewer, input.id, decision);
  assert.equal(
    (await readDocument(p, input.id)).eligible_for_current_use,
    true,
  );
  const link = {
    ...action(input.revision_id, 2),
    action: "Add",
    link_id: randomUUID(),
    target_kind: "Site",
    target_id: CRM.site,
    purpose: "SYN reference for site context",
  };
  const linked = await linkDocument(p, input.id, link);
  const next = successor(input, 3);
  await reviseDocument(p, input.id, next);
  const latest = await readDocument(p, input.id);
  assert.equal(latest.review_state, "Unreviewed");
  assert.equal(latest.revision.revision, 2);
  assert.equal(
    (await readDocument(p, input.id, { revision_id: input.revision_id }))
      .review_state,
    "Reviewed",
  );
  assert.equal(
    (await downloadDocument(p, input.id, input.revision_id)).bytes.toString(),
    input.source.text,
  );
  assert.equal(
    (await downloadDocument(p, input.id, next.revision_id)).bytes.toString(),
    next.source.text,
  );
  const usage = await documentUsage(p, input.id);
  assert.equal(usage.items[0].revision_id, input.revision_id);
  assert.equal(usage.items[0].needs_revision_assessment, true);
  const linkedRead = await linkedDocuments(p, {
    target_kind: "Site",
    target_id: CRM.site,
  });
  assert.equal(linkedRead.items[0].revision.id, input.revision_id);
  assert.equal(linkedRead.items[0].library_current, false);
  assert.deepEqual(
    (await linkDocument(p, input.id, link)).receipt,
    linked.receipt,
  );
  assert.deepEqual(
    (await reviewDocument(reviewer, input.id, decision)).receipt,
    reviewed.receipt,
  );
  const page = await documentHistory(p, input.id, { limit: "2" });
  assert.equal(page.items.length, 2);
  assert.equal(page.next_before, 3);
  const rest = await documentHistory(p, input.id, {
    before: String(page.next_before),
  });
  assert.deepEqual(
    rest.items.map((x) => x.command),
    ["Review", "Create"],
  );
  assert.ok(!JSON.stringify(page).includes("store_key"));
  await withdrawDocument(p, input.id, action(next.revision_id, 4));
  assert.equal((await listDocuments(p)).items.length, 0);
  assert.equal(
    (await listDocuments(p, { state: "Withdrawn" })).items.length,
    1,
  );
  assert.equal(
    (await readDocument(p, input.id)).eligible_for_current_use,
    false,
  );
  await assert.rejects(
    reviseDocument(p, input.id, {
      ...successor(input, 5),
      observed_revision_id: next.revision_id,
    }),
    code("DocumentWithdrawn"),
  );
  assert.deepEqual(await readOperation(p, input.operation_id), created.receipt);
  assert.deepEqual((await createDocument(p, input)).receipt, created.receipt);
  await linkDocument(p, input.id, {
    ...action(input.revision_id, 5),
    action: "Retire",
    link_id: link.link_id,
  });
  assert.ok((await documentUsage(p, input.id)).items[0].retired_at);
});
test("DK-B02 findings require response then independent acceptance; later finding invalidates reviewed current use", async () => {
  const { p, reviewer } = await librarySetup(),
    input = libraryInput(p.actor_id);
  await createDocument(p, input);
  const open = {
    ...action(input.revision_id, 1),
    action: "Open",
    finding_id: randomUUID(),
    text: "SYN confirm inspection limitation",
    owner_id: p.actor_id,
    due_date: "2026-10-20",
  };
  await recordFinding(p, input.id, open);
  assert.equal(
    (await readDocument(p, input.id)).findings[0].due_date,
    open.due_date,
  );
  await assert.rejects(
    reviewDocument(reviewer, input.id, review(input.revision_id, 2)),
    code("FindingsUnresolved"),
  );
  await assert.rejects(
    recordFinding(reviewer, input.id, {
      ...action(input.revision_id, 2),
      action: "Accept",
      finding_id: open.finding_id,
      text: "SYN premature",
    }),
    code("FindingState"),
  );
  await assert.rejects(
    recordFinding(reviewer, input.id, {
      ...action(input.revision_id, 2),
      action: "Respond",
      finding_id: open.finding_id,
      text: "SYN wrong owner",
    }),
    code("RecordUnavailable"),
  );
  await recordFinding(p, input.id, {
    ...action(input.revision_id, 2),
    action: "Respond",
    finding_id: open.finding_id,
    text: "SYN inspection excludes intervention.",
  });
  assert.equal(
    (await readDocument(p, input.id)).findings[0].state,
    "AwaitingReview",
  );
  await assert.rejects(
    recordFinding(p, input.id, {
      ...action(input.revision_id, 3),
      action: "Accept",
      finding_id: open.finding_id,
      text: "SYN self acceptance",
    }),
    code("IndependentReviewRequired"),
  );
  await recordFinding(reviewer, input.id, {
    ...action(input.revision_id, 3),
    action: "Accept",
    finding_id: open.finding_id,
    text: "SYN response independently checked.",
  });
  await reviewDocument(reviewer, input.id, review(input.revision_id, 4));
  assert.equal(
    (await readDocument(p, input.id)).eligible_for_current_use,
    true,
  );
  await assert.rejects(
    reviewDocument(reviewer, input.id, review(input.revision_id, 5)),
    code("DecisionRetained"),
  );
  const late = {
    ...open,
    ...action(input.revision_id, 5),
    finding_id: randomUUID(),
    text: "SYN later applicability question",
  };
  await recordFinding(p, input.id, late);
  assert.equal(
    (await readDocument(p, input.id)).review_state,
    "ReviewOutdated",
  );
  await recordFinding(p, input.id, {
    ...action(input.revision_id, 6),
    action: "Respond",
    finding_id: late.finding_id,
    text: "SYN clarification",
  });
  await recordFinding(reviewer, input.id, {
    ...action(input.revision_id, 7),
    action: "Accept",
    finding_id: late.finding_id,
    text: "SYN checked",
  });
  assert.equal(
    (await readDocument(p, input.id)).eligible_for_current_use,
    false,
  );
  const events = await documentHistory(p, input.id);
  assert.equal(events.items.filter((e) => e.command === "Review").length, 1);
});
test("DK-B03 default deny, company and workspace scope, owner checks, stale races and changed operation content", async () => {
  const { p, reviewer, observer } = await librarySetup(),
    input = libraryInput(p.actor_id);
  await assert.rejects(
    createDocument(observer, input),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    createDocument(p, { ...input, organisation_id: CRM.orgB }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    createDocument(p, { ...input, owner_id: observer.actor_id }),
    code("RecordUnavailable"),
  );
  const created = await createDocument(p, input);
  const other = (await createSession("second-company")).principal,
    foreign = (await createSession("other-workspace")).principal;
  for (const who of [other, foreign]) {
    assert.deepEqual((await listDocuments(who)).items, []);
    await assert.rejects(
      readDocument(who, input.id),
      code("RecordUnavailable"),
    );
    await assert.rejects(
      downloadDocument(who, input.id, input.revision_id),
      code("RecordUnavailable"),
    );
  }
  await assert.rejects(
    createDocument(p, { ...input, title: "SYN changed retry" }),
    code("OperationConflict"),
  );
  const outcomes = await Promise.allSettled([
    reviseDocument(p, input.id, successor(input, 1)),
    reviewDocument(reviewer, input.id, review(input.revision_id, 1)),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    outcomes.filter(
      (x) => x.status === "rejected" && x.reason.code === "StaleVersion",
    ).length,
    1,
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='document.register'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(
    readOperation(p, created.receipt.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(createDocument(p, input), code("RecordUnavailable"));
  assert.equal((await readDocument(p, input.id)).document.id, input.id);
  await grantLibrary(p);
  await withWorkingCompany(p.actor_id, CRM.companyB, async () => {
    await assert.rejects(readDocument(p, input.id), code("RecordUnavailable"));
    assert.equal((await listDocuments(p)).items.length, 0);
  });
});
test("DK-B04 exact missing-byte recovery retains identity and refuses replacements, including historical withdrawn content", async () => {
  const { p, reviewer } = await librarySetup(),
    input = libraryInput(p.actor_id);
  const created = await createDocument(p, input);
  const path = join(
    process.env.PPO_DOCUMENT_DIRECTORY ??
      join(homedir(), ".ppo-synthetic-documents"),
    p.workspace_id,
    input.operation_id,
  );
  await unlink(path);
  const missing = await readDocument(p, input.id);
  assert.equal(missing.availability, "ExactUnavailable");
  await assert.rejects(
    downloadDocument(p, input.id, input.revision_id),
    code("ExactDocumentUnavailable"),
  );
  await assert.rejects(
    reviewDocument(reviewer, input.id, review(input.revision_id, 1)),
    code("ExactDocumentUnavailable"),
  );
  assert.deepEqual((await createDocument(p, input)).receipt, created.receipt);
  await assert.rejects(
    recoverDocument(p, input.id, {
      ...action(input.revision_id, 1),
      text: "SYN replacement",
    }),
    code("RecoveryMismatch"),
  );
  const next = successor(input, 1);
  await reviseDocument(p, input.id, next);
  await withdrawDocument(p, input.id, action(next.revision_id, 2));
  const command = { ...action(input.revision_id, 3), text: input.source.text };
  const recovered = await recoverDocument(p, input.id, command);
  assert.deepEqual(
    (await recoverDocument(p, input.id, command)).receipt,
    recovered.receipt,
  );
  assert.equal(
    (await downloadDocument(p, input.id, input.revision_id)).bytes.toString(),
    input.source.text,
  );
  assert.equal((await readDocument(p, input.id)).document.state, "Withdrawn");
  assert.equal(
    (await rows("SELECT count(*) FROM ppo.library_revisions"))[0].count,
    "2",
  );
});
test("DK-B05 typed immutable SQL evidence rejects unreceipted changes and independent-review bypass", async () => {
  const { p, reviewer } = await librarySetup(),
    input = libraryInput(p.actor_id);
  await createDocument(p, input);
  await assert.rejects(
    rows(
      "UPDATE ppo.library_documents SET version=version+1,state='Withdrawn' WHERE id=$1",
      [input.id],
    ),
    code("23514"),
  );
  await assert.rejects(
    rows(
      "UPDATE ppo.library_revisions SET title='SYN overwritten' WHERE id=$1",
      [input.revision_id],
    ),
  );
  await assert.rejects(
    rows("DELETE FROM ppo.library_events WHERE document_id=$1", [input.id]),
  );
  await assert.rejects(
    rows(
      `INSERT INTO ppo.library_reviews(id,workspace_id,document_id,revision_id,document_version,outcome,purpose,rationale,content_hash,findings_snapshot,reviewer_id)
    VALUES($1,$2,$3,$4,2,'Reviewed','SYN forged','SYN forged',$5,'[]',$6)`,
      [
        randomUUID(),
        p.workspace_id,
        input.id,
        input.revision_id,
        digest(input.source.text),
        p.actor_id,
      ],
    ),
    code("23514"),
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.library_documents SET version=2,updated_by=$3 WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, input.id, reviewer.actor_id],
      );
      await c.query(
        `INSERT INTO ppo.library_events(id,workspace_id,document_id,revision_id,document_version,command,actor_id,operation_id,reason,document_snapshot,payload)
      SELECT $1,$2,$3,$4,2,'Withdraw',$5,$6,'SYN forged',to_jsonb(d),'{}' FROM ppo.library_documents d WHERE id=$3`,
        [
          randomUUID(),
          p.workspace_id,
          input.id,
          input.revision_id,
          reviewer.actor_id,
          randomUUID(),
        ],
      );
    }),
    code("23514"),
  );
  assert.equal((await readDocument(p, input.id)).document.version, 1);
});
test("DK-B06 scoped declared usage is filtered and cannot retarget itself to a successor", async () => {
  const { p, observer } = await librarySetup(),
    input = libraryInput(p.actor_id);
  await createDocument(p, input);
  const project = projectInput();
  await createProject(p, project);
  const engineering = engineeringInput(project.id);
  await createEngineeringRequest(p, engineering);
  const command = {
    ...action(input.revision_id, 1),
    action: "Add",
    link_id: randomUUID(),
    target_kind: "Project",
    target_id: project.id,
    purpose: "SYN equipment reference",
  };
  await linkDocument(p, input.id, command);
  await linkDocument(p, input.id, {
    ...action(input.revision_id, 2),
    action: "Add",
    link_id: randomUUID(),
    target_kind: "EngineeringPackage",
    target_id: engineering.id,
    purpose: "SYN engineering reference",
  });
  assert.equal((await documentUsage(p, input.id)).items.length, 2);
  await assert.rejects(
    linkedDocuments(observer, {
      target_kind: "Project",
      target_id: project.id,
    }),
    code("RecordUnavailable"),
  );
  assert.equal(
    (
      await linkedDocuments(p, {
        target_kind: "EngineeringPackage",
        target_id: engineering.id,
      })
    ).items[0].document.id,
    input.id,
  );
  const usage = await documentUsage(observer, input.id);
  assert.equal(usage.coverage, "Partial");
  assert.deepEqual(usage.items, []);
  assert.ok(!JSON.stringify(usage).includes(project.id));
  assert.ok(
    !JSON.stringify(await documentHistory(observer, input.id)).includes(
      project.id,
    ),
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(
    readOperation(p, command.operation_id),
    code("RecordUnavailable"),
  );
});
test("DK-B07 existing Job Pack issue bytes and native authority are reused; no library grant bypasses source scope", async () => {
  const issuedPack = await issued(),
    { p } = await librarySetup(),
    input = {
      ...libraryInput(p.actor_id),
      source: { kind: "JobPackIssue", issue_id: issuedPack.issue_id },
    };
  await createDocument(p, input);
  const exact = await downloadDocument(p, input.id, input.revision_id);
  assert.equal(
    digest(exact.bytes),
    (
      await rows(
        "SELECT manifest->>'pdf_hash' AS hash FROM ppo.pack_issues WHERE id=$1",
        [issuedPack.issue_id],
      )
    )[0].hash,
  );
  const native = (await readDocument(p, input.id)).revision.source;
  assert.equal(native.kind, "JobPackIssue");
  assert.equal(native.issue_id, issuedPack.issue_id);
  await withdrawPack(p, issuedPack.pack.id, {
    ...base(),
    expected_version: issuedPack.pack.version,
  });
  assert.equal((await readDocument(p, input.id)).source_current, false);
  assert.equal(
    digest((await downloadDocument(p, input.id, input.revision_id)).bytes),
    native.content_hash,
  );
  await assert.rejects(
    linkDocument(p, input.id, {
      ...action(input.revision_id, 1),
      action: "Add",
      link_id: randomUUID(),
      target_kind: "Site",
      target_id: CRM.site,
      purpose: "SYN stale source",
    }),
    code("SourceSuperseded"),
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='pack.read'",
    [p.workspace_id, p.actor_id],
  );
  assert.equal((await listDocuments(p)).items.length, 0);
  await assert.rejects(readDocument(p, input.id), code("RecordUnavailable"));
  await assert.rejects(
    readOperation(p, input.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    downloadDocument(p, input.id, input.revision_id),
    code("RecordUnavailable"),
  );
});
test("DK-B08 existing Service Report issue exact PDF is linked without rendering a replacement", async () => {
  const issuedReport = await reportIssued(),
    { p } = await librarySetup();
  const issue = (
    await rows(
      "SELECT * FROM ppo.report_issues WHERE workspace_id=$1 AND report_id=$2",
      [p.workspace_id, issuedReport.report.id],
    )
  )[0];
  const input = {
    ...libraryInput(p.actor_id),
    source: { kind: "ReportIssue", issue_id: issue.id },
  };
  await createDocument(p, input);
  await grantLibrary(issuedReport.p);
  const captured = (
    await rows("SELECT source FROM ppo.library_revisions WHERE id=$1", [
      input.revision_id,
    ])
  )[0].source;
  assert.equal(captured.author_id, issuedReport.p.actor_id);
  await assert.rejects(
    reviewDocument(issuedReport.p, input.id, review(input.revision_id, 1)),
    code("IndependentReviewRequired"),
  );
  const before = await rows(
    "SELECT id FROM ppo.report_render_jobs ORDER BY id",
  );
  assert.equal(
    digest((await downloadDocument(p, input.id, input.revision_id)).bytes),
    issue.manifest.pdf_hash,
  );
  assert.deepEqual(
    await rows("SELECT id FROM ppo.report_render_jobs ORDER BY id"),
    before,
  );
  await assert.rejects(
    recoverDocument(p, input.id, {
      ...action(input.revision_id, 1),
      text: "SYN no native regeneration",
    }),
    code("NativeRecoveryRequired"),
  );
});
for (const through of [88, 89])
  test(`DK-B09 populated 00${through} upgrade preserves originals through 0096 and reapplication is inert`, async () => {
    await recoverSchema();
    await database().query("DROP TABLE public.ppo_migrations");
    await migrate(through);
    await seed(through);
    const author = (await createSession("coordinator")).principal;
    const draftInput = {
      ...base(),
      id: randomUUID(),
      company_id: CRM.company,
      kind: "Rules",
      label: "SYN retained CPQ draft",
      expected_version: 0,
      content: { pending_rule: "ceil(" },
    };
    if (through === 89) {
      await grantLibrary(author, ["cpq.read", "cpq.author"]);
      await saveDraft(author, draftInput);
    }
    const priorDraft =
      through === 89 ? await readDraft(author, draftInput.id) : null;
    const tables = [
      "business_identities",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
      "permission_grants",
      "users",
      "seed_receipts",
      "project_calendar_revisions",
      ...(through === 89 ? ["cpq_drafts", "cpq_draft_history"] : []),
    ];
    const snapshot = async () => {
      const result = [];
      for (const t of tables)
        result.push(
          await rows(
            // Seeds 107 (SYN-PPO-P04 v2, field readiness gate) and 108 (Conversations grants) are the only later seeds; readiness-gate.test.ts and conversations-upgrade.test.ts prove them.
            `SELECT to_jsonb(t) AS value FROM ppo.${t} t${t === "seed_receipts" ? " WHERE t.version NOT IN (107,108)" : t === "permission_grants" ? " WHERE t.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(t)::text`,
          ),
        );
      return result;
    };
    const before = await snapshot(),
      ledger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      );
    await migrate();
    await seed();
    assert.deepEqual(await snapshot(), before);
    const after = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    );
    assert.deepEqual(
      after.filter((x) => x.version <= through),
      ledger,
    );
    assert.deepEqual(
      after.filter((x) => x.version > through).map((x) => x.version),
      through === 88 ? [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 114] : [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 114],
    );
    assert.equal(
      (await rows("SELECT count(*) FROM ppo.library_documents"))[0].count,
      "0",
    );
    if (priorDraft) {
      assert.deepEqual(await readDraft(author, draftInput.id), priorDraft);
      assert.equal((await saveDraft(author, draftInput)).replayed, true);
      await saveDraft(author, { ...draftInput, ...base(), id: randomUUID() });
    }
    const { p } = await librarySetup(),
      input = libraryInput(p.actor_id);
    const created = await createDocument(p, input);
    const populated = await snapshot();
    await migrate();
    await seed();
    assert.deepEqual(await snapshot(), populated);
    assert.deepEqual(
      await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
      after,
    );
    assert.deepEqual(
      await readOperation(p, input.operation_id),
      created.receipt,
    );
  });

test("DK-B10 current register paging and source-exception filters use only permitted matches", async () => {
  const { p, reviewer } = await librarySetup(),
    inputs = [];
  for (let i = 0; i < 4; i++) {
    const input = { ...libraryInput(p.actor_id), title: "SYN paging " + i };
    await createDocument(p, input);
    inputs.push(input);
  }
  inputs.sort((a, b) => a.id.localeCompare(b.id));
  await reviewDocument(reviewer, inputs[0].id, {
    ...review(inputs[0].revision_id, 1),
    outcome: "Returned",
  });
  const first = await listDocuments(p, { q: "SYN paging", limit: "2" });
  assert.deepEqual(
    first.items.map((x) => x.document.id),
    inputs.slice(0, 2).map((x) => x.id),
  );
  const second = await listDocuments(p, {
    q: "SYN paging",
    limit: "2",
    after: first.next_after!,
  });
  assert.deepEqual(
    second.items.map((x) => x.document.id),
    inputs.slice(2).map((x) => x.id),
  );
  assert.equal(second.next_after, null);
  assert.equal(
    (await listDocuments(p, { review_state: "Returned" })).items[0].document.id,
    inputs[0].id,
  );
  const path = join(
    process.env.PPO_DOCUMENT_DIRECTORY ??
      join(homedir(), ".ppo-synthetic-documents"),
    p.workspace_id,
    inputs[1].operation_id,
  );
  await unlink(path);
  assert.deepEqual(
    (await listDocuments(p, { availability: "ExactUnavailable" })).items.map(
      (x) => x.document.id,
    ),
    [inputs[1].id],
  );
  assert.equal(
    (await listDocuments(p, { availability: "Available" })).items.length,
    3,
  );
  assert.equal(
    (await listDocuments(p, { owner_id: reviewer.actor_id })).items.length,
    0,
  );
  const siteReader = (await createSession("site-observer")).principal;
  await grantLibrary(siteReader, ["document.read"]);
  await rows(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$3,site_id=$3 WHERE workspace_id=$1 AND user_id=$2 AND capability='document.read'",
    [p.workspace_id, siteReader.actor_id, CRM.site],
  );
  assert.equal((await listDocuments(siteReader)).items.length, 4);
  const companyOnly = { ...libraryInput(p.actor_id), site_id: null };
  await createDocument(p, companyOnly);
  await assert.rejects(
    readDocument(siteReader, companyOnly.id),
    code("RecordUnavailable"),
  );
});

test("DK-B11 storage success followed by database rollback preserves the original retry and refuses changed content", async () => {
  const { p } = await librarySetup(),
    input = libraryInput(p.actor_id);
  await rows(
    `CREATE FUNCTION ppo.library_test_refuse_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.operation_id='${input.operation_id}'::uuid THEN RAISE EXCEPTION 'SYN controlled receipt refusal' USING ERRCODE='23514'; END IF; RETURN NEW; END $$`,
  );
  await rows(
    "CREATE TRIGGER library_test_refuse_receipt BEFORE INSERT ON ppo.operation_receipts FOR EACH ROW EXECUTE FUNCTION ppo.library_test_refuse_receipt()",
  );
  try {
    await assert.rejects(createDocument(p, input), code("InvalidRelationship"));
    assert.equal(
      (
        await rows("SELECT count(*) FROM ppo.library_documents WHERE id=$1", [
          input.id,
        ])
      )[0].count,
      "0",
    );
    assert.equal(
      (
        await rows("SELECT count(*) FROM ppo.business_identities WHERE id=$1", [
          input.id,
        ])
      )[0].count,
      "0",
    );
    const path = join(
      process.env.PPO_DOCUMENT_DIRECTORY ??
        join(homedir(), ".ppo-synthetic-documents"),
      p.workspace_id,
      input.operation_id,
    );
    const original = await readFile(path);
    assert.ok(original.length > 0);
    await assert.rejects(
      createDocument(p, {
        ...input,
        source: { ...input.source, text: "SYN altered uncertain command" },
      }),
      code("StoredOperationConflict"),
    );
    assert.deepEqual(await readFile(path), original);
  } finally {
    await rows(
      "DROP TRIGGER library_test_refuse_receipt ON ppo.operation_receipts",
    );
    await rows("DROP FUNCTION ppo.library_test_refuse_receipt()");
  }
  const recovered = await createDocument(p, input);
  assert.equal(recovered.receipt.record_version, 1);
  assert.equal(recovered.replayed, false);
  assert.deepEqual((await createDocument(p, input)).receipt, recovered.receipt);
  assert.equal(
    (await downloadDocument(p, input.id, input.revision_id)).bytes.toString(),
    input.source.text,
  );
});
