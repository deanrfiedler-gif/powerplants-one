import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import {
  listQuotations,
  readQuotation,
} from "../../src/estimating/quotations/reads";
import { readRelease } from "../../src/estimating/release/reads";
import {
  prepareRelease,
  approveRelease,
  issueRelease,
  recordDistribution,
} from "../../src/estimating/release/service";
import { readResponse } from "../../src/estimating/response/reads";
import { recordResponse } from "../../src/estimating/response/service";
import { executeConversion } from "../../src/estimating/conversion/service";
import {
  prepareQuote,
  saveEstimate,
  createEstimate,
} from "../../src/estimating/service";
import { createOpportunity } from "../../src/crm/opportunities";
import { retryQuote } from "../../src/estimating/worker";
import {
  releaseFixture,
  prepared,
  approved,
  approval,
  issue,
  preparation,
  releaseCommand,
} from "./quotation-release";
import { responseFixture, response } from "./quotation-response";
import { plannedFixture, conversion } from "./quotation-conversion";
import { quoteCommand, estimateInput } from "./estimating";
import { CRM, crmBase, crmCreate } from "./crm";

const denied = (e: unknown) =>
  [403, 404].includes((e as { status: number }).status);
async function quoteId(revision: string) {
  return (
    await database().query<{ quote_id: string }>(
      "SELECT quote_id FROM ppo.draft_quote_revisions WHERE id=$1",
      [revision],
    )
  ).rows[0].quote_id;
}
async function readOnlyCounts() {
  return (
    await database().query(
      "SELECT (SELECT count(*) FROM ppo.operation_receipts) receipts,(SELECT count(*) FROM ppo.audit_events) audits,(SELECT count(*) FROM ppo.quote_release_events) releases,(SELECT count(*) FROM ppo.quote_response_events) responses,(SELECT count(*) FROM ppo.quote_conversion_events) conversions",
    )
  ).rows;
}

