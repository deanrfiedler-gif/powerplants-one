import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { controlRead } from "../../src/engineering/control/reads";
import { controlCommand } from "../../src/engineering/control/commands";
import { readOperation } from "../../src/shared/receipts";
import { listEngineering } from "../../src/engineering/service";
import {
  directSignIn,
  principalOf,
} from "../helpers/engineering-control-direct";
import {
  command,
  saveFields,
  basisContent,
  seedControlContext,
} from "../helpers/engineering-control";
import { MATERIALS, type Call } from "../helpers/engineering-materials";
import type { ControlRead } from "../../src/engineering/control/reads";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
async function ok(call: Call, base: string, body: unknown) {
  const r = await call(base, body);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body;
}
async function scenario() {
  const s = await seedControlContext(directSignIn);
  const author = await directSignIn("materials-author"),
    engineer = await directSignIn("materials-engineer"),
    reviewer = await directSignIn("materials-reviewer"),
    issuer = await directSignIn("materials-release"),
    viewer = await directSignIn("materials-viewer");
  const read = async (call = author) => {
    const r = await call(s.base);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body as ControlRead;
  };
  return { ...s, author, engineer, reviewer, issuer, viewer, read };
}
test("EN02 native: uncertain input, two-sided confirmation, return, successor, stale versions and original operation recovery", async () => {
  const s = await scenario(),
    content = {
      ...basisContent(s.source),
      interfaces: [
        {
          id: randomUUID(),
          title: "SYN-PPO two-sided interface",
          provider_id: MATERIALS.author.id,
          receiver_id: MATERIALS.engineer.id,
          required_input: "Fictional supply schedule",
          expected_output: "Fictional connection schedule",
          criterion: "Both owners confirm",
          source_ids: [s.source],
        },
      ],
      inputs: [
        {
          id: randomUUID(),
          kind: "Question",
          title: "SYN-PPO uncertain supply",
          owner_id: MATERIALS.author.id,
          due_date: null,
          blocking: true,
          state: "Unknown",
          response: null,
          source_ids: [],
          deliverable_ids: [],
        },
      ],
    };
  const original = command(saveFields("basis", content));
  await ok(s.author, s.base, original);
  assert.equal((await s.author(s.base, original)).status, 200);
  assert.equal(
    (await s.author(s.base, { ...original, title: "Changed retry" })).status,
    409,
  );
  let b = (await s.read()).records.basis[0];
  assert.equal(b.content.inputs[0].state, "Unknown");
  assert.equal(
    (
      await s.author(
        s.base,
        command({
          ...original,
          operation_id: randomUUID(),
          expected_version: 42,
        }),
      )
    ).status,
    409,
  );
  await ok(
    s.author,
    s.base,
    command({
      kind: "basis",
      action: "confirm_interface",
      id: b.id,
      expected_version: b.version,
      interface_id: content.interfaces[0].id,
    }),
  );
  b = (await s.read()).records.basis[0];
  assert.equal((await s.read()).basis_readiness[b.id].confirmed.length, 1);
  await ok(
    s.engineer,
    s.base,
    command({
      kind: "basis",
      action: "confirm_interface",
      id: b.id,
      expected_version: b.version,
      interface_id: content.interfaces[0].id,
    }),
  );
  b = (await s.read()).records.basis[0];
  await ok(
    s.author,
    s.base,
    command({
      kind: "basis",
      action: "submit_basis",
      id: b.id,
      expected_version: b.version,
      reviewer_id: MATERIALS.reviewer.id,
    }),
  );
  let review = (await s.read()).records.review[0];
  assert.equal(
    (
      await s.reviewer(
        s.base,
        command({
          kind: "review",
          action: "decide_review",
          id: review.id,
          expected_version: review.version,
          outcome: "Reviewed",
          rationale: "SYN checked",
        }),
      )
    ).status,
    422,
  );
  await ok(
    s.reviewer,
    s.base,
    command({
      kind: "review",
      action: "finding",
      id: review.id,
      expected_version: review.version,
      finding_id: randomUUID(),
      owner_id: MATERIALS.author.id,
      due_date: null,
      finding: "Resolve uncertain supply",
    }),
  );
  review = (await s.read()).records.review[0];
  await ok(
    s.reviewer,
    s.base,
    command({
      kind: "review",
      action: "decide_review",
      id: review.id,
      expected_version: review.version,
      outcome: "Returned",
      rationale: "Input remains unknown",
    }),
  );
  b = (await s.read()).records.basis[0];
  await assert.rejects(
    database().query(
      "UPDATE ppo.engineering_bases SET content=jsonb_set(content,'{summary}','\"rewrite\"'),version=version+1 WHERE id=$1",
      [b.id],
    ),
    /immutable/i,
  );
  const next = {
    ...content,
    inputs: [
      {
        ...content.inputs[0],
        state: "Supported",
        response: "SYN brief checked",
        source_ids: [s.source],
      },
    ],
  };
  const successor = saveFields("basis", next, { predecessor_id: b.id });
  await ok(s.author, s.base, command(successor));
  b = (await s.read()).records.basis.find((r) => r.predecessor_id)!;
  assert.equal(b.revision, 2);
  assert.equal((await s.read()).basis_readiness[b.id].confirmed.length, 0);
  for (const call of [s.author, s.engineer]) {
    await ok(
      call,
      s.base,
      command({
        kind: "basis",
        action: "confirm_interface",
        id: b.id,
        expected_version: b.version,
        interface_id: content.interfaces[0].id,
      }),
    );
    b = (await s.read()).records.basis.find((r) => r.id === b.id)!;
  }
  await ok(
    s.author,
    s.base,
    command({
      kind: "basis",
      action: "submit_basis",
      id: b.id,
      expected_version: b.version,
      reviewer_id: MATERIALS.reviewer.id,
    }),
  );
  const resubmission = (await s.read()).records.review.find(
    (r) => r.predecessor_id === review.id,
  )!;
  assert.ok(resubmission);
  assert.equal(
    (
      await s.reviewer(
        s.base,
        command({
          kind: "review",
          action: "decide_review",
          id: resubmission.id,
          expected_version: resubmission.version,
          outcome: "Reviewed",
          rationale: "SYN reassessed",
        }),
      )
    ).status,
    422,
  );
  const data = await s.read(),
    finding = data.findings[0];
  review = data.records.review.find((r) => r.id === review.id)!;
  await ok(
    s.author,
    s.base,
    command({
      kind: "review",
      action: "respond_finding",
      id: review.id,
      expected_version: review.version,
      finding_id: finding.id,
      response: "SYN successor resolves input",
    }),
  );
  review = (await s.read()).records.review.find((r) => r.id === review.id)!;
  await ok(
    s.reviewer,
    s.base,
    command({
      kind: "review",
      action: "accept_finding",
      id: review.id,
      expected_version: review.version,
      finding_id: finding.id,
    }),
  );
  await ok(
    s.reviewer,
    s.base,
    command({
      kind: "review",
      action: "decide_review",
      id: resubmission.id,
      expected_version: resubmission.version,
      outcome: "Reviewed",
      rationale: "SYN reassessed exact successor",
    }),
  );
  assert.equal(
    (await s.read()).records.basis.find((r) => r.id === b.id)!.state,
    "Reviewed",
  );
  const principal = await principalOf("materials-author");
  assert.ok(await readOperation(principal, original.operation_id));
  assert.equal(
    (
      await s.viewer(
        s.base,
        command(
          saveFields("query", {
            schema_version: 1,
            source_ids: [s.source],
            question: "SYN question",
            deliverable_ids: [],
            change_id: null,
            review_required: true,
          }),
        ),
      )
    ).status,
    403,
  );
});
test("EN03/EN05: mixed document revisions, separate duties, immutable issue, distribution stages and transitive source invalidation", async () => {
  const s = await scenario(),
    revisions: string[] = [];
  for (const [engineeringRevision, fileVersion] of [
    ["B", "7.2"],
    ["C", "19.0"],
  ]) {
    const fields = saveFields("document", {
      schema_version: 1,
      source_ids: [s.source],
      discipline: "Hydraulics",
      document_type: "Drawing",
    });
    await ok(s.author, s.base, command(fields));
    const revisionId = randomUUID();
    revisions.push(revisionId);
    await ok(
      s.author,
      s.base,
      command({
        kind: "document",
        action: "revise_document",
        id: fields.id,
        expected_version: 1,
        revision_id: revisionId,
        engineering_revision: engineeringRevision,
        native_system: "SYN native CAD",
        native_reference: "SYN-PPO/models/long/reference/assembly.sldasm",
        native_version: fileVersion,
        configuration: "SYN variant",
        outputs: [
          {
            reference: "SYN-PPO/drawing.pdf",
            version: "3.4",
            content_hash: "a".repeat(64),
          },
        ],
        basis_id: null,
      }),
    );
  }
  const reviewFields = {
    kind: "review",
    action: "submit_review",
    id: randomUUID(),
    reference: "SYN-PPO-REVIEW-" + randomUUID().slice(0, 8),
    title: "SYN exact mixed set",
    reviewer_id: MATERIALS.reviewer.id,
    due_date: "2031-10-03",
    purpose: "TechnicalReleaseForProcurement",
    basis_id: null,
    document_revision_ids: revisions,
    submittal_ids: [],
    source_ids: [],
    predecessor_id: null,
  };
  await ok(s.author, s.base, command(reviewFields));
  let review = (await s.read()).records.review[0];
  const decide = command({
    kind: "review",
    action: "decide_review",
    id: review.id,
    expected_version: review.version,
    outcome: "Reviewed",
    rationale: "SYN checks complete",
  });
  assert.equal((await s.author(s.base, decide)).status, 403);
  await ok(s.reviewer, s.base, decide);
  review = (await s.read()).records.review[0];
  const issueFields = {
    kind: "issue",
    action: "issue",
    id: randomUUID(),
    reference: "SYN-PPO-ISSUE-" + randomUUID().slice(0, 8),
    title: "SYN exact formal issue",
    review_id: review.id,
    expected_version: review.version,
    recipient_ids: [MATERIALS.viewer.id],
  };
  assert.equal((await s.reviewer(s.base, command(issueFields))).status, 403);
  const original = command(issueFields);
  await ok(s.issuer, s.base, original);
  assert.equal((await s.issuer(s.base, original)).status, 200);
  let data = await s.read(s.issuer),
    issue = data.records.issue[0];
  const trans = data.transmittals[0];
  const manifest = issue.content.manifest as {
    exact_content: {
      documents: { engineering_revision: string; native_version: string }[];
    };
  };
  assert.deepEqual(
    manifest.exact_content.documents.map((d) => [
      d.engineering_revision,
      d.native_version,
    ]),
    [
      ["B", "7.2"],
      ["C", "19.0"],
    ],
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.engineering_issues SET content=jsonb_set(content,'{purpose}','\"InformationOnly\"'),version=version+1 WHERE id=$1",
      [issue.id],
    ),
    /immutable/i,
  );
  const evidence = (kind: string) =>
    command({
      kind: "issue",
      action: "distribution",
      id: issue.id,
      expected_version: issue.version,
      transmittal_id: trans.id,
      evidence_kind: kind,
      evidence: "SYN retained observation",
    });
  assert.equal((await s.viewer(s.base, evidence("Acknowledged"))).status, 422);
  await ok(s.issuer, s.base, evidence("Sent"));
  issue = (await s.read()).records.issue[0];
  assert.equal((await s.read(s.viewer)).transmittals[0].events.length, 1);
  await ok(s.issuer, s.base, evidence("Delivered"));
  issue = (await s.read()).records.issue[0];
  assert.equal((await s.issuer(s.base, evidence("Acknowledged"))).status, 403);
  await ok(s.viewer, s.base, evidence("Acknowledged"));
  const before = (await s.read(s.viewer)).transmittals[0].events;
  assert.deepEqual(
    before.map((e) => e.kind),
    ["Sent", "Delivered", "Acknowledged"],
  );
  const doc = (await s.read()).records.document[0];
  await ok(
    s.author,
    s.base,
    command({
      kind: "document",
      action: "revise_document",
      id: doc.id,
      expected_version: doc.version,
      revision_id: randomUUID(),
      engineering_revision: "D",
      native_system: "SYN native CAD",
      native_reference: "SYN-PPO/assembly.sldasm",
      native_version: "7.3",
      configuration: null,
      outputs: [
        {
          reference: "SYN-PPO/drawing-new.pdf",
          version: "3.5",
          content_hash: "b".repeat(64),
        },
      ],
      basis_id: null,
    }),
  );
  data = await s.read(s.viewer);
  assert.deepEqual(data.transmittals[0].events, before);
  assert.equal(data.document_revisions.length, 3);
  const derived = await rows(
    "SELECT c.change FROM ppo.engineering_source_lineage l JOIN ppo.material_source_changes c ON (c.workspace_id,c.source_id)=(l.workspace_id,l.source_id) WHERE l.issue_id=$1",
    [issue.id],
  );
  assert.equal(derived[0].change, "Withdrawn");
  assert.equal(
    (
      await s.author(
        s.base,
        command({
          ...reviewFields,
          id: randomUUID(),
          reference: "SYN-PPO-STALE",
        }),
      )
    ).status,
    409,
  );
});
test("EN04: formal answer, disposition, supplier successor and exact source remain distinct from notes and purchasing", async () => {
  const s = await scenario(),
    q = saveFields("query", {
      schema_version: 1,
      source_ids: [s.source],
      question: "SYN interface confirmation needed",
      deliverable_ids: [],
      change_id: null,
      review_required: true,
    });
  await ok(s.author, s.base, command(q));
  let query = (await s.read()).records.query[0];
  assert.equal(query.content.response, null);
  assert.equal(
    (
      await s.author(
        s.base,
        command({
          ...q,
          expected_version: query.version,
          content: { ...(q.content as object), response: "Injected answer" },
        }),
      )
    ).status,
    422,
  );
  await ok(
    s.author,
    s.base,
    command({
      kind: "query",
      action: "respond",
      id: query.id,
      expected_version: query.version,
      response: "SYN response bound to the retained source",
      actions: "Prepare a controlled revision separately",
      change_id: null,
    }),
  );
  query = (await s.read()).records.query[0];
  assert.equal(query.state, "Answered");
  assert.equal(query.content.response_by, MATERIALS.author.id);
  await ok(
    s.reviewer,
    s.base,
    command({
      kind: "query",
      action: "dispose",
      id: query.id,
      expected_version: query.version,
      outcome: "Resolved",
      rationale: "SYN technical answer checked",
    }),
  );
  const sub = saveFields("submittal", {
    schema_version: 1,
    source_ids: [s.source],
    supplier: "SYN-PPO supplier",
    product_reference: "SYN-PPO valve",
    purchase_reference: "SYN-PPO-PO-reference-only",
    submitted_revision: "v2.3",
    evidence: "SYN-PPO retained supplier evidence",
    reviewer_id: MATERIALS.reviewer.id,
    downstream_actions: "Check exact equipment version before technical use",
  });
  await ok(s.author, s.base, command(sub));
  let record = (await s.read()).records.submittal[0];
  await ok(
    s.reviewer,
    s.base,
    command({
      kind: "submittal",
      action: "dispose",
      id: record.id,
      expected_version: record.version,
      outcome: "Returned",
      rationale: "SYN missing evidence",
    }),
  );
  await ok(
    s.author,
    s.base,
    command(
      saveFields(
        "submittal",
        { ...(sub.content as object), submitted_revision: "v2.4" },
        { predecessor_id: record.id },
      ),
    ),
  );
  record = (await s.read()).records.submittal.find((r) => r.predecessor_id)!;
  await ok(
    s.reviewer,
    s.base,
    command({
      kind: "submittal",
      action: "dispose",
      id: record.id,
      expected_version: record.version,
      outcome: "Accepted",
      rationale: "SYN exact revised evidence checked",
    }),
  );
  const outbox = await rows(
    "SELECT kind FROM ppo.outbox_jobs WHERE payload->>'record_id'=$1",
    [s.ids.package],
  );
  assert.ok(
    outbox.every((r) => !String(r.kind).match(/Purchase|Receipt|Invoice/)),
  );
  assert.equal((await s.read()).records.submittal.length, 2);
});
test("EN01 accountable workloads use actual technical records and source changes block an open review", async () => {
  const s = await scenario(),
    author = await principalOf("materials-author"),
    reviewer = await principalOf("materials-reviewer");
  const basis = saveFields("basis", basisContent(s.source));
  await ok(s.author, s.base, command(basis));
  await ok(
    s.author,
    s.base,
    command(
      saveFields("deliverable", {
        schema_version: 1,
        source_ids: [s.source],
        discipline: "Hydraulics",
        document_id: null,
        prerequisite: "SYN exact interface evidence",
        prerequisite_evidence: null,
        next_action: "Obtain prerequisite",
        planned_hours: null,
        effort_source: null,
        authorised_hours: null,
        authorisation_reference: null,
      }),
    ),
  );
  const q = { q: s.ids.package };
  assert.equal(
    (await listEngineering(author, { ...q, view: "author" })).items[0].technical
      ?.author_waiting,
    1,
  );
  assert.equal(
    (await listEngineering(author, { ...q, attention: "true" })).items[0]
      .technical?.blocked,
    1,
  );
  assert.equal(
    (await listEngineering(author, { ...q, view: "released" })).items.length,
    0,
  );
  await ok(
    s.author,
    s.base,
    command({
      kind: "basis",
      action: "submit_basis",
      id: basis.id,
      expected_version: 1,
      reviewer_id: MATERIALS.reviewer.id,
    }),
  );
  assert.equal(
    (await listEngineering(author, { ...q, view: "author" })).items.length,
    0,
  );
  assert.equal(
    (await listEngineering(reviewer, { ...q, view: "review" })).items[0]
      .technical?.reviews,
    1,
  );
  const review = (await s.read()).records.review[0];
  await ok(
    s.coordinator,
    `engineering/${s.ids.package}/materials/sources`,
    command({ action: "withdraw", source_id: s.source }),
  );
  assert.equal(
    (
      await s.reviewer(
        s.base,
        command({
          kind: "review",
          action: "decide_review",
          id: review.id,
          expected_version: review.version,
          outcome: "Reviewed",
          rationale: "SYN now stale",
        }),
      )
    ).status,
    409,
  );
  assert.equal(
    (await s.read()).records.review[0].content.submission_hash,
    review.content.submission_hash,
  );
  assert.equal(
    (await listEngineering(author, { ...q, view: "released" })).items.length,
    0,
  );
});

