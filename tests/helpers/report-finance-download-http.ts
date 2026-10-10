// Real HTTP transport and route adapters on a test-owned loopback server.
// This does not exercise compiled Next routing, browser UI or a live ERP.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { createSession, sessionCookie } from "../../src/platform/identity";
import type { Capability } from "../../src/platform/permissions";
import { withRequestScope } from "../../src/platform/working-company";
import { AppError } from "../../src/platform/errors";
import type { RouteContext } from "../../src/shared/http";
import { GET as html } from "../../src/app/api/v1/reports/[id]/html/route";
import { GET as pdf } from "../../src/app/api/v1/reports/[id]/pdf/route";
import { GET as manifest } from "../../src/app/api/v1/reports/[id]/manifest/route";
import { GET as generated } from "../../src/app/api/v1/report-render-jobs/[id]/output/route";
import { GET as finance } from "../../src/app/api/v1/finance/issues/[id]/bytes/route";
import { digest, LocalSyntheticDocumentStore } from "../../src/documents/store";
import {
  processFinanceJob,
  requestFinanceEvidence,
} from "../../src/finance/worker";
import { reconciledFinance, base, rows } from "./finance";

const routes: Record<
  string,
  (r: NextRequest, c: RouteContext) => Promise<Response>
> = {
  html,
  pdf,
  manifest,
  generated,
  finance,
};

