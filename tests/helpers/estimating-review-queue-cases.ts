import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createEstimate,
  saveEstimate,
  prepareQuote,
} from "../../src/estimating/service";
import { readEstimateReview } from "../../src/estimating/review/reads";
import {
  submitEstimateReview,
  decideEstimateReview,
} from "../../src/estimating/review/service";
import { readEstimatingReviewQueue } from "../../src/estimating/review/queue";
import { readRelease } from "../../src/estimating/release/reads";
import {
  prepareRelease,
  approveRelease,
  issueRelease,
} from "../../src/estimating/release/service";
import { retryQuote } from "../../src/estimating/worker";
import {
  releaseFixture,
  preparation,
  approval,
  issue,
} from "./quotation-release";
import { CRM, crmBase, crmCreate } from "./crm";
import { estimateInput, quoteCommand } from "./estimating";

async function fixture(title = `SYN Queue ${randomUUID()}`) {
  const p = (await createSession("coordinator")).principal;
  const r = (await createSession("estimating-source-reviewer")).principal;
  const o = crmCreate();
  await createOpportunity(p, o);
  const input = { ...estimateInput(o.id), title };
  await createEstimate(p, input);
  await submit(p, input.id);
  return { p, r, input, title };
}
async function submit(
  p: Awaited<ReturnType<typeof createSession>>["principal"],
  id: string,
) {
  const d = await readEstimateReview(p, id);
  const responses = d.statuses
    .filter((s) => s.applicable && s.decision?.outcome === "Returned")
    .flatMap((s) =>
      s.decision!.findings.map((f) => ({
        finding_id: f.id,
        response: "SYN clarified source context",
      })),
    );
  await submitEstimateReview(p, id, {
    ...crmBase(),
    estimate_version_id: d.saved.id,
    basis_hash: d.basis_hash,
    expected_version: d.estimate.version,
    expected_review_version: d.sequence,
    responses,
  });
}
async function decide(
  f: Awaited<ReturnType<typeof fixture>>,
  kind: "Completeness" | "Technical" | "SourcePrice",
  outcome: "Reviewed" | "Returned" = "Reviewed",
) {
  const d = await readEstimateReview(f.r, f.input.id);
  await decideEstimateReview(f.r, f.input.id, {
    ...crmBase(),
    submission_id: d.submissions.at(-1)!.id,
    expected_version: d.estimate.version,
    expected_review_version: d.sequence,
    kind,
    outcome,
    findings:
      outcome === "Returned"
        ? [
            {
              line_id: null,
              detail: "SYN clarify responsibility",
            },
          ]
        : [],
  });
}
const isCode = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;