test("EN02–EN05 site scope is checked independently of company and hidden linked content withholds workload counts", async () => {
  const s = await scenario(),
    other = await scenario(),
    viewer = await principalOf("materials-viewer");
  await database().query(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$2,site_id=$2 WHERE user_id=$1 AND scope_type='Company' AND company_id=$3",
    [viewer.actor_id, s.ids.site, (await s.read()).package.company_id],
  );
  try {
    assert.equal(
      (await controlRead(viewer, s.ids.package)).package.id,
      s.ids.package,
    );
    await assert.rejects(controlRead(viewer, other.ids.package));
    assert.equal(
      (await listEngineering(viewer, { q: other.ids.package })).items.length,
      0,
    );
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET scope_type='Company',scope_id=company_id,site_id=NULL WHERE user_id=$1 AND site_id=$2",
      [viewer.actor_id, s.ids.site],
    );
  }
  const hidden = randomUUID();
  await ok(s.coordinator, `engineering/${s.ids.package}/materials/sources`, command({
    action: "publish", id: hidden, kind: "DesignBasis", reference: "SYN-PPO-SCOPE-HIDDEN",
    title: "SYN restricted input", revision: "A", file_version: "1", permitted_purpose: "DesignCoordination",
    content: "SYN retained private fixture", restricted: true,
  }));
  const basis = command(saveFields("basis", basisContent(hidden)));
  await ok(s.coordinator, s.base, basis);
  assert.equal((await s.read()).records.basis.length, 0);
  assert.equal(
    (
      await listEngineering(await principalOf("materials-author"), {
        q: s.ids.package,
        view: "author",
      })
    ).items.length,
    0,
  );
  const coordinator = await principalOf("coordinator");
  assert.equal((await controlRead(coordinator, s.ids.package)).records.basis.length, 1);
  await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='engineering.technical.source'", [coordinator.actor_id]);
  try {
    assert.equal((await controlRead(coordinator, s.ids.package)).records.basis.length, 0);
    await assert.rejects(readOperation(coordinator, basis.operation_id));
  } finally {
    await database().query("UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='engineering.technical.source'", [coordinator.actor_id]);
  }
});

