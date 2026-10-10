// PT-18: real synthetic files and database commands, plus in-process route adapters.
// Source registrations/projections are fixture observations, not a live ingestion API.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rename, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import { reset } from "../../scripts/database";
import type { DocumentKey } from "../../src/adapters/contracts";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { AppError } from "../../src/platform/errors";
import { createSession, sessionCookie } from "../../src/platform/identity";
import { withRequestScope } from "../../src/platform/working-company";
import type { RouteContext } from "../../src/shared/http";
import { documentStore, digest } from "../../src/documents/store";
import { availableSources } from "../../src/documents/context";
import { issueFile, previewPack } from "../../src/documents/http";
import {
  insert,
  revisePack,
  checkPack,
  requestIssue,
} from "../../src/documents/packs";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import { reportFile } from "../../src/reports/http";
import { GET as financeFile } from "../../src/app/api/v1/finance/issues/[id]/bytes/route";
import {
  requestFinanceEvidence,
  processFinanceJob,
} from "../../src/finance/worker";
import { issued, content, base, rows, id } from "./packs";
import { reconciledFinance } from "./finance";

after(closeDatabase);
async function fresh() {
  assert.equal(localConfig().database_name, "ppo_synthetic_test");
  assert.ok(
    process.env.PPO_DOCUMENT_DIRECTORY,
    "A private task/test store is required",
  );
  process.env.PPO_ALLOW_RESET = "dispose-synthetic";
  process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset();
}
const code = (expected: string) => (error: unknown) =>
  error instanceof AppError && error.code === expected;
const sourceKey = (s: Record<string, string>): DocumentKey => ({
  provider: "Synthetic",
  tenant_id: null,
  site_id: null,
  drive_id: null,
  item_id: s.item_id,
  version_id: s.version_id,
  sha256: s.content_hash,
});
function privatePath(workspace: string, item: string) {
  for (const value of [workspace, item]) assert.match(value, /^[a-f0-9-]{36}$/);
  const root = resolve(process.env.PPO_DOCUMENT_DIRECTORY!),
    path = resolve(root, workspace, item);
  const rel = relative(root, path);
  assert.ok(rel && !rel.startsWith("..") && !isAbsolute(rel));
  return path;
}
async function moveWithinStore(from: string, to: string) {
  const root = resolve(process.env.PPO_DOCUMENT_DIRECTORY!);
  for (const path of [from, to]) {
    const rel = relative(root, resolve(path));
    assert.ok(rel && !rel.startsWith("..") && !isAbsolute(rel));
  }
  await rename(from, to);
}
// Preserve every existing row, while allowing explicitly checked successor commands.
async function preserve(tables: string[]) {
  const original = await Promise.all(
    tables.map(async (table) => ({
      table,
      data: await rows(
        `SELECT id,to_jsonb(r) AS row FROM ppo.${table} r ORDER BY id`,
      ),
    })),
  );
  return async () => {
    for (const { table, data } of original)
      assert.deepEqual(
        await rows(
          `SELECT id,to_jsonb(r) AS row FROM ppo.${table} r WHERE id=ANY($1::uuid[]) ORDER BY id`,
          [data.map((r) => r.id)],
        ),
        data,
        `${table}: original evidence must not be rewritten`,
      );
  };
}
const retainedTables = [
  "pack_sources",
  "pack_revisions",
  "pack_checks",
  "pack_issues",
  "pack_recipients",
  "pack_acknowledgements",
  "pack_render_jobs",
  "pack_render_attempts",
  "report_revisions",
  "report_reviews",
  "report_issues",
  "report_presentations",
  "report_render_jobs",
  "finance_revisions",
  "finance_reviews",
  "finance_reconciliations",
  "finance_issues",
  "finance_render_jobs",
  "operation_receipts",
  "audit_events",
  "outbox_jobs",
];