export function registerReviewQueueTests() {
  test("review queue preserves submitted identity, current eligibility, own-work and read-only counts", async () => {
    const f = await fixture();
    const original = await readEstimateReview(f.r, f.input.id);
    const before = (
      await database().query(
        "SELECT (SELECT count(*) FROM ppo.operation_receipts) receipts,(SELECT count(*) FROM ppo.audit_events) audits,(SELECT count(*) FROM ppo.estimate_review_events) reviews",
      )
    ).rows;
    const queue = await readEstimatingReviewQueue(f.r, {
      q: f.title,
      source: "estimates",
      view: "awaiting_me",
    });
    assert.equal(queue.items.length, 3);
    assert.equal(queue.counts.awaiting_me, 3);
    assert.equal(queue.counts_scope, "CurrentCandidateWindow");
    assert.equal(queue.completeness, "CompleteWindow");
    for (const row of queue.items) {
      assert.equal(row.submission_id, original.submissions.at(-1)!.id);
      assert.equal(row.estimate_version_id, original.saved.id);
      assert.equal(row.can_decide, true);
      assert.equal(row.state, "Pending");
      assert.equal(row.sell_total, original.saved.sell_total);
      assert.equal("cost_total" in row, false);
      assert.equal("lines" in row, false);
    }
    const own = await readEstimatingReviewQueue(f.p, {
      q: f.title,
      source: "estimates",
    });
    assert.ok(own.items.every((row) => row.own_work && !row.can_decide));
    assert.equal(own.counts.my_submissions, 3);
    assert.equal(
      (
        await readEstimatingReviewQueue(f.p, {
          q: f.title,
          source: "estimates",
          view: "awaiting_me",
        })
      ).items.length,
      0,
    );
    assert.deepEqual(
      (
        await database().query(
          "SELECT (SELECT count(*) FROM ppo.operation_receipts) receipts,(SELECT count(*) FROM ppo.audit_events) audits,(SELECT count(*) FROM ppo.estimate_review_events) reviews",
        )
      ).rows,
      before,
    );
  });

  test("review queue retains returned findings, requires successor review and carries only applicable Reviewed decisions", async () => {
    const f = await fixture();
    await decide(f, "Completeness");
    await decide(f, "Technical");
    await decide(f, "SourcePrice", "Returned");
    let queue = await readEstimatingReviewQueue(f.r, {
      q: f.title,
      source: "estimates",
    });
    const returned = queue.items.find((x) => x.kind === "SourcePrice")!;
    assert.equal(returned.state, "Returned");
    assert.equal(returned.finding_count, 1);
    assert.equal(returned.can_decide, false);
    await submit(f.p, f.input.id);
    queue = await readEstimatingReviewQueue(f.r, {
      q: f.title,
      source: "estimates",
    });
    assert.equal(
      queue.items.find((x) => x.kind === "SourcePrice")!.state,
      "Pending",
    );
    assert.equal(
      queue.items.find((x) => x.kind === "SourcePrice")!.can_decide,
      true,
    );
    assert.equal(
      queue.items.find((x) => x.kind === "SourcePrice")!.carried_forward,
      false,
    );
    assert.equal(
      queue.items.filter((x) => x.carried_forward && x.state === "Reviewed")
        .length,
      2,
    );
    await decide(f, "SourcePrice");
    const d = await readEstimateReview(f.p, f.input.id);
    await saveEstimate(f.p, f.input.id, {
      ...crmBase(),
      title: f.input.title,
      scope: f.input.scope,
      policy: f.input.policy,
      expected_version: d.estimate.version,
      lines: f.input.lines.map((line, i) =>
        i ? line : { ...line, unit_cost: "121" },
      ),
    });
    queue = await readEstimatingReviewQueue(f.r, {
      q: f.title,
      source: "estimates",
    });
    assert.equal(
      queue.items.find((x) => x.kind === "SourcePrice")!.state,
      "Changed basis",
    );
    assert.equal(
      queue.items.find((x) => x.kind === "Technical")!.state,
      "Reviewed",
    );
    assert.equal(queue.counts.changed, 1);
    assert.equal(queue.counts.awaiting_me, 0);
    await submit(f.p, f.input.id);
    queue = await readEstimatingReviewQueue(f.r, {
      q: f.title,
      source: "estimates",
    });
    assert.equal(
      queue.items.find((x) => x.kind === "SourcePrice")!.state,
      "Pending",
    );
    assert.equal(queue.counts.awaiting_me, 1);
  });

  test("review queue paginates candidate windows independently of views and excludes other company data", async () => {
    const title = `SYN window ${randomUUID()}`;
    const a = await fixture(title),
      b = await fixture(title);
    const first = await readEstimatingReviewQueue(a.r, {
      q: title,
      source: "estimates",
      limit: "1",
    });
    assert.equal(first.items.length, 3);
    assert.equal(first.next_offset, 1);
    assert.equal(first.counts.all, 3);
    const empty = await readEstimatingReviewQueue(a.r, {
      q: title,
      source: "estimates",
      limit: "1",
      view: "completed",
    });
    assert.equal(empty.items.length, 0);
    assert.equal(empty.next_offset, 1);
    assert.deepEqual(empty.counts, first.counts);
    const second = await readEstimatingReviewQueue(a.r, {
      q: title,
      source: "estimates",
      limit: "1",
      offset: "1",
    });
    assert.equal(second.items.length, 3);
    assert.equal(second.next_offset, null);
    assert.notEqual(first.items[0].record_id, second.items[0].record_id);
    assert.deepEqual(
      new Set([first.items[0].record_id, second.items[0].record_id]),
      new Set([a.input.id, b.input.id]),
    );
    const other = (await createSession("second-company")).principal;
    const hidden = await readEstimatingReviewQueue(other, {
      q: title,
      source: "estimates",
    });
    assert.equal(hidden.counts.all, 0);
    assert.equal(hidden.items.length, 0);
    assert.equal(hidden.next_offset, null);
    const technician = (await createSession("assigned-technician")).principal;
    await assert.rejects(
      readEstimatingReviewQueue(technician),
      isCode("Forbidden"),
    );
  });

  test("quotation queue uses actual output and approval authority and remains separate from estimate review", async () => {
    const f = await releaseFixture();
    const input = preparation(await readRelease(f.owner, f.draft.id));
    await prepareRelease(f.owner, f.draft.id, input);
    const reference = (await readRelease(f.owner, input.id)).revision.snapshot
      .display_number;
    let queue = await readEstimatingReviewQueue(f.approver, {
      q: reference,
      source: "quotations",
    });
    assert.equal(queue.items.length, 1);
    assert.equal(queue.items[0].state, "Output pending");
    assert.equal(queue.counts.awaiting_me, 0);
    await retryQuote(f.owner, input.id);
    queue = await readEstimatingReviewQueue(f.approver, {
      q: reference,
      source: "quotations",
      view: "awaiting_me",
    });
    assert.equal(queue.items.length, 1);
    assert.equal(queue.items[0].submission_id, input.id);
    assert.equal(queue.items[0].can_decide, true);
    assert.equal(queue.items[0].state, "Pending");
    assert.equal(
      (
        await readEstimatingReviewQueue(f.owner, {
          q: reference,
          source: "quotations",
        })
      ).items[0].can_decide,
      false,
    );
    await approveRelease(f.approver, input.id, {
      ...approval(await readRelease(f.approver, input.id)),
      outcome: "Returned",
    });
    queue = await readEstimatingReviewQueue(f.approver, {
      q: reference,
      source: "quotations",
    });
    assert.equal(queue.items[0].state, "Returned");
    assert.equal(queue.counts.returned, 1);
    assert.equal(queue.counts.awaiting_me, 0);
    // A newer Draft must retain the prepared return as held evidence.
    const draft = quoteCommand(
      f.estimate.saved,
      1,
      (await readRelease(f.owner, input.id)).quote_version,
    );
    await prepareQuote(f.owner, f.input.id, draft);
    queue = await readEstimatingReviewQueue(f.approver, {
      q: reference,
      source: "quotations",
    });
    assert.equal(queue.items.length, 1);
    assert.equal(queue.items[0].submission_id, input.id);
    assert.equal(queue.items[0].state, "Changed basis");
    assert.equal(queue.items[0].decision_outcome, "Returned");
    assert.equal(queue.counts.changed, 1);
    assert.equal(queue.counts.awaiting_me, 0);
    const successor = preparation(await readRelease(f.owner, draft.id));
    await prepareRelease(f.owner, draft.id, successor);
    await retryQuote(f.owner, successor.id);
    queue = await readEstimatingReviewQueue(f.approver, {
      q: reference,
      source: "quotations",
    });
    assert.equal(queue.items.length, 1);
    assert.equal(queue.items[0].submission_id, successor.id);
    assert.equal(queue.items[0].decision_id, null);
    assert.equal(queue.items[0].state, "Pending");
    await approveRelease(
      f.approver,
      successor.id,
      approval(await readRelease(f.approver, successor.id)),
    );
    queue = await readEstimatingReviewQueue(f.approver, {
      q: reference,
      source: "quotations",
    });
    assert.equal(queue.items[0].state, "Approved");
    assert.equal(queue.counts.completed, 1);
    assert.equal(queue.counts.awaiting_me, 0);
    await issueRelease(
      f.issuer,
      successor.id,
      issue(await readRelease(f.issuer, successor.id)),
    );
    // A later estimate change cannot erase a recorded issue.
    await saveEstimate(f.owner, f.input.id, {
      ...crmBase(),
      expected_version: 1,
      title: f.input.title,
      scope: f.input.scope,
      policy: f.input.policy,
      lines: f.input.lines.map((line, i) =>
        i ? line : { ...line, unit_cost: "121" },
      ),
    });
    queue = await readEstimatingReviewQueue(f.approver, {
      q: reference,
      source: "quotations",
    });
    assert.equal(queue.items[0].state, "Issued");
    assert.equal(queue.items[0].basis_current, false);
    assert.equal(queue.counts.completed, 1);
    assert.equal(queue.counts.changed, 1);
    assert.equal(queue.counts.awaiting_me, 0);
  });
  test("review queue rechecks duties and exact relationship access without exposing restricted counts", async () => {
    const f = await fixture();
    try {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.review.technical'",
        [f.r.actor_id],
      );
      let page = await readEstimatingReviewQueue(f.r, {
        q: f.title,
        source: "estimates",
      });
      assert.equal(page.items.length, 3);
      assert.equal(
        page.items.find((x) => x.kind === "Technical")!.can_decide,
        false,
      );
      assert.equal(page.counts.awaiting_me, 2);
      await database().query(
        "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",
        [f.p.workspace_id, CRM.org, CRM.person],
      );
      page = await readEstimatingReviewQueue(f.r, {
        q: f.title,
        source: "estimates",
      });
      assert.equal(page.items.length, 0);
      assert.equal(page.counts.all, 0);
      assert.equal(page.completeness, "PartialWindow");
      assert.equal(JSON.stringify(page).includes(f.input.id), false);
    } finally {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='estimating.review.technical'",
        [f.r.actor_id],
      );
      await database().query(
        "UPDATE ppo.relationships SET valid_to=NULL WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",
        [f.p.workspace_id, CRM.org, CRM.person],
      );
    }
    const unrestricted = await readEstimatingReviewQueue(f.r, {
      q: f.title,
      source: "estimates",
    });
    assert.equal(unrestricted.counts.awaiting_me, 3);
    try {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.quote.read'",
        [f.p.actor_id],
      );
      const page = await readEstimatingReviewQueue(f.p, { q: f.title });
      assert.equal(page.quotation_source, "Denied");
      assert.equal(page.completeness, "PartialWindow");
      assert.equal(page.items.length, 3);
      await assert.rejects(
        readEstimatingReviewQueue(f.p, { source: "quotations" }),
        isCode("Forbidden"),
      );
    } finally {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='estimating.quote.read'",
        [f.p.actor_id],
      );
    }
  });
}