test("EN02–EN05 scope, hidden sources, receipt revocation and deterministic migration/seed", async () => {
  const s = await scenario(),
    p = await principalOf("materials-author");
  await assert.rejects(
    controlRead({ ...p, workspace_id: randomUUID() }, s.ids.package),
  );
  await assert.rejects(
    controlRead(await principalOf("second-company"), s.ids.package),
  );
  const q = command(
    saveFields("query", {
      schema_version: 1,
      source_ids: [s.source],
      question: "SYN source bound question",
      deliverable_ids: [],
      change_id: null,
      review_required: true,
    }),
  );
  await controlCommand(p, s.ids.package, q);
  const before = await rows(
    "SELECT count(*)::int n FROM ppo.permission_grants",
  );
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT count(*)::int n FROM ppo.permission_grants"),
    before,
  );
  const hidden = randomUUID();
  await ok(
    s.coordinator,
    `engineering/${s.ids.package}/materials/sources`,
    command({
      action: "publish",
      id: hidden,
      kind: "DesignBasis",
      reference: "SYN-PPO-HIDDEN",
      title: "SYN hidden source",
      revision: "A",
      file_version: "1",
      permitted_purpose: "DesignCoordination",
      content: "SYN secret fixture",
      restricted: true,
    }),
  );
  assert.ok(!(await s.read()).sources.some((source) => source.id === hidden));
  assert.equal(
    (
      await s.author(
        s.base,
        command(
          saveFields("query", {
            schema_version: 1,
            source_ids: [hidden],
            question: "SYN forbidden link",
            deliverable_ids: [],
            change_id: null,
            review_required: true,
          }),
        ),
      )
    ).status,
    404,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='engineering.edit'",
    [p.actor_id],
  );
  await assert.rejects(readOperation(p, q.operation_id));
  await assert.rejects(controlCommand(p, s.ids.package, q));
});