test("PT-18 identity-changing source move requires an explicitly reviewed successor", async (t) => {
  await fresh();
  const q = await issued(),
    originalIssue = q.pack.issues[0];
  const s = (
    await rows("SELECT * FROM ppo.pack_sources WHERE id=$1", [id("c2")])
  )[0];
  const key = sourceKey(s),
    context = { ...q.p, operation_id: key.item_id };
  const originalBytes = Buffer.from(await documentStore().read(context, key));
  const originalOutput = await readBundle(q.p, originalIssue.manifest);
  const originalsUnchanged = await preserve(retainedTables);
  const originalPath = privatePath(q.p.workspace_id, key.item_id),
    movedItem = randomUUID();
  const movedPath = privatePath(q.p.workspace_id, movedItem),
    movedKey = { ...key, item_id: movedItem };
  const packRow = async () =>
    (await rows("SELECT * FROM ppo.packs WHERE id=$1", [q.pack.id]))[0];
  const failedAmendment = async (sourceId: string, expected: string) => {
    const pack = await packRow(),
      cmd = {
        ...base(),
        expected_version: pack.version,
        content: { ...content(), source_ids: [sourceId] },
      };
    const before = await rows(
      "SELECT to_jsonb(a) AS row FROM ppo.appointments a WHERE id=$1",
      [q.pack.appointment_id],
    );
    const events = await rows(
      "SELECT to_jsonb(e) AS row FROM ppo.pack_issue_events e ORDER BY id",
    );
    await assert.rejects(revisePack(q.p, q.pack.id, cmd), code(expected));
    assert.deepEqual(await packRow(), pack);
    assert.deepEqual(
      await rows(
        "SELECT to_jsonb(a) AS row FROM ppo.appointments a WHERE id=$1",
        [q.pack.appointment_id],
      ),
      before,
    );
    assert.deepEqual(
      await rows(
        "SELECT to_jsonb(e) AS row FROM ppo.pack_issue_events e ORDER BY id",
      ),
      events,
    );
    assert.equal(
      (
        await rows(
          "SELECT 1 FROM ppo.operation_receipts WHERE operation_id=$1",
          [cmd.operation_id],
        )
      ).length,
      0,
    );
    await originalsUnchanged();
  };
  try {
    await moveWithinStore(originalPath, movedPath);
    assert.deepEqual(
      Buffer.from(await documentStore().read(context, movedKey)),
      originalBytes,
    );
    await assert.rejects(
      documentStore().read(context, key),
      code("ExactDocumentUnavailable"),
    );
    await t.test(
      "same title and hash at a new item identity cannot silently replace a selected source",
      async () => {
        await failedAmendment(s.id, "ExactDocumentUnavailable");
        await database().query(
          "UPDATE ppo.pack_source_locations SET available=false,version=version+1 WHERE source_id=$1",
          [s.id],
        );
        await failedAmendment(s.id, "StaleSource");
        assert.ok(s.owner_id, "Original source retains its recovery owner");
        assert.deepEqual(
          await readBundle(q.p, originalIssue.manifest),
          originalOutput,
        );
      },
    );
    const candidate = { ...s, id: randomUUID(), item_id: movedItem };
    // A synthetic discovery observation only; registration does not approve its use.
    await insert(database(), "pack_sources", candidate);
    await insert(database(), "pack_source_locations", {
      workspace_id: s.workspace_id,
      source_id: candidate.id,
      display_name: s.title,
    });
    await t.test(
      "reconciliation cannot rewrite the original identity or skip review",
      async () => {
        await assert.rejects(
          database().query(
            "UPDATE ppo.pack_sources SET item_id=$2 WHERE id=$1",
            [s.id, movedItem],
          ),
        );
        // Even if the old availability projection is stale, discovering a matching
        // candidate must not make the original item resolve to that new identity.
        await database().query(
          "UPDATE ppo.pack_source_locations SET available=true,version=version+1 WHERE source_id=$1",
          [s.id],
        );
        await failedAmendment(s.id, "ExactDocumentUnavailable");
        await database().query(
          "UPDATE ppo.pack_source_locations SET available=false,version=version+1 WHERE source_id=$1",
          [s.id],
        );
        await failedAmendment(s.id, "StaleSource");
        const pack = await packRow();
        await revisePack(q.p, q.pack.id, {
          ...base(),
          expected_version: pack.version,
          reason: `SYN PT-18 reviewed reconciliation: original source ${s.id} moved to ${candidate.id}; exact bytes checked; no broader scope.`,
          content: { ...content(), source_ids: [candidate.id] },
        });
        const draft = await packRow();
        assert.equal(draft.status, "Draft");
        assert.equal(draft.needs_review, true);
        assert.equal(draft.current_issue_id, originalIssue.id);
        const revision = (
          await rows("SELECT * FROM ppo.pack_revisions WHERE id=$1", [
            draft.current_revision_id,
          ])
        )[0];
        assert.equal(revision.predecessor_id, q.pack.current_revision_id);
        assert.equal(revision.snapshot.sources[0].id, candidate.id);
        assert.equal(revision.snapshot.sources[0].item_id, movedItem);
        assert.equal(revision.snapshot.sources[0].hash, key.sha256);
        await assert.rejects(
          requestIssue(q.p, q.pack.id, {
            ...base(),
            expected_version: draft.version,
          }),
          code("PackNotReady"),
        );
        await checkPack(q.p, q.pack.id, {
          ...base(),
          expected_version: draft.version,
          decision: "Checked",
        });
        const checked = await packRow();
        await requestIssue(q.p, q.pack.id, {
          ...base(),
          expected_version: checked.version,
        });
        const job = (
          await rows(
            "SELECT * FROM ppo.pack_render_jobs WHERE revision_id=$1",
            [revision.id],
          )
        )[0];
        assert.ok("issue_id" in (await processRenderJob(job.id)));
        const successor = await packRow();
        assert.notEqual(successor.current_issue_id, originalIssue.id);
        assert.equal(
          (
            await rows("SELECT * FROM ppo.pack_issues WHERE pack_id=$1", [
              q.pack.id,
            ])
          ).length,
          2,
        );
        assert.deepEqual(
          await readBundle(q.p, originalIssue.manifest),
          originalOutput,
        );
        await originalsUnchanged();
        t.diagnostic(
          JSON.stringify({
            step: "explicit-reconciliation",
            old_source: s.id,
            new_source: candidate.id,
            old_item: key.item_id,
            new_item: movedItem,
            source_hash: key.sha256,
            original_issue: originalIssue.id,
            successor_issue: successor.current_issue_id,
            original_pdf_hash: digest(originalOutput.pdf),
          }),
        );
      },
    );
    await t.test(
      "a missing version and different bytes at the same item never become latest-version substitutes",
      async () => {
        const held = movedPath + ".retained";
        await moveWithinStore(movedPath, held);
        try {
          await failedAmendment(candidate.id, "ExactDocumentUnavailable");
          const latest = Buffer.from(originalBytes);
          latest[0] = latest[0] === 83 ? 84 : 83;
          await writeFile(movedPath, latest, { flag: "wx" });
          assert.notEqual(digest(latest), movedKey.sha256);
          assert.deepEqual(
            Buffer.from(
              await documentStore().read(context, {
                ...movedKey,
                version_id: digest(latest),
                sha256: digest(latest),
              }),
            ),
            latest,
          );
          await failedAmendment(candidate.id, "ExactDocumentUnavailable");
          await moveWithinStore(movedPath, movedPath + ".unapproved");
        } finally {
          // Restore the recorded original, including when an assertion fails after replacement.
          await writeFile(movedPath, originalBytes);
        }
        assert.deepEqual(
          Buffer.from(await documentStore().read(context, movedKey)),
          originalBytes,
        );
        assert.deepEqual(
          await readBundle(q.p, originalIssue.manifest),
          originalOutput,
        );
        await originalsUnchanged();
      },
    );
  } finally {
    await writeFile(originalPath, originalBytes);
  }
});

