import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { financeHttpSource, httpFinanceDraft } from "../helpers/finance-http";
import { base } from "../helpers/field";

// The full gate runs after the retained HTTP suite with its same guarded server;
// a focused diagnostic job runs this case alone from fresh seed. It creates its
// own dated source and never resets shared concurrent test records.
const origin = "http://127.0.0.1:3000";
const root = "verification-evidence/p11-http";
const digest = (b: Uint8Array | string) =>
  createHash("sha256").update(b).digest("hex");

test(
  "P11 real issued Finance bytes, exact original receipt and every exposed projection retain server-derived access",
  { timeout: 240000 },
  async () => {
    let cookie = "";
    const observations: Record<string, unknown>[] = [];
    async function response(
      path: string,
      body?: unknown,
      extra: Record<string, string> = {},
    ) {
      return fetch(origin + "/api/v1/" + path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Cookie: cookie,
          ...extra,
          ...(body === undefined
            ? {}
            : { Origin: origin, "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    }
    async function call(path: string, body?: unknown) {
      const r = await response(path, body);
      const value = await r.json();
      assert.ok(r.ok, `${path}: ${JSON.stringify(value)}`);
      if (path === "local-session" && body !== undefined)
        cookie = r.headers.get("set-cookie")!.split(";")[0];
      return value;
    }
    const source = await financeHttpSource(async (path, body) => {
      if (/^reports\/[^/]+\/review$/.test(path))
        body = { ...(body as Record<string, unknown>), remarks: "SYN P11_PRIVATE_REVIEW_CANARY internal Service assessment" };
      return call(path, body);
    }, "2026-11-17", 101);
    const input = await httpFinanceDraft(call, source, "SyntheticManual");
    input.treatment_basis += " SYN-P11-HTTP-FINANCE-PRIVATE-CANARY";
    const original = await call("finance/handoffs", input);
    assert.deepEqual(await call("finance/handoffs", input), original);
    assert.deepEqual(await call(`operations/${input.operation_id}`), original);
    const path = `finance/handoffs/${input.id}`;
    let r = await call(path);
    await call(`${path}/submit`, {
      ...base(),
      expected_version: r.handoff.version,
    });
    await call("local-session", { profile: "finance-reviewer" });
    r = await call(path);
    await call(`${path}/review`, {
      ...base(),
      expected_version: r.handoff.version,
      revision_id: r.revisions[0].id,
      source_hash: r.revisions[0].source_hash,
      decision: "Approved",
    });
    await call("local-session", { profile: "finance-processor" });
    r = await call(path);
    await call(`${path}/begin-processing`, {
      ...base(),
      expected_version: r.handoff.version,
      scenario: "Accepted",
    });
    r = await call(path);
    await call(`${path}/record-outcome`, {
      ...base(),
      expected_version: r.handoff.version,
      attempt_id: r.handoff.active_attempt_id,
      action: "Dispatch",
    });
    await call("local-session", { profile: "finance-reconciler" });
    r = await call(path);
    await call(`${path}/reconcile`, {
      ...base(),
      expected_version: r.handoff.version,
      outcome_id: r.outcomes[0].id,
      basis:
        "SYN independently check exact 60 MIN and 2 EA; retain reviewed 30 MIN non-billable with no posting.",
    });
    r = await call(path);
    const issueCommand = {
      ...base(),
      expected_version: r.handoff.version,
      revision_id: r.revisions[0].id,
      review_id: r.reviews[0].id,
      reconciliation_id: r.reconciliations[0].id,
    };
    const requested = await call(`${path}/request-evidence`, issueCommand);
    r = await call(path);
    await call(`finance/jobs/${r.jobs[0].id}/retry`, {});
    r = await call(path);
    assert.equal(r.handoff.status, "Reconciled");
    assert.equal(r.issues.length, 1);
    assert.equal(r.targets.length, 1);
    assert.deepEqual(
      await call(`operations/${issueCommand.operation_id}`),
      requested,
    );
    const issue = r.issues[0],
      jobId = r.jobs[0].id,
      targetId = r.targets[0].id;
    const restricted = [
      "SYN-P11-HTTP-FINANCE-PRIVATE-CANARY",
      "P11_PRIVATE_REVIEW_CANARY",
      r.handoff.display_number,
      issue.id,
      targetId,
      issue.manifest.filename,
      issue.manifest.pdf_hash,
    ];
    await mkdir(root, { recursive: true });
    for (const format of ["html", "pdf"]) {
      const output = await response(
        `finance/issues/${issue.id}/bytes?format=${format}`,
      );
      assert.equal(output.status, 200);
      assert.match(output.headers.get("cache-control")!, /no-store/);
      const bytes = Buffer.from(await output.arrayBuffer());
      assert.equal(digest(bytes), issue.manifest[`${format}_hash`]);
      assert.equal(bytes.length, issue.manifest[`${format}_bytes`]);
      if (format === "html")
        assert.ok(bytes.toString().includes(restricted[0]));
      await writeFile(`${root}/OUT-14-original.${format}`, bytes);
      observations.push({
        actor: "finance-reconciler",
        format,
        status: 200,
        byte_count: bytes.length,
        sha256: digest(bytes),
      });
    }
    for (const unknown of [
      "role=Finance",
      `actor_id=${randomUUID()}`,
      `account_id=${input.account_id}`,
      `source_id=${source.report_id}`,
      `target_id=${targetId}`,
      "format=pdf&format=html",
    ]) {
      const output = await response(
        `finance/issues/${issue.id}/bytes?${unknown}`,
      );
      assert.equal(output.status, 422, unknown);
    }
    for (const profile of [
      "assigned-technician",
      "coordinator",
      "systems",
      "other-workspace",
      "second-company",
    ]) {
      await call("local-session", { profile });
      for (const restrictedPath of [
        path,
        `finance/work-orders/${source.work_order_id}/sources`,
        `finance/issues/${issue.id}/bytes?format=html`,
        `finance/issues/${issue.id}/bytes?format=pdf`,
        `customers/50000000-0000-4000-8000-000000000001/account-observations?account_id=${input.account_id}`,
        `operations/${input.operation_id}`,
        `operations/${issueCommand.operation_id}`,
      ]) {
        const denied = await response(restrictedPath, undefined, {
          "X-Actor-Id": r.handoff.created_by,
          "X-Role": "Finance",
        });
        const text = await denied.text();
        assert.ok(
          [403, 404].includes(denied.status),
          `${profile}:${restrictedPath}:${denied.status}`,
        );
        assert.match(denied.headers.get("cache-control")!, /no-store/);
        assert.equal(denied.headers.has("content-disposition"), false);
        for (const secret of restricted)
          assert.ok(
            !text.includes(secret),
            `${profile}:${restrictedPath}: body`,
          );
        for (const secret of restricted)
          assert.ok(
            !JSON.stringify([...denied.headers]).includes(secret),
            `${profile}:${restrictedPath}: header`,
          );
        observations.push({
          actor: profile,
          route: restrictedPath,
          status: denied.status,
          error: JSON.parse(text).code,
          byte_count: Buffer.byteLength(text),
          sha256: digest(text),
        });
      }
      const worker = await response(`finance/jobs/${jobId}/retry`, {});
      assert.ok([403, 404].includes(worker.status));
      for (const publicProjection of [
        "customers?q=SYN-P11-HTTP-FINANCE-PRIVATE-CANARY",
        "work?q=SYN-P11-HTTP-FINANCE-PRIVATE-CANARY",
        "search?q=SYN-P11-HTTP-FINANCE-PRIVATE-CANARY",
        "notifications",
        `exports/finance/${input.id}`,
        `finance/targets/${targetId}`,
      ]) {
        const output = await response(publicProjection);
        const text = await output.text();
        assert.ok(
          [200, 403, 404].includes(output.status),
          `${profile}:${publicProjection}:${output.status}`,
        );
        if (
          ["search?", "notifications", "exports/", "finance/targets/"].some(
            (prefix) => publicProjection.startsWith(prefix),
          )
        )
          assert.equal(
            output.status,
            404,
            "Unimplemented distribution/target routes must not become successful",
          );
        // A search query can appear in a generic page's client route metadata;
        // restricted results, target identities and output names must never do so.
        for (const secret of restricted.slice(1))
          if (!publicProjection.includes(secret))
            assert.ok(!text.includes(secret), `${profile}:${publicProjection}`);
        if (output.status === 200)
          assert.ok(
            !text.includes(restricted[0]),
            `${profile}: restricted search result`,
          );
        observations.push({
          actor: profile,
          route: publicProjection,
          status: output.status,
          byte_count: Buffer.byteLength(text),
          sha256: digest(text),
        });
      }
    }
    await call("local-session", { profile: "assigned-technician" });
    const technicianReport = (await call(`reports/${source.report_id}`)).items[0];
    const issuedPresentation = technicianReport.presentations.find(
      (p: { kind: string; issue_id: string }) => p.kind === "IssuedReport" && p.issue_id === technicianReport.issues[0].id,
    );
    assert.ok(issuedPresentation, "Select the exact issued presentation from the permitted report");
    assert.equal((await response(`reports/${source.report_id}/html`)).status, 422, "A missing presentation identity must never select latest bytes implicitly");
    for (const path of [
      `reports/${source.report_id}`,
      `reports/${source.report_id}/html?presentation_id=${issuedPresentation.id}`,
      "my-jobs",
      "sites/70000000-0000-4000-8000-000000000001",
    ]) {
      const output = await response(path);
      assert.equal(output.status, 200, path);
      const text = await output.text();
      if (path.includes("/html?")) assert.equal(digest(text), issuedPresentation.content_hash);
      for (const secret of restricted) assert.ok(!text.includes(secret), path);
    }
    const otherSite = await response(
      "sites/70000000-0000-4000-8000-000000000002",
    );
    assert.equal(otherSite.status, 404);
    await call("local-session", { profile: "finance-reconciler" });
    const final = await call(path);
    assert.deepEqual(final.issues, r.issues);
    assert.deepEqual(final.targets, r.targets);
    assert.deepEqual(final.attempts, r.attempts);
    await writeFile(
      `${root}/proof.json`,
      JSON.stringify(
        {
          source_head: process.env.PPO_SOURCE_HEAD,
          executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim(),
          executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
            encoding: "utf8",
          }).trim(),
          run_id: process.env.GITHUB_RUN_ID,
          run_attempt: process.env.GITHUB_RUN_ATTEMPT,
          scope:
            "Real HTTP component; exact available SyntheticManual OUT-14, receipts, server-derived grants and exposed/absent projections. No customer identity, distribution or full PT claimed.",
          source,
          handoff_id: input.id,
          manifest: issue.manifest,
          observations,
        },
        null,
        2,
      ),
    );
  },
);