export function registerQuotationRegisterTests() {
  test("quotation register follows native draft, return, approval, issue and distribution with one current row", async () => {
    await reset();
    const f = await releaseFixture(),
      id = await quoteId(f.draft.id);
    assert.equal((await readQuotation(f.owner, id)).latest.stage, "Draft");
    const next = await prepared(f);
    assert.equal(
      (await readQuotation(f.owner, id)).latest.stage,
      "AwaitingApproval",
    );
    await approveRelease(f.approver, next.id, {
      ...approval(await readRelease(f.approver, next.id)),
      outcome: "Returned",
    });
    assert.equal((await readQuotation(f.owner, id)).latest.stage, "Returned");
    const successor = preparation(await readRelease(f.owner, next.id));
    await prepareRelease(f.owner, next.id, successor);
    await retryQuote(f.owner, successor.id);
    await approved(f, successor.id);
    assert.equal(
      (await readQuotation(f.owner, id)).latest.stage,
      "ApprovedNotIssued",
    );
    await issueRelease(
      f.issuer,
      successor.id,
      issue(await readRelease(f.issuer, successor.id)),
    );
    assert.equal(
      (await readQuotation(f.owner, id)).latest.stage,
      "IssuedNoResponse",
    );
    let d = await readRelease(f.issuer, successor.id);
    const attempt = randomUUID();
    await recordDistribution(f.issuer, successor.id, {
      ...releaseCommand(d),
      issue_id: d.issue!.id,
      attempt_id: attempt,
      resolves_event_id: null,
      outcome: "Unknown",
    });
    assert.equal(
      (await readQuotation(f.owner, id)).latest.stage,
      "DeliveryUnknown",
    );
    d = await readRelease(f.issuer, successor.id);
    await recordDistribution(f.issuer, successor.id, {
      ...releaseCommand(d),
      issue_id: d.issue!.id,
      attempt_id: attempt,
      resolves_event_id: d.events.at(-1)!.id,
      outcome: "SimulatedDelivered",
    });
    const before = await readOnlyCounts(),
      history = await readQuotation(f.owner, id),
      list = await listQuotations(f.owner);
    assert.equal(list.items.filter((r) => r.id === id).length, 1);
    assert.equal(history.latest.revision_id, successor.id);
    assert.equal(history.latest.stage, "IssuedNoResponse");
    assert.equal(history.latest.total, d.revision.snapshot.total);
    assert.equal(history.latest.distribution_outcome, "SimulatedDelivered");
    assert.deepEqual(
      history.revisions.map((r) => r.summary.revision_id),
      [successor.id, next.id, f.draft.id],
    );
    assert.equal(
      history.revisions[1].events.some((e) => e.outcome === "Returned"),
      true,
    );
    assert.equal(
      history.revisions[1].events.some((e) => e.action === "Issue"),
      false,
    );
    assert.equal(
      history.revisions[0].events.filter((e) => e.action === "Distribution")
        .length,
      2,
    );
    assert.equal(history.latest.updated_basis, "QuotationRevision");
    assert.deepEqual(await readOnlyCounts(), before);
    const serialized = JSON.stringify(history);
    for (const privateField of [
      "unit_cost",
      "cost_total",
      "input_html",
      "output_hash",
      "manifest",
      "SYN private supplier",
      "operative_terms",
    ])
      assert.equal(serialized.includes(privateField), false);
  });

  test("quotation register retains native response holds and issued history when source or current revision changes", async () => {
    await reset();
    const f = await responseFixture(),
      id = await quoteId(f.id);
    for (const outcome of [
      "Declined",
      "Clarification",
      "Negotiation",
      "Accepted",
    ]) {
      const d = await readResponse(f.owner, f.id);
      await recordResponse(f.owner, f.id, {
        ...response(d, outcome),
        action: d.state.response ? "Correct" : "Record",
      });
      assert.equal((await readQuotation(f.owner, id)).latest.stage, outcome);
    }
    let h = await readQuotation(f.owner, id);
    assert.equal(h.latest.response_ready, false);
    assert.equal(h.latest.needs_attention, true);
    assert.match(h.latest.response_holds.join(" "), /negotiation/i);
    await saveEstimate(f.owner, f.input.id, {
      ...crmBase(),
      scope: f.input.scope,
      lines: f.input.lines,
      policy: f.input.policy,
      expected_version: 1,
      title: "SYN changed source after issue",
    });
    h = await readQuotation(f.owner, id);
    assert.equal(h.latest.stage, "Accepted");
    assert.equal(h.latest.basis_current, false);
    assert.equal(h.latest.issue_id, f.d.issue.id);
    assert.equal(h.latest.title, f.input.title);
  });

  test("quotation register separates exact conversion from newer drafts and redacts inaccessible conversion evidence", async () => {
    await reset();
    const f = await plannedFixture(),
      id = await quoteId(f.id);
    await executeConversion(f.owner, f.id, conversion(f.d));
    let h = await readQuotation(f.owner, id);
    assert.equal(h.latest.stage, "Converted");
    assert.ok(h.latest.execution_id);
    assert.equal(
      h.revisions[0].events.filter((e) => e.action === "Execute").length,
      1,
    );
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='supply.read' AND valid_to IS NULL",
      [CRM.workspace, f.owner.actor_id],
    );
    h = await readQuotation(f.owner, id);
    assert.equal(h.latest.stage, null);
    assert.equal(h.latest.conversion_source, "Unavailable");
    assert.equal(h.latest.execution_id, null);
    assert.equal(h.latest.links.conversion, null);
    assert.equal(
      h.revisions[0].events.some((e) => e.source === "Conversion"),
      false,
    );
    const restricted = await listQuotations(f.owner);
    assert.equal(restricted.counts.unknown_stage, 1);
    assert.equal(restricted.counts.stages.Converted, 0);
    assert.equal(restricted.completeness, "PartialWindow");
    // New saved draft must not inherit an execution attached to an older issue.
    const newer = quoteCommand(f.estimate.saved, 1, h.latest.revision);
    await prepareQuote(f.owner, f.input.id, newer);
    h = await readQuotation(f.owner, id);
    assert.equal(h.latest.stage, "Draft");
    assert.equal(h.latest.execution_id, null);
    assert.equal(h.latest.issue_id, null);
    assert.equal(h.revisions[1].summary.stage, null);
    assert.equal(
      (await listQuotations(f.owner)).items.filter((r) => r.id === id).length,
      1,
    );
  });

  test("quotation register uses bounded stable windows, literal search, scoped counts and exact quotation identities", async () => {
    await reset();
    const a = await releaseFixture(),
      b = await releaseFixture();
    const all = await listQuotations(a.owner, { sort: "reference_asc" });
    assert.equal(all.items.length, 2);
    const first = await listQuotations(a.owner, {
      sort: "reference_asc",
      limit: "1",
      stage: "Accepted",
    });
    assert.equal(first.items.length, 0);
    assert.equal(first.counts.all, 1);
    assert.equal(first.counts_scope, "CurrentCandidateWindow");
    assert.equal(first.next_offset, 1);
    const second = await listQuotations(a.owner, {
      sort: "reference_asc",
      limit: "1",
      offset: "1",
    });
    assert.equal(second.items[0].id, all.items[1].id);
    assert.equal(second.next_offset, null);
    assert.equal((await listQuotations(a.owner, { q: "%" })).items.length, 0);
    assert.equal(
      (
        await listQuotations(a.owner, {
          owner_id: CRM.owner,
          customer_id: CRM.org,
          view: "mine",
        })
      ).items.length,
      2,
    );
    assert.equal(
      (await listQuotations(a.owner, { customer_id: CRM.orgB })).items.length,
      0,
    );
    assert.equal(
      (await listQuotations(a.owner, { owner_id: b.reviewer.actor_id })).items
        .length,
      0,
    );
    const id = await quoteId(a.draft.id),
      other = (await createSession("second-company")).principal;
    assert.equal((await listQuotations(other)).items.length, 0);
    await assert.rejects(readQuotation(other, id), denied);
    await assert.rejects(readQuotation(a.owner, a.draft.id), denied);
    const p = await prepared(a);
    const history = await readQuotation(a.owner, id, { limit: "1" });
    assert.equal(history.latest.revision_id, p.id);
    assert.equal(history.revisions.length, 1);
    assert.equal(history.next_offset, 1);
    assert.equal(
      (await readQuotation(a.owner, id, { limit: "1", offset: "1" }))
        .revisions[0].summary.revision_id,
      a.draft.id,
    );
    await database().query(
      "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3 AND valid_to IS NULL",
      [CRM.workspace, CRM.org, CRM.person],
    );
    await assert.rejects(readQuotation(a.owner, id), denied);
    const deniedRows = await listQuotations(a.owner);
    assert.equal(deniedRows.items.length, 0);
    assert.equal(deniedRows.counts.all, 0);
    assert.equal(deniedRows.completeness, "PartialWindow");
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.quote.read' AND valid_to IS NULL",
      [CRM.workspace, a.owner.actor_id],
    );
    await assert.rejects(listQuotations(a.owner), denied);
  });

  test("quotation register finds an older quotation beyond the first hundred estimate rows and flags stale unissued basis", async () => {
    await reset();
    const f = await releaseFixture(),
      id = await quoteId(f.draft.id);
    await prepared(f);
    await saveEstimate(f.owner, f.input.id, {
      ...crmBase(),
      scope: f.input.scope,
      lines: f.input.lines,
      policy: f.input.policy,
      expected_version: 1,
      title: "SYN changed before issue",
    });
    assert.equal(
      (await readQuotation(f.owner, id)).latest.stage,
      "HeldBasisChanged",
    );
    for (let i = 0; i < 101; i++) {
      const o = crmCreate();
      await createOpportunity(f.owner, o);
      await createEstimate(f.owner, estimateInput(o.id));
    }
    const all = await listQuotations(f.owner, { view: "needs_attention" });
    assert.deepEqual(
      all.items.map((r) => r.id),
      [id],
    );
    assert.equal(all.next_offset, null);
  });
}