test("Service and Finance output checks current authority after private storage", async (t) => {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable synthetic database required");
  t.after(closeDatabase);
  process.env.PPO_ALLOW_RESET = "dispose-synthetic";
  process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset();
  const q = await reconciledFinance();
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
  const financeJob = (
    await rows("SELECT * FROM ppo.finance_render_jobs WHERE handoff_id=$1", [
      q.id,
    ])
  )[0];
  assert.ok("issue_id" in (await processFinanceJob(financeJob.id)));
  const financeIssue = (
    await rows("SELECT * FROM ppo.finance_issues WHERE handoff_id=$1", [q.id])
  )[0];
  const reportIssue = (
    await rows("SELECT * FROM ppo.report_issues WHERE report_id=$1", [
      q.q.report.id,
    ])
  )[0];
  const reportJob = (
    await rows("SELECT * FROM ppo.report_render_jobs WHERE report_id=$1", [
      q.q.report.id,
    ])
  )[0];
  const presentation = (
    await rows("SELECT * FROM ppo.report_presentations WHERE issue_id=$1", [
      reportIssue.id,
    ])
  )[0];
  const origin = localConfig().origin,
    gateway = randomUUID();
  process.env.PPO_LOCAL_GATEWAY = gateway;
  const sessions = Object.fromEntries(
    await Promise.all(
      [
        "assigned-technician",
        "coordinator",
        "finance-reconciler",
        "systems",
        "second-company",
        "other-workspace",
      ].map(async (profile) => [profile, await createSession(profile)]),
    ),
  );
  const server = createServer(async (req, res) => {
    try {
      const [route, id = ""] = new URL(req.url ?? "/", origin).pathname
        .slice(1)
        .split("/");
      const handler = routes[route];
      if (!handler) {
        res.writeHead(404);
        res.end();
        return;
      }
      const request = new NextRequest(origin + req.url, {
        headers: req.headers as Record<string, string>,
      });
      const response = await withRequestScope(() =>
        handler(request, { params: Promise.resolve({ id }) }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end("Test harness failed");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const call = (path: string, profile: string) =>
    fetch(`http://127.0.0.1:${address.port}${path}`, {
      headers: {
        "x-ppo-local-gateway": gateway,
        origin,
        cookie: `${sessionCookie}=${sessions[profile].token}`,
      },
    });
  const secrets = [
    reportIssue.id,
    financeIssue.id,
    reportJob.id,
    financeJob.id,
    ...[reportIssue, financeIssue].flatMap((i) => [
      i.manifest.filename,
      i.manifest.pdf_hash,
      i.manifest.html_hash,
    ]),
  ];
  function privateResponse(response: Response) {
    assert.match(response.headers.get("cache-control") ?? "", /private/);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  }
  async function refused(response: Response, statuses = [403, 404]) {
    assert.ok(
      statuses.includes(response.status),
      `Expected ${statuses.join("/")}; got ${response.status}`,
    );
    privateResponse(response);
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.equal(response.headers.has("content-disposition"), false);
    assert.equal(response.headers.has("x-content-sha256"), false);
    const body = await response.text(),
      headers = JSON.stringify([...response.headers]);
    for (const secret of secrets) {
      assert.equal(
        body.includes(secret),
        false,
        "Restricted value in error body",
      );
      assert.equal(
        headers.includes(secret),
        false,
        "Restricted value in error headers",
      );
    }
    assert.equal(body.includes("%PDF-"), false);
    assert.equal(body.includes("<!DOCTYPE"), false);
    return JSON.parse(body);
  }
  const outputs = [
    {
      name: "issued Service report",
      profile: "assigned-technician",
      issue: reportIssue,
      path: (format: string) =>
        `/${format}/${q.q.report.id}?presentation_id=${presentation.id}`,
    },
    {
      name: "generated Service report",
      profile: "coordinator",
      issue: reportIssue,
      path: (format: string) => `/generated/${reportJob.id}?kind=${format}`,
    },
    {
      name: "Finance evidence",
      profile: "finance-reconciler",
      issue: financeIssue,
      path: (format: string) => `/finance/${financeIssue.id}?format=${format}`,
    },
  ];
  async function exact(
    output: (typeof outputs)[number],
    format: "html" | "pdf",
  ) {
    const response = await call(output.path(format), output.profile);
    assert.equal(response.status, 200, await response.clone().text());
    privateResponse(response);
    assert.match(
      response.headers.get("content-type") ?? "",
      format === "pdf" ? /application\/pdf/ : /text\/html/,
    );
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(digest(bytes), output.issue.manifest[`${format}_hash`]);
    assert.equal(bytes.length, output.issue.manifest[`${format}_bytes`]);
    if (output.name === "Finance evidence") {
      assert.equal(response.headers.get("x-content-sha256"), digest(bytes));
      assert.ok(
        response.headers
          .get("content-disposition")
          ?.includes(
            output.issue.manifest.filename.replace(/\.pdf$/, `.${format}`),
          ),
      );
    }
    return bytes;
  }
  // Snapshot whole rows, including issue identities, hashes, attempts, receipts and
  // business versions. Access/session bookkeeping is intentionally not business state.
  const tables = [
    "service_reports",
    "report_revisions",
    "report_reviews",
    "report_issues",
    "report_presentations",
    "report_render_jobs",
    "finance_handoffs",
    "finance_revisions",
    "finance_reviews",
    "finance_reconciliations",
    "finance_outcomes",
    "finance_issues",
    "finance_render_jobs",
    "field_entries",
    "work_orders",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "activities",
  ];
  const snapshot = async () =>
    Promise.all(
      tables.map(async (table) => ({
        table,
        rows: await rows(
          `SELECT to_jsonb(r) AS row FROM ppo.${table} r ORDER BY to_jsonb(r)::text`,
        ),
      })),
    );
  const saved = await snapshot();
  const originalRead = LocalSyntheticDocumentStore.prototype.read;
  try {
    await t.test(
      "current role, company and workspace refusals expose no original bytes or metadata",
      async () => {
        for (const output of outputs)
          for (const format of ["html", "pdf"] as const) {
            await exact(output, format);
            for (const profile of [
              "systems",
              "second-company",
              "other-workspace",
            ])
              await refused(await call(output.path(format), profile));
          }
        for (const format of ["html", "pdf"] as const) {
          await refused(
            await call(outputs[1].path(format), "assigned-technician"),
          );
          await refused(await call(outputs[2].path(format), "coordinator"));
          await refused(
            await call(outputs[2].path(format), "assigned-technician"),
          );
        }
        assert.deepEqual(await snapshot(), saved);
      },
    );
    const challenges: {
      output: (typeof outputs)[number];
      capability: Capability;
    }[] = [
      { output: outputs[0], capability: "report.read" },
      { output: outputs[0], capability: "field.read.own" },
      { output: outputs[1], capability: "report.issue" },
      { output: outputs[1], capability: "report.read" },
      { output: outputs[2], capability: "finance.read" },
      { output: outputs[2], capability: "shared.finance.read" },
    ];
    for (const { output, capability } of challenges)
      for (const format of ["html", "pdf"] as const) {
        await t.test(
          `${output.name} ${format}: revoke ${capability} during storage, then recover the same original`,
          async (sub) => {
            const original = await exact(output, format);
            const actor = sessions[output.profile].principal.actor_id;
            const grants = await rows(
              "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2",
              [actor, capability],
            );
            assert.ok(grants.length > 0);
            let challenged = 0;
            const hook = sub.mock.method(
              LocalSyntheticDocumentStore.prototype,
              "read",
              async function (
                this: LocalSyntheticDocumentStore,
                ...args: Parameters<typeof originalRead>
              ) {
                const bytes = await originalRead.apply(this, args);
                challenged++;
                await database().query(
                  "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability=$2",
                  [actor, capability],
                );
                return bytes;
              },
            );
            try {
              await refused(await call(output.path(format), output.profile));
              assert.equal(
                challenged,
                1,
                "Revocation actually occurred inside the storage read",
              );
              await refused(await call(output.path(format), output.profile));
              assert.equal(
                challenged,
                1,
                "Already revoked authority must fail before storage",
              );
              assert.deepEqual(await snapshot(), saved);
            } finally {
              hook.mock.restore();
              for (const grant of grants)
                await database().query(
                  "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
                  [grant.id, grant.valid_to],
                );
            }
            assert.deepEqual(await exact(output, format), original);
            assert.deepEqual(await snapshot(), saved);
          },
        );
      }
    await t.test(
      "issued report manifest also refuses authority lost during storage",
      async (sub) => {
        const actor = sessions["assigned-technician"].principal.actor_id;
        const grants = await rows(
          "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='report.read'",
          [actor],
        );
        const path = `/manifest/${q.q.report.id}?presentation_id=${presentation.id}`;
        const original = await call(path, "assigned-technician");
        assert.equal(original.status, 200);
        const metadata = await original.json();
        let challenged = false;
        const hook = sub.mock.method(
          LocalSyntheticDocumentStore.prototype,
          "read",
          async function (
            this: LocalSyntheticDocumentStore,
            ...args: Parameters<typeof originalRead>
          ) {
            const bytes = await originalRead.apply(this, args);
            challenged = true;
            await database().query(
              "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='report.read'",
              [actor],
            );
            return bytes;
          },
        );
        try {
          await refused(await call(path, "assigned-technician"));
          assert.equal(challenged, true);
        } finally {
          hook.mock.restore();
          for (const grant of grants)
            await database().query(
              "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
              [grant.id, grant.valid_to],
            );
        }
        assert.deepEqual(
          await (await call(path, "assigned-technician")).json(),
          metadata,
        );
        assert.deepEqual(await snapshot(), saved);
      },
    );
    for (const fault of ["missing", "corrupt"] as const)
      await t.test(
        `${fault} storage refuses output and recovers original without reissuing`,
        async (sub) => {
          // Only the adapter result is injected; the original private stored bundle stays intact.
          let challenged = 0;
          const hook = sub.mock.method(
            LocalSyntheticDocumentStore.prototype,
            "read",
            async function (
              this: LocalSyntheticDocumentStore,
              ...args: Parameters<typeof originalRead>
            ) {
              const bytes = Buffer.from(await originalRead.apply(this, args));
              challenged++;
              if (fault === "missing")
                throw new AppError(
                  503,
                  "ExactDocumentUnavailable",
                  "SYN exact storage unavailable",
                );
              // Valid JSON and unchanged length, but the payload no longer matches its retained hash.
            const bundle = JSON.parse(bytes.toString("utf8"));
            assert.ok(bundle.html.startsWith("<"));
            bundle.html = "!" + bundle.html.slice(1);
            const corrupt = Buffer.from(JSON.stringify(bundle));
            assert.equal(corrupt.length, bytes.length);
            return corrupt;
            },
          );
          try {
            for (const output of outputs)
              for (const format of ["html", "pdf"] as const) {
                const error = await refused(
                  await call(output.path(format), output.profile),
                  [409, 503],
                );
                assert.ok(
                  JSON.stringify(error).includes("ExactDocumentUnavailable"),
                );
              }
            assert.equal(challenged, 6);
            assert.deepEqual(await snapshot(), saved);
          } finally {
            hook.mock.restore();
          }
          for (const output of outputs)
            for (const format of ["html", "pdf"] as const)
              await exact(output, format);
          assert.deepEqual(await snapshot(), saved);
        },
      );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
});
