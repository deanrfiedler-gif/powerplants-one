import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  publishTemplate,
  readPublication,
  publicationReadiness,
} from "../../src/documents/publication/service";
import {
  createProposal,
  reviseProposal,
  reviewProposal,
} from "../../src/documents/drafts/commands";
import { captureBase } from "../../src/documents/drafts/context";
import { readProposal } from "../../src/documents/drafts/reads";
import {
  readTemplate,
  listTemplates,
} from "../../src/documents/template-catalogue";
import { readOperation } from "../../src/shared/receipts";
import {
  supportedPackHtml,
  supportedRenderPack,
  supportedTemplateDefinition,
} from "../../src/documents/publication/contracts";
import { digest } from "../../src/documents/store";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  reviewedDraft,
  publicationCommand,
} from "../helpers/template-publication";
import {
  setupDraft,
  grantDraft,
  draftInput,
  reviewCommand,
  revisionInput,
  principal,
  id,
  base,
} from "../helpers/template-drafts";
import { reconciledFinance, readFinance } from "../helpers/finance";
import {
  requestFinanceEvidence,
  processFinanceJob,
} from "../../src/finance/worker";
import { queued, rows } from "../helpers/packs";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("R3 defaults deny; exact independent publication has immutable identity, catalogue support and original recovery", async () => {
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.permission_grants WHERE capability='template.publish'",
    ),
    [],
  );
  const { p, reviewer } = await setupDraft(),
    input = await draftInput(p);
  await createProposal(p, input);
  await reviewProposal(
    reviewer,
    input.id,
    await reviewCommand(reviewer, input.id),
  );
  await assert.rejects(publicationReadiness(reviewer, input.id), {
    code: "RecordUnavailable",
  });
  await grantDraft(reviewer, ["template.publish"]);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='pack.check'",
    [reviewer.actor_id],
  );
  await assert.rejects(publicationReadiness(reviewer, input.id), {
    code: "RecordUnavailable",
  });
  await grantDraft(reviewer, ["pack.check"]);
  await grantDraft(p, ["template.publish"]);
  await assert.rejects(publicationReadiness(p, input.id), {
    code: "IndependentPublicationRequired",
  });
  const cmd = await publicationCommand(reviewer, input.id),
    saved = await publishTemplate(reviewer, input.id, cmd);
  const pub = await readPublication(reviewer, cmd.id);
  assert.equal(pub.runtime_support, "Supported");
  const publisherName = (
    await rows("SELECT display_name FROM ppo.users WHERE id=$1", [
      reviewer.actor_id,
    ])
  )[0].display_name;
  assert.equal(pub.publication.publisher_name, publisherName);
  const t = await readTemplate(reviewer, cmd.template_id, { family: "OUT-09" });
  assert.equal(t.runtime_support, "Supported");
  assert.equal(t.selected_by_policy, false);
  assert.equal(t.definition_eligible, false);
  assert.equal(
    t.definition,
    await supportedTemplateDefinition(
      "OUT-09",
      cmd.runtime_version,
      t.definition,
    ),
  );
  assert.deepEqual(
    (await publishTemplate(reviewer, input.id, cmd)).receipt,
    saved.receipt,
  );
  assert.deepEqual(
    await readOperation(reviewer, cmd.operation_id),
    saved.receipt,
  );
  await assert.rejects(
    publishTemplate(reviewer, input.id, { ...cmd, approval_note: "Changed" }),
    { code: "OperationConflict" },
  );
  await assert.rejects(
    publishTemplate(reviewer, input.id, {
      ...cmd,
      ...base(),
      id: randomUUID(),
      template_id: randomUUID(),
    }),
    { code: "AlreadyPublished" },
  );
  const event = (
    await rows("SELECT payload FROM ppo.outbox_jobs WHERE operation_id=$1", [
      cmd.operation_id,
    ])
  )[0].payload;
  assert.equal(event.use_assigned, false);
  assert.equal(event.template_id, cmd.template_id);
  assert.equal(event.publication_type, "TemplateDefinition");
  await reviseProposal(p, input.id, await revisionInput(p, input.id));
  assert.equal((await readProposal(p, input.id)).proposal.state, "Draft");
  assert.deepEqual(
    (await publishTemplate(reviewer, input.id, cmd)).receipt,
    saved.receipt,
  );
  assert.equal(
    (await readPublication(reviewer, cmd.id)).publication.revision_id,
    cmd.revision_id,
  );
});
test("R3 rejects unsupported families, stale reviews/support, edits, contributors and concurrent publication intents", async () => {
  const f = await reviewedDraft();
  await assert.rejects(
    publishTemplate(f.publisher, f.input.id, {
      ...f.command,
      definition_hash: "0".repeat(64),
    }),
    { code: "StalePublication" },
  );
  await assert.rejects(
    publishTemplate(f.publisher, f.input.id, {
      ...f.command,
      review_id: randomUUID(),
    }),
    { code: "StalePublication" },
  );
  const alternate = await reviewedDraft();
  await publishTemplate(
    alternate.publisher,
    alternate.input.id,
    alternate.command,
  );
  await assert.rejects(publishTemplate(f.publisher, f.input.id, f.command), {
    code: "StalePublication",
  });
  const refreshed = await publicationCommand(f.publisher, f.input.id);
  const results = await Promise.allSettled([
    publishTemplate(f.publisher, f.input.id, refreshed),
    publishTemplate(f.publisher, f.input.id, {
      ...refreshed,
      ...base(),
      id: randomUUID(),
      template_id: randomUUID(),
    }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (results.find((r) => r.status === "rejected") as PromiseRejectedResult)
      .reason.code,
    "AlreadyPublished",
  );
  const changed = await reviewedDraft();
  await reviseProposal(
    changed.p,
    changed.input.id,
    await revisionInput(changed.p, changed.input.id),
  );
  await assert.rejects(
    publishTemplate(changed.publisher, changed.input.id, changed.command),
    { code: "StaleVersion" },
  );
  await assert.rejects(
    publicationReadiness(changed.publisher, changed.input.id),
    { code: "ReviewRequired" },
  );
  for (const family of ["OUT-10", "OUT-14"] as const) {
    const input = await draftInput(f.p, family);
    await createProposal(f.p, input);
    await reviewProposal(
      f.publisher,
      input.id,
      await reviewCommand(f.publisher, input.id),
    );
    await assert.rejects(publicationReadiness(f.publisher, input.id), {
      code: "UnsupportedTemplateFamily",
    });
  }
});
test("R3 scoped reads and original recovery recheck current source, publisher and working-company authority", async () => {
  const f = await reviewedDraft();
  await publishTemplate(f.publisher, f.input.id, f.command);
  const outsider = await principal("observer");
  await assert.rejects(
    captureBase(
      database(),
      outsider,
      "OUT-09",
      f.command.template_id,
      f.command.definition_hash,
    ),
    { code: "RecordUnavailable" },
  );
  await assert.rejects(readPublication(outsider, f.command.id), {
    code: "RecordUnavailable",
  });
  await assert.rejects(
    withWorkingCompany(f.publisher.actor_id, id("20", 2), () =>
      readPublication(f.publisher, f.command.id),
    ),
    { code: "RecordUnavailable" },
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='template.publish'",
    [f.publisher.actor_id],
  );
  await assert.rejects(readOperation(f.publisher, f.command.operation_id), {
    code: "RecordUnavailable",
  });
  await assert.rejects(publishTemplate(f.publisher, f.input.id, f.command), {
    code: "RecordUnavailable",
  });
  assert.equal(
    (await readPublication(f.publisher, f.command.id)).publication.id,
    f.command.id,
  );
  await grantDraft(f.publisher, ["template.publish"]);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.read'",
    [f.publisher.actor_id],
  );
  await assert.rejects(readPublication(f.publisher, f.command.id), {
    code: "RecordUnavailable",
  });
  await assert.rejects(
    readTemplate(f.publisher, f.command.template_id, { family: "OUT-09" }),
    { code: "RecordUnavailable" },
  );
  const listing = await listTemplates(f.publisher, {
    family: "OUT-09",
    limit: "1",
  });
  assert.ok(!listing.items.some((t) => t.id === f.command.template_id));
  await assert.rejects(readOperation(f.publisher, f.command.operation_id), {
    code: "RecordUnavailable",
  });
  await grantDraft(f.publisher, ["shared.read"]);
});
test("R3 rollback preserves intent; database refuses partial publication graphs and evidence rewrites", async () => {
  const f = await reviewedDraft();
  await database().query(
    "CREATE FUNCTION ppo.reject_publication_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.payload->>'object_type'='TemplatePublication' THEN RAISE EXCEPTION 'SYN publication fault'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_publication_test BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.reject_publication_test()",
  );
  try {
    await assert.rejects(
      publishTemplate(f.publisher, f.input.id, f.command),
      /SYN publication fault/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER reject_publication_test ON ppo.outbox_jobs; DROP FUNCTION ppo.reject_publication_test()",
    );
  }
  for (const [table, key, value] of [
    ["pack_templates", "id", f.command.template_id],
    ["template_publications", "id", f.command.id],
    ["business_identities", "id", f.command.id],
    ["operation_receipts", "operation_id", f.command.operation_id],
  ])
    assert.equal(
      (await rows(`SELECT 1 FROM ppo.${table} WHERE ${key}=$1`, [value]))
        .length,
      0,
    );
  await publishTemplate(f.publisher, f.input.id, f.command);
  for (const table of ["pack_templates", "template_publications"])
    await assert.rejects(
      database().query(`DELETE FROM ppo.${table} WHERE id=$1`, [
        table === "pack_templates" ? f.command.template_id : f.command.id,
      ]),
      { code: "55000" },
    );
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.pack_templates SELECT $1,workspace_id,99999,name,renderer_version,definition,content_hash FROM ppo.pack_templates WHERE id=$2",
      [randomUUID(), f.command.template_id],
    ),
    { code: "23514" },
  );
});
test("R3 renders supported escaped fields and mandatory sections; publication preserves all old outputs and queued legacy completion", async () => {
  const finance = await reconciledFinance(),
    fd = await readFinance(finance.reconciler, finance.id);
  const fr = (
    await rows("SELECT id FROM ppo.finance_reviews WHERE handoff_id=$1", [
      finance.id,
    ])
  )[0];
  const rec = (
    await rows(
      "SELECT id FROM ppo.finance_reconciliations WHERE handoff_id=$1",
      [finance.id],
    )
  )[0];
  await requestFinanceEvidence(finance.reconciler, finance.id, {
    ...base(),
    expected_version: fd.handoff.version,
    revision_id: fd.handoff.current_revision_id,
    review_id: fr.id,
    reconciliation_id: rec.id,
  });
  const fj = (
    await rows("SELECT id FROM ppo.finance_render_jobs WHERE handoff_id=$1", [
      finance.id,
    ])
  )[0];
  assert.ok("issue_id" in (await processFinanceJob(fj.id)));
  const q = await queued(10),
    job = (
      await rows("SELECT * FROM ppo.pack_render_jobs WHERE id=$1", [
        q.pack.jobs[0].id,
      ])
    )[0];
  const tables = [
    "pack_templates",
    "report_templates",
    "finance_templates",
    "pack_policy",
    "report_template_policy",
    "finance_template_policy",
    "pack_revisions",
    "pack_render_jobs",
    "pack_issues",
    "report_revisions",
    "finance_revisions",
    "report_render_jobs",
    "finance_render_jobs",
    "report_issues",
    "finance_issues",
  ];
  const snap = () =>
    Promise.all(
      tables.map((t) =>
        rows(
          `SELECT to_jsonb(r) AS v FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
        ),
      ),
    );
  const before = await snap(),
    f = await reviewedDraft();
  await publishTemplate(f.publisher, f.input.id, f.command);
  const after = await snap();
  assert.deepEqual(after.slice(1), before.slice(1));
  assert.deepEqual(
    after[0].filter((x) => x.v.id !== f.command.template_id),
    before[0],
  );
  const pub = (await readPublication(f.publisher, f.command.id)).publication;
  const s = {
    ...job.render_snapshot.source,
    site: {
      ...job.render_snapshot.source.site,
      name: '<script>alert("x")</script>',
    },
    template: {
      ...job.render_snapshot.source.template,
      id: pub.template_id,
      version: pub.runtime_version,
      definition: pub.definition,
      hash: pub.definition_hash,
    },
  };
  const rendered = await supportedRenderPack(s, {
    prepared_at: job.render_snapshot.prepared_at,
    issue_id: job.render_snapshot.issue_id,
  });
  assert.ok(rendered.pdf.subarray(0, 5).equals(Buffer.from("%PDF-")));
  assert.ok(rendered.html.includes("&lt;script&gt;"));
  assert.ok(!rendered.html.includes("<script>"));
  assert.equal(
    (rendered.html.match(/<section aria-labelledby=/g) || []).length,
    9,
  );
  assert.ok(rendered.html.includes(f.input.body.title));
  await assert.rejects(
    supportedPackHtml({ ...s, site: { ...s.site, name: "" } }),
    { code: "TemplateSourceMissing" },
  );
  const altered = JSON.parse(pub.definition);
  altered.sources[0].sha256 = "0".repeat(64);
  const wrong = JSON.stringify(altered);
  await assert.rejects(
    supportedPackHtml({
      ...s,
      template: { ...s.template, definition: wrong, hash: digest(wrong) },
    }),
    { code: "StaleTemplate" },
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.pack_render_jobs WHERE id=$1", [job.id]),
    [job],
  );
  const released = await processRenderJob(job.id);
  assert.ok("issue_id" in released);
  const manifest = (
    await rows("SELECT manifest FROM ppo.pack_issues WHERE id=$1", [
      released.issue_id,
    ])
  )[0].manifest;
  const bytes = await readBundle(q.p, manifest);
  await reviseProposal(f.p, f.input.id, await revisionInput(f.p, f.input.id));
  assert.deepEqual((await readBundle(q.p, manifest)).pdf, bytes.pdf);
});

test("R3 native reservation retains the exact supported definition and worker recovers its original bytes under an explicit test-only policy fixture", async () => {
  await reset();
  const f = await reviewedDraft();
  await publishTemplate(f.publisher, f.input.id, f.command);
  // This SQL is test setup for renderer integration, not an R4 assignment command.
  await database().query(
    "UPDATE ppo.pack_policy SET version=version+1,template_id=$2 WHERE workspace_id=$1",
    [f.p.workspace_id, f.command.template_id],
  );
  const q = await queued(),
    job = (
      await rows("SELECT * FROM ppo.pack_render_jobs WHERE id=$1", [
        q.pack.jobs[0].id,
      ])
    )[0];
  assert.equal(
    job.render_snapshot.source.template.hash,
    f.command.definition_hash,
  );
  assert.equal(
    digest(job.render_snapshot.source.template.definition),
    f.command.definition_hash,
  );
  const output = await processRenderJob(job.id);
  assert.ok("issue_id" in output, JSON.stringify(output));
  const manifest = (
    await rows("SELECT manifest FROM ppo.pack_issues WHERE id=$1", [
      output.issue_id,
    ])
  )[0].manifest;
  const bytes = await readBundle(q.p, manifest);
  assert.ok(bytes.html.includes(f.input.body.title));
  assert.equal(manifest.template.version, f.command.runtime_version);
  await processRenderJob(job.id);
  assert.deepEqual((await readBundle(q.p, manifest)).pdf, bytes.pdf);
});
