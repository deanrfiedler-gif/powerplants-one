import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { reportIssued } from "../helpers/reports";
import { outputSnapshot } from "../helpers/output-register";
import { digest } from "../../src/documents/store";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
const origin = localConfig().origin,
  h = httpAcceptance(origin);

test("DK03-HTTP01 compiled consolidated register, exact native bytes and scoped GET-only contract", async () => {
  const q = await reportIssued();
  // Authentication has its own audit event; establish sessions before the read-only baseline.
  for (const profile of ["coordinator", "second-company", "systems"])
    await h.cookie(profile);
  const cookie = await h.cookie("coordinator"),
    before = await outputSnapshot();
  const path = "document-outputs/" + q.report.id + "?kind=ServiceReport";
  const register = await h.call("coordinator", "document-outputs");
  assert.equal(register.status, 200);
  assert.equal(register.body.total_matching, 2);
  const packRow = register.body.items.find(
      (r: { kind: string }) => r.kind === "JobPack",
    ),
    reportRow = register.body.items.find(
      (r: { kind: string }) => r.kind === "ServiceReport",
    );
  assert.deepEqual(packRow.recipient_summary, {
    visibility: "AllRecipients",
    recipient_count: 2,
    acknowledged_count: 2,
    required_recipient_count: 2,
    required_acknowledged_count: 2,
  });
  assert.equal(reportRow.recipient_summary.visibility, "FrozenReportRecipient");
  assert.equal(reportRow.recipient_summary.recipient_count, 1);
  assert.equal(reportRow.recipient_summary.acknowledged_count, null);
  for (const row of [packRow, reportRow]) {
    assert.equal(row.current_revision_number, 1);
    assert.equal(row.current_issue.revision_number, 1);
    assert.equal(row.preparation.revision_number, 1);
  }
  const one = await h.call("coordinator", path);
  assert.equal(one.status, 200);
  assert.equal(one.body.availability, "Available");
  assert.equal(one.body.selected_issue.id, q.report.issues[0].id);
  assert.equal((await h.call("second-company", path)).status, 403);
  assert.equal(
    (
      await h.call(
        "second-company",
        "document-outputs/" + q.pack.id + "?kind=JobPack",
      )
    ).status,
    404,
  );
  assert.equal((await h.call("systems", "document-outputs")).status, 403);
  assert.equal(
    (await h.call("coordinator", path + "&issue_id=" + randomUUID())).status,
    404,
  );
  for (const query of [
    "limit=51",
    "offset=-1",
    "kind=Invoice",
    "q=%00",
    "unexpected=1",
  ])
    assert.equal(
      (await h.call("coordinator", "document-outputs?" + query)).status,
      422,
    );
  assert.equal(
    (await h.call("coordinator", "document-outputs/" + q.pack.id)).status,
    422,
  );
  assert.equal(
    (await h.call("coordinator", "document-outputs/latest?kind=JobPack"))
      .status,
    422,
  );
  assert.deepEqual(await outputSnapshot(), before);
  const file = await fetch(origin + one.body.selected_issue.files.pdf, {
    headers: { cookie },
  });
  assert.equal(file.status, 200);
  assert.equal(file.headers.get("cache-control"), "private, no-store");
  assert.equal(file.headers.get("content-type"), "application/pdf");
  assert.equal(
    digest(new Uint8Array(await file.arrayBuffer())),
    one.body.selected_issue.exact.pdf_hash,
  );
  const post = await fetch(origin + "/api/v1/document-outputs", {
    method: "POST",
    headers: { cookie, origin, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(post.status, 405);
  assert.deepEqual(await outputSnapshot(), before);
});
