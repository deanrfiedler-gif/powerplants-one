import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { commandCommercial } from "../../src/projects/commercial/commands";
import {
  readCommercial,
  readCommercialFinance,
  readCommercialOptions,
} from "../../src/projects/commercial/reads";
import { readOperation } from "../../src/shared/receipts";
import { readResponse } from "../../src/estimating/response/reads";
import { recordResponse } from "../../src/estimating/response/service";
import { response } from "../helpers/quotation-response";
import { recordFinding, reviseDocument } from "../../src/library/commands";
import { readDocument } from "../../src/library/reads";
import {
  createActivity,
  activityCommand,
} from "../../src/activities/activities";
import { readSchedule } from "../../src/projects/service";
import {
  commercialFixture,
  approvedBasis,
  commercialAction,
  commercialContent,
  variation,
} from "../helpers/project-commercial";
import { crmBase } from "../helpers/crm";
import { grantLibrary, successor } from "../helpers/library";
import { raidAction } from "../helpers/project-raid";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
const graph = async () =>
  Promise.all(
    [
      "project_commercial_entries",
      "project_commercial_sources",
      "project_commercial_events",
      "business_identities",
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
    ].map((t) =>
      database()
        .query(
          `SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
        )
        .then((x) => x.rows),
    ),
  );

test("PJ05-01 native issued acceptance and receiving to independently approved exact selected quotation basis", async () => {
  const f = await commercialFixture();
  assert.equal(f.options.source.amount, "350.00");
  assert.equal(f.estimate.saved.sell_total, "720.00");
  assert.equal(
    (await readCommercialFinance(f.owner, f.project.id)).reason,
    "ApprovedBasisNeeded",
  );
  const { saved, approved, decision } = await approvedBasis(f);
  const detail = await readCommercial(f.owner, f.project.id, {
    id: f.create.id,
  });
  assert.equal(detail.current!.state, "Approved");
  assert.deepEqual(
    detail.history!.map((x) => x.state),
    ["Approved", "Submitted", "Draft"],
  );
  const finance = await readCommercialFinance(f.owner, f.project.id);
  assert.equal(finance.original_control_value, "350.00");
  assert.equal(finance.adjusted_control_value, "350.00");
  assert.equal(finance.approved_change_value, "0.00");
  assert.ok(finance.unavailable_measures.includes("cash_received"));
  const before = await graph();
  await migrate();
  await seed();
  assert.deepEqual(
    (await commandCommercial(f.owner, f.project.id, f.create)).receipt,
    saved.receipt,
  );
  assert.deepEqual(
    (await commandCommercial(f.reviewer, f.project.id, decision)).receipt,
    approved.receipt,
  );
  assert.deepEqual(
    await readOperation(f.reviewer, decision.operation_id),
    approved.receipt,
  );
  assert.deepEqual(await graph(), before);
});
test("PJ05-02/03/08/09 exact requested/priced/disputed/approved deltas, unknowns, full-register totals and immutable adjustments", async () => {
  const f = await commercialFixture();
  await approvedBasis(f);
  const schedule = await readSchedule(f.owner, f.project.id);
  const approve = async (
    v: ReturnType<typeof variation>,
    outcome = "Approved",
  ) => {
    await commandCommercial(f.owner, f.project.id, v);
    await commandCommercial(
      f.owner,
      f.project.id,
      commercialAction(v.id, 1, "Submit"),
    );
    await commandCommercial(f.reviewer, f.project.id, {
      ...commercialAction(v.id, 2, "Decide"),
      outcome,
    });
  };
  const original = variation(f, "12000", "12000");
  await approve(original);
  await approve({
    ...variation(f, "-2000", "-2000"),
    predecessor_id: original.id,
  } as ReturnType<typeof variation>);
  const pending = variation(f, "7000", "6500");
  await commandCommercial(f.owner, f.project.id, pending);
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(pending.id, 1, "Submit"),
  );
  const disputed = variation(f, "3100", "3000");
  await approve(disputed, "Disputed");
  let finance = await readCommercialFinance(f.owner, f.project.id);
  assert.equal(finance.approved_change_value, "10000.00");
  assert.equal(finance.adjusted_control_value, "10350.00");
  assert.equal(finance.requested_pending!.value, "7000.00");
  assert.equal(finance.priced_pending!.value, "6500.00");
  assert.equal(finance.disputed!.value, "3000.00");
  await commandCommercial(f.owner, f.project.id, {
    ...commercialAction(disputed.id, 3, "Revise"),
    kind: "Variation",
    content: { ...disputed.content, priced_amount: "2800" },
  });
  assert.equal(
    (await readCommercialFinance(f.owner, f.project.id)).disputed!.value,
    "2800.00",
  );
  await commandCommercial(f.owner, f.project.id, variation(f, null, null));
  await commandCommercial(f.owner, f.project.id, variation(f, "0", null));
  const page = await readCommercial(f.owner, f.project.id, {
    limit: "1",
    kind: "Variation",
  });
  assert.equal(page.items!.length, 1);
  assert.ok(page.next_cursor);
  finance = await readCommercialFinance(f.owner, f.project.id);
  assert.equal(finance.breakdown.length, 6);
  assert.equal(finance.requested_pending!.value, null);
  assert.equal(finance.requested_pending!.known_subtotal, "7000.00");
  assert.equal(finance.priced_pending!.value, "6500.00");
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...commercialAction(original.id, 3, "Revise"),
      kind: "Variation",
      content: original.content,
    }),
    code("InvalidData"),
  );
  assert.deepEqual(
    {
      ...(await readSchedule(f.owner, f.project.id)),
      observed_at: schedule.observed_at,
    },
    schedule,
  );
});
test("PJ05-04/06 independent decisions, current access, concurrent versions and atomic evidence rollback", async () => {
  const f = await commercialFixture();
  const first = await commandCommercial(f.owner, f.project.id, f.create);
  const results = await Promise.allSettled(
    [1, 2].map(() =>
      commandCommercial(
        f.owner,
        f.project.id,
        commercialAction(f.create.id, 1, "Submit"),
      ),
    ),
  );
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    results.filter(
      (x) => x.status === "rejected" && x.reason.code === "VersionConflict",
    ).length,
    1,
  );
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...commercialAction(f.create.id, 2, "Decide"),
      outcome: "Approved",
    }),
    code("IndependentReviewRequired"),
  );
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...f.create,
      note: "changed payload",
    }),
    code("OperationConflict"),
  );
  const before = await graph();
  await database().query(
    "CREATE FUNCTION ppo.test_commercial_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.object_type='ProjectCommercialRecord' THEN RAISE EXCEPTION 'SYN injected late failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_commercial_failure BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.test_commercial_failure()",
  );
  try {
    await assert.rejects(
      commandCommercial(f.reviewer, f.project.id, {
        ...commercialAction(f.create.id, 2, "Decide"),
        outcome: "Approved",
      }),
      /SYN injected/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER test_commercial_failure ON ppo.audit_events; DROP FUNCTION ppo.test_commercial_failure()",
    );
  }
  assert.deepEqual(await graph(), before);
  const other = (await createSession("second-company")).principal;
  await assert.rejects(
    readCommercial(other, f.project.id),
    code("RecordUnavailable"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='project.commercial.prepare'",
    [f.owner.actor_id],
  );
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, f.create),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(f.owner, f.create.operation_id),
    code("RecordUnavailable"),
  );
  assert.equal(first.receipt.record_version, 1);
});
test("PJ05-05 source drift holds new approvals and current totals; historical receipts retain exact authority", async () => {
  const f = await commercialFixture();
  const { saved } = await approvedBasis(f);
  const proposed = variation(f, "10", "9");
  await commandCommercial(f.owner, f.project.id, proposed);
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(proposed.id, 1, "Submit"),
  );
  await reviseDocument(f.owner, f.document.id, successor(f.document, 2));
  await assert.rejects(
    commandCommercial(f.reviewer, f.project.id, {
      ...commercialAction(proposed.id, 2, "Decide"),
      outcome: "Approved",
    }),
    code("CommercialSourceChanged"),
  );
  const finance = await readCommercialFinance(f.owner, f.project.id);
  assert.equal(finance.status, "Held");
  assert.equal(finance.adjusted_control_value, null);
  assert.equal(finance.original_control_value, "350.00");
  assert.deepEqual(
    await readOperation(f.owner, f.create.operation_id),
    saved.receipt,
  );
  assert.deepEqual(
    (await commandCommercial(f.owner, f.project.id, f.create)).receipt,
    saved.receipt,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.read'",
    [f.owner.actor_id],
  );
  await assert.rejects(
    readOperation(f.owner, f.create.operation_id),
    code("RecordUnavailable"),
  );
  const restricted = await readCommercialFinance(f.owner, f.project.id);
  assert.equal(restricted.reason, "RequiredEvidenceUnavailable");
  assert.deepEqual(restricted.breakdown, []);
  const hiddenPage = await readCommercial(f.owner, f.project.id, {
    limit: "1",
  });
  assert.deepEqual(hiddenPage.items, []);
  assert.equal(
    hiddenPage.next_cursor,
    null,
    "A native signed cursor must not encode a hidden record ID",
  );
  assert.equal(hiddenPage.completeness, "Partial");
});
test("PJ05-07 owned obligations, independent waiver, recorded notices and retained correction chains", async () => {
  const f = await commercialFixture();
  await approvedBasis(f);
  const a = raidAction(f.project.id);
  await createActivity(f.owner, a);
  const obligation = {
    ...commercialAction(randomUUID(), 0, "Create"),
    kind: "Obligation",
    basis_id: f.create.id,
    content: {
      ...commercialContent(f.owner.actor_id),
      due_date: null,
      date_needed: true,
      evidence: "SYN exact completion evidence",
      action_ids: [a.id],
    },
  };
  await commandCommercial(f.owner, f.project.id, obligation);
  await assert.rejects(
    commandCommercial(
      f.owner,
      f.project.id,
      commercialAction(obligation.id, 1, "Satisfy"),
    ),
    code("OpenActions"),
  );
  await activityCommand(
    f.owner,
    a.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN independently completed Activity",
    },
    "complete",
  );
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(obligation.id, 1, "Satisfy"),
  );
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(obligation.id, 2, "Reopen"),
  );
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(obligation.id, 3, "Submit"),
  );
  await commandCommercial(f.reviewer, f.project.id, {
    ...commercialAction(obligation.id, 4, "Decide"),
    outcome: "Waived",
  });
  const notice = {
    ...commercialAction(randomUUID(), 0, "Create"),
    kind: "Notice",
    basis_id: f.create.id,
    content: {
      ...commercialContent(f.owner.actor_id),
      evidence: "SYN staff-reported correspondence; delivery not verified",
      occurred_at: new Date().toISOString(),
    },
  };
  await commandCommercial(f.owner, f.project.id, notice);
  const correction = {
    ...notice,
    ...commercialAction(randomUUID(), 0, "Create"),
    predecessor_id: notice.id,
  };
  await commandCommercial(f.owner, f.project.id, correction);
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...correction,
      ...commercialAction(randomUUID(), 0, "Create"),
    }),
    code("CorrectionExists"),
  );
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...notice,
      ...commercialAction(randomUUID(), 0, "Create"),
      content: { ...notice.content, occurred_at: "2099-01-01T00:00:00.000Z" },
    }),
    code("FutureNotice"),
  );
  for (const t of [
    "project_commercial_entries",
    "project_commercial_events",
    "project_commercial_sources",
  ])
    await assert.rejects(
      database().query(`DELETE FROM ppo.${t}`),
      code("55000"),
    );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.project_commercial_events SELECT workspace_id,entry_id,6,'Reopen','Open',content,note,disputed,action_snapshot,reason,created_by,clock_timestamp(),$1 FROM ppo.project_commercial_events WHERE entry_id=$2 AND version=5",
        [randomUUID(), obligation.id],
      );
    }),
    code("23514"),
  );
});
test("PJ05-02 wrong quote/source and root capability refusals cannot create partial evidence", async () => {
  const f = await commercialFixture(),
    other = await commercialFixture();
  const before = await graph();
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...f.create,
      source: { ...f.create.source, quotation: other.create.source.quotation },
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readCommercialOptions(f.owner, f.project.id, {
      handover_id: f.handover,
      quote_revision_id: f.draft.id,
      document_id: f.document.id,
    }),
  );
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...f.create,
      content: { ...f.create.content, original_amount: "1.00" },
    }),
    code("InvalidData"),
  );
  assert.deepEqual(await graph(), before);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='project.commercial.read'",
    [f.owner.actor_id],
  );
  await assert.rejects(
    readCommercialFinance(f.owner, f.project.id),
    code("RecordUnavailable"),
  );
});

test("PJ05-02 conditional and declined responses hold new use; only one competing original can be approved", async () => {
  const f = await commercialFixture();
  const second = {
    ...f.create,
    ...commercialAction(randomUUID(), 0, "Create"),
  };
  for (const input of [f.create, second]) {
    await commandCommercial(f.owner, f.project.id, input);
    await commandCommercial(
      f.owner,
      f.project.id,
      commercialAction(input.id, 1, "Submit"),
    );
  }
  const outcomes = await Promise.allSettled(
    [f.create, second].map((input) =>
      commandCommercial(f.reviewer, f.project.id, {
        ...commercialAction(input.id, 2, "Decide"),
        outcome: "Approved",
      }),
    ),
  );
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    outcomes.filter(
      (x) =>
        x.status === "rejected" && x.reason.code === "OriginalBasisRetained",
    ).length,
    1,
  );
  const conditional = response(await readResponse(f.owner, f.release.id));
  conditional.report.conditions = "SYN extra scope still to agree";
  await recordResponse(f.owner, f.release.id, conditional);
  await assert.rejects(
    readCommercialOptions(f.owner, f.project.id, {
      handover_id: f.handover,
      quote_revision_id: f.release.id,
      document_id: f.document.id,
    }),
    code("CommercialSourceChanged"),
  );
  assert.equal(
    (await readCommercialFinance(f.owner, f.project.id)).adjusted_control_value,
    null,
  );
  await recordResponse(
    f.owner,
    f.release.id,
    response(await readResponse(f.owner, f.release.id), "Declined"),
  );
  await assert.rejects(
    readCommercialOptions(f.owner, f.project.id, {
      handover_id: f.handover,
      quote_revision_id: f.release.id,
      document_id: f.document.id,
    }),
    code("RecordUnavailable"),
  );
  assert.equal(
    (
      await readCommercial(f.owner, f.project.id, {
        id: [f.create, second][
          outcomes.findIndex((x) => x.status === "fulfilled")
        ].id,
      })
    ).current!.state,
    "Approved",
  );
});

test("PJ05-07 Finance requires the shared Finance disclosure duty", async () => {
  const f = await commercialFixture();
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.finance.read'",
    [f.owner.actor_id],
  );
  await assert.rejects(
    readCommercialFinance(f.owner, f.project.id),
    code("RecordUnavailable"),
  );
});

test("PJ05-REVIEW01 a closed finding added after review cannot renew current document eligibility", async () => {
  const f = await commercialFixture();
  const { saved } = await approvedBasis(f);
  const finding_id = randomUUID();
  for (const [index, action] of ["Open", "Respond", "Accept"].entries()) {
    await recordFinding(
      action === "Accept" ? f.reviewer : f.owner,
      f.document.id,
      {
        ...crmBase(),
        revision_id: f.document.revision_id,
        expected_version: index + 2,
        finding_id,
        action,
        text: "SYN later finding evidence",
        ...(action === "Open"
          ? { owner_id: f.owner.actor_id, due_date: "2031-10-01" }
          : {}),
      },
    );
  }
  const document = await readDocument(f.owner, f.document.id);
  assert.equal(document.review_state, "ReviewOutdated");
  assert.equal(document.unresolved_findings, 0);
  assert.equal(document.eligible_for_current_use, false);
  const before = await graph();
  await assert.rejects(
    readCommercialOptions(f.owner, f.project.id, {
      handover_id: f.handover,
      quote_revision_id: f.release.id,
      document_id: f.document.id,
    }),
    code("CommercialSourceChanged"),
  );
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...f.create,
      ...commercialAction(randomUUID(), 0, "Create"),
      source: {
        ...f.create.source,
        document_version: document.document.version,
      },
    }),
    code("CommercialSourceChanged"),
  );
  // Exercise the SQL guard independently of service validation. Fresh version alone is insufficient.
  await assert.rejects(
    transaction(async (c) => {
      const id = randomUUID();
      await c.query(
        "INSERT INTO ppo.project_commercial_entries(id,workspace_id,company_id,project_id,kind,created_by) SELECT $2,workspace_id,company_id,project_id,kind,created_by FROM ppo.project_commercial_entries WHERE id=$1",
        [f.create.id, id],
      );
      await c.query(
        `INSERT INTO ppo.project_commercial_sources SELECT workspace_id,$2,handover_id,acceptance_event_id,quote_revision_id,issue_id,response_event_id,document_id,document_revision_id,document_review_id,amount,jsonb_set(snapshot,'{input,document_version}',to_jsonb($3::integer)) FROM ppo.project_commercial_sources WHERE basis_id=$1`,
        [f.create.id, id, document.document.version],
      );
      await c.query(
        "INSERT INTO ppo.project_commercial_events SELECT workspace_id,$2,1,command,state,content,note,disputed,action_snapshot,reason,created_by,clock_timestamp(),$3 FROM ppo.project_commercial_events WHERE entry_id=$1 AND version=1",
        [f.create.id, id, randomUUID()],
      );
    }),
    /Current exact commercial sources required/,
  );
  assert.deepEqual(await graph(), before);
  const finance = await readCommercialFinance(f.owner, f.project.id);
  assert.equal(finance.status, "Held");
  assert.equal(finance.original_control_value, "350.00");
  assert.equal(finance.adjusted_control_value, null);
  assert.deepEqual(
    await readOperation(f.owner, f.create.operation_id),
    saved.receipt,
  );
});

test("PJ05-REVIEW02 creation requires recorded ownership, never a client-selected self assignment", async () => {
  const f = await commercialFixture();
  await grantLibrary(f.reviewer, ["project.commercial.prepare"]);
  const before = await graph();
  await assert.rejects(
    commandCommercial(f.reviewer, f.project.id, {
      ...f.create,
      content: commercialContent(f.reviewer.actor_id),
    }),
    code("RecordUnavailable"),
  );
  assert.deepEqual(await graph(), before);
  await approvedBasis(f);
  const proposed = {
    ...variation(f, "10", "9"),
    content: {
      ...variation(f, "10", "9").content,
      owner_id: f.reviewer.actor_id,
    },
  };
  const original = await graph();
  await assert.rejects(
    transaction(async (c) => {
      const id = randomUUID();
      await c.query(
        "INSERT INTO ppo.project_commercial_entries(id,workspace_id,company_id,project_id,kind,created_by) SELECT $2,workspace_id,company_id,project_id,kind,$3 FROM ppo.project_commercial_entries WHERE id=$1",
        [f.create.id, id, f.reviewer.actor_id],
      );
      await c.query(
        "INSERT INTO ppo.project_commercial_sources SELECT workspace_id,$2,handover_id,acceptance_event_id,quote_revision_id,issue_id,response_event_id,document_id,document_revision_id,document_review_id,amount,snapshot FROM ppo.project_commercial_sources WHERE basis_id=$1",
        [f.create.id, id],
      );
      await c.query(
        "INSERT INTO ppo.project_commercial_events SELECT workspace_id,$2,1,command,state,jsonb_set(content,'{owner_id}',to_jsonb($3::text)),note,disputed,action_snapshot,reason,$3::uuid,clock_timestamp(),$4 FROM ppo.project_commercial_events WHERE entry_id=$1 AND version=1",
        [f.create.id, id, f.reviewer.actor_id, randomUUID()],
      );
    }),
    /Recorded commercial owner or project coordinator required/,
  );
  await assert.rejects(
    commandCommercial(f.reviewer, f.project.id, proposed),
    code("RecordUnavailable"),
  );
  assert.deepEqual(await graph(), original);
  // The coordinator can assign an eligible owner; that recorded owner can then prepare the record.
  await commandCommercial(f.owner, f.project.id, proposed);
  await commandCommercial(
    f.reviewer,
    f.project.id,
    commercialAction(proposed.id, 1, "Submit"),
  );
  assert.equal(
    (await readCommercial(f.reviewer, f.project.id, { id: proposed.id }))
      .current!.state,
    "Submitted",
  );
  // Owning a variation does not grant authority to create another basis-owned record.
  await assert.rejects(
    commandCommercial(f.reviewer, f.project.id, {
      ...proposed,
      ...commercialAction(randomUUID(), 0, "Create"),
    }),
    code("RecordUnavailable"),
  );
});

test("PJ05-REVIEW03 an assigned basis owner can create dependent records with current duties", async () => {
  const f = await commercialFixture();
  await grantLibrary(f.reviewer, ["project.commercial.prepare"]);
  f.create.content.owner_id = f.reviewer.actor_id;
  await approvedBasis(f);
  const v = variation(f, "12", "11");
  v.content.owner_id = f.reviewer.actor_id;
  await commandCommercial(f.reviewer, f.project.id, v);
  await commandCommercial(
    f.reviewer,
    f.project.id,
    commercialAction(v.id, 1, "Submit"),
  );
  assert.equal(
    (await readCommercial(f.reviewer, f.project.id, { id: v.id })).current!
      .state,
    "Submitted",
  );
  await assert.rejects(
    commandCommercial(f.reviewer, f.project.id, {
      ...commercialAction(v.id, 2, "Decide"),
      outcome: "Approved",
    }),
    code("IndependentReviewRequired"),
  );
});