test("PT-18 joined source movement preserves issued pack/report/Finance bytes and access boundaries", async (t) => {
  await fresh();
  const q = await reconciledFinance(),
    report = q.q.report;
  const h = (
    await rows("SELECT * FROM ppo.finance_handoffs WHERE id=$1", [q.id])
  )[0];
  const review = (
    await rows("SELECT id FROM ppo.finance_reviews WHERE handoff_id=$1", [q.id])
  )[0];
  const reconciliation = (
    await rows(
      "SELECT id FROM ppo.finance_reconciliations WHERE handoff_id=$1",
      [q.id],
    )
  )[0];
  await requestFinanceEvidence(q.reconciler, q.id, {
    ...base(),
    expected_version: h.version,
    revision_id: h.current_revision_id,
    review_id: review.id,
    reconciliation_id: reconciliation.id,
  });
  const job = (
    await rows("SELECT * FROM ppo.finance_render_jobs WHERE handoff_id=$1", [
      q.id,
    ])
  )[0];
  assert.ok("issue_id" in (await processFinanceJob(job.id)));
  const fi = (
    await rows("SELECT * FROM ppo.finance_issues WHERE handoff_id=$1", [q.id])
  )[0];
  const ri = (
    await rows("SELECT * FROM ppo.report_issues WHERE report_id=$1", [
      report.id,
    ])
  )[0];
  const pi = (
    await rows("SELECT * FROM ppo.pack_issues WHERE pack_id=$1", [q.q.pack.id])
  )[0];
  const presentation = (
    await rows("SELECT id FROM ppo.report_presentations WHERE issue_id=$1", [
      ri.id,
    ])
  )[0];
  const source = (
    await rows("SELECT * FROM ppo.pack_sources WHERE id=$1", [id("c2")])
  )[0];
  const key = sourceKey(source),
    context = { ...q.p, operation_id: key.item_id };
  const bytes = Buffer.from(await documentStore().read(context, key));
  const sourcePath = privatePath(q.p.workspace_id, key.item_id);
  const sessions = Object.fromEntries(
    await Promise.all(
      [
        "coordinator",
        "assigned-technician",
        "finance-reconciler",
        "systems",
        "second-company",
        "other-workspace",
      ].map(async (p) => [p, await createSession(p)]),
    ),
  );
  const gateway = randomUUID(),
    origin = localConfig().origin;
  process.env.PPO_LOCAL_GATEWAY = gateway;
  const invoke = (
    handler: (r: NextRequest, c: RouteContext) => Promise<Response>,
    record: string,
    query = "",
    profile = "coordinator",
  ) =>
    withRequestScope(() =>
      handler(
        new NextRequest(`${origin}/proof/${record}${query}`, {
          headers: {
            "x-ppo-local-gateway": gateway,
            cookie: `${sessionCookie}=${sessions[profile]?.token ?? ""}`,
          },
        }),
        { params: Promise.resolve({ id: record }) },
      ),
    );
  const outputs = [
    {
      name: "pack",
      issue: pi,
      profile: "coordinator",
      get: (f: "html" | "pdf", p: string) => invoke(issueFile(f), pi.id, "", p),
    },
    {
      name: "report",
      issue: ri,
      profile: "assigned-technician",
      get: (f: "html" | "pdf", p: string) =>
        invoke(
          reportFile(f),
          report.id,
          `?presentation_id=${presentation.id}`,
          p,
        ),
    },
    {
      name: "finance",
      issue: fi,
      profile: "finance-reconciler",
      get: (f: "html" | "pdf", p: string) =>
        invoke(financeFile, fi.id, `?format=${f}`, p),
    },
  ];
  const canaries = [
    "CONFIDENTIAL-MARGIN",
    "PRIVATE_FINANCE_CANARY",
    "SYN-inspection.png",
    "SYN exact factual evidence checked",
  ];
  const originalsUnchanged = await preserve([
    ...retainedTables,
    "packs",
    "service_reports",
    "finance_handoffs",
    "field_entries",
    "work_orders",
  ]);
  const counts = async () =>
    rows(
      "SELECT (SELECT count(*) FROM ppo.pack_issues)::int packs,(SELECT count(*) FROM ppo.report_issues)::int reports,(SELECT count(*) FROM ppo.finance_issues)::int finance,(SELECT count(*) FROM ppo.operation_receipts)::int receipts,(SELECT count(*) FROM ppo.audit_events)::int audits,(SELECT count(*) FROM ppo.outbox_jobs)::int outbox",
    );
  const originalCounts = await counts();
  const originals = new Map<string, Buffer>();
  const verifyOutputs = async (step: string) => {
    for (const output of outputs)
      for (const format of ["html", "pdf"] as const) {
        const response = await output.get(format, output.profile);
        assert.equal(response.status, 200);
        assert.match(
          response.headers.get("cache-control") ?? "",
          /private.*no-store|no-store.*private/,
        );
        const actual = Buffer.from(await response.arrayBuffer()),
          expected = output.issue.manifest;
        assert.equal(digest(actual), expected[`${format}_hash`]);
        assert.equal(actual.length, expected[`${format}_bytes`]);
        const name = `${output.name}-${format}`;
        if (originals.has(name)) assert.deepEqual(actual, originals.get(name));
        else originals.set(name, actual);
        if (output.name !== "finance" && format === "html")
          for (const canary of canaries)
            assert.equal(actual.toString().includes(canary), false);
      }
    for (const response of [
      await invoke(issueFile("manifest"), pi.id),
      await invoke(
        reportFile("manifest"),
        report.id,
        `?presentation_id=${presentation.id}`,
        "assigned-technician",
      ),
    ]) {
      assert.equal(response.status, 200);
      const text = await response.text();
      for (const canary of canaries) assert.equal(text.includes(canary), false);
    }
    await originalsUnchanged();
    assert.deepEqual(await counts(), originalCounts);
    t.diagnostic(
      JSON.stringify({
        step,
        source: source.id,
        item: key.item_id,
        version: key.version_id,
        outputs: outputs.map((o) => ({
          kind: o.name,
          issue: o.issue.id,
          html_hash: o.issue.manifest.html_hash,
          pdf_hash: o.issue.manifest.pdf_hash,
        })),
      }),
    );
  };
  await verifyOutputs("original");
  await t.test(
    "renamed display metadata still resolves the same exact source identity",
    async () => {
      await database().query(
        "UPDATE ppo.pack_source_locations SET display_name='SYN PT18 renamed reference.txt',version=version+1 WHERE source_id=$1",
        [source.id],
      );
      const list = await availableSources(
        database(),
        q.q.reviewer,
        source.company_id,
        source.site_id,
      );
      assert.equal(
        list.find((s) => s.id === source.id)?.display_name,
        "SYN PT18 renamed reference.txt",
      );
      assert.deepEqual(
        Buffer.from(await documentStore().read(context, key)),
        bytes,
      );
      await verifyOutputs("renamed");
    },
  );
  await t.test(
    "real identity-changing move and unavailable version leave all issued outputs exact",
    async () => {
      const moved = privatePath(q.p.workspace_id, randomUUID());
      await moveWithinStore(sourcePath, moved);
      try {
        await assert.rejects(
          documentStore().read(context, key),
          code("ExactDocumentUnavailable"),
        );
        await verifyOutputs("source-identity-moved");
      } finally {
        await moveWithinStore(moved, sourcePath);
      }
      const held = sourcePath + ".retained";
      await moveWithinStore(sourcePath, held);
      try {
        const latest = Buffer.from(bytes);
        latest[0] = latest[0] === 83 ? 84 : 83;
        await writeFile(sourcePath, latest, { flag: "wx" });
        await assert.rejects(
          documentStore().read(context, key),
          code("ExactDocumentUnavailable"),
        );
        await verifyOutputs("original-version-unavailable-new-bytes-present");
        await moveWithinStore(sourcePath, sourcePath + ".unapproved");
      } finally {
        await writeFile(sourcePath, bytes);
      }
      assert.deepEqual(
        Buffer.from(await documentStore().read(context, key)),
        bytes,
      );
      await verifyOutputs("source-recovered");
    },
  );
  await t.test(
    "restricted and anonymous identities receive no Finance or internal output metadata",
    async () => {
      const forbidden = [
        fi.id,
        fi.manifest.filename,
        fi.manifest.pdf_hash,
        fi.manifest.html_hash,
        ...canaries,
      ];
      const denied = async (response: Response, statuses = [403, 404]) => {
        assert.ok(statuses.includes(response.status));
        assert.match(
          response.headers.get("cache-control") ?? "",
          /private.*no-store|no-store.*private/,
        );
        assert.equal(response.headers.has("content-disposition"), false);
        assert.equal(response.headers.has("x-content-sha256"), false);
        const text = await response.text();
        for (const secret of forbidden)
          assert.equal(text.includes(secret), false);
      };
      for (const format of ["html", "pdf"] as const) {
        for (const profile of [
          "assigned-technician",
          "coordinator",
          "systems",
          "second-company",
          "other-workspace",
        ])
          await denied(await outputs[2].get(format, profile));
        for (const output of outputs)
          await denied(await output.get(format, "anonymous"), [401]);
      }
      await denied(
        await invoke(previewPack, q.q.pack.id, "", "assigned-technician"),
      );
      await verifyOutputs("restricted-access");
    },
  );
  for (const output of outputs)
    await t.test(
      `missing retained ${output.name} bundle fails closed, then recovers without reissue`,
      async () => {
        const path = privatePath(
            q.p.workspace_id,
            output.issue.manifest.store_key.item_id,
          ),
          held = path + ".retained";
        await moveWithinStore(path, held);
        try {
          for (const format of ["html", "pdf"] as const) {
            const response = await output.get(format, output.profile);
            assert.equal(response.status, 503);
            assert.equal(response.headers.has("content-disposition"), false);
            assert.equal(response.headers.has("x-content-sha256"), false);
            const error = await response.json();
            assert.equal(error.code, "ExactDocumentUnavailable");
            assert.equal(error.retryable, true);
            assert.match(error.message, /original reference.*owner/);
          }
          await originalsUnchanged();
          assert.deepEqual(await counts(), originalCounts);
        } finally {
          await moveWithinStore(held, path);
        }
        await verifyOutputs(`${output.name}-bundle-restored`);
      },
    );
});
