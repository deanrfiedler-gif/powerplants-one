import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { readOpportunity, listOpportunities } from "../../src/crm/reads";
import {
  changeDealStage,
  editDealInformation,
} from "../../src/crm/refinements";
import { recordOpportunityOutcome } from "../../src/crm/outcomes";
import { readOperation } from "../../src/shared/receipts";
import {
  createHandover,
  readHandover,
  commandHandover,
  listHandovers,
} from "../../src/sales/handover-service";
import {
  createAftercare,
  readAftercare,
  commandAftercare,
  listAftercare,
} from "../../src/sales/aftercare-service";
import { emptyHandover } from "../../src/sales/handover-model";
import { emptyReview } from "../../src/sales/aftercare-model";
import { aftercareOptions } from "../../src/sales/aftercare-options";
import { crmBase, crmDiscovery, crmAction, CRM } from "../helpers/crm";
import {
  createActivity,
  activityCommand,
} from "../../src/activities/activities";
import { reportIssued } from "../helpers/reports";
import { pipelineInsights } from "../../src/crm/insights";
import { listEmail, linkEmail } from "../../src/email/service";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
async function prepared(kind: "Estimating" | "Won" = "Estimating") {
  const p = await principal(),
    o = crmDiscovery();
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  await createOpportunity(p, o);
  if (kind === "Won") {
    let v = 1;
    for (const stage_id of ["Scoping", "Quoting", "Negotiation", "Closing"])
      await changeDealStage(p, o.id, {
        ...crmBase(),
        expected_version: v++,
        stage_id,
        qualification_note: null,
        identification_activity_id: null,
      });
    await recordOpportunityOutcome(p, o.id, {
      ...crmBase(),
      expected_version: 5,
      close_outcome: "Won",
      lost_reason: null,
      acceptance_evidence:
        "SYN recorded customer acceptance narrative; no ERP conversion",
    });
  }
  const id = randomUUID(),
    create = { ...crmBase(), id, opportunity_id: o.id, kind };
  await createHandover(p, create);
  const content = {
    ...emptyHandover(),
    problem: "SYN customer problem",
    outcome: "SYN desired outcome",
    included_scope: "SYN controls",
    exclusions: "None",
    assumptions: "None",
    unknowns: "None",
    requested_date: "2031-10-01",
    date_reason: "Customer request",
    next_activity_id: o.initial_action.id,
    ...(kind === "Won"
      ? {
          destination: "Projects" as const,
          routing_basis: "SYN owner routing decision, source review v1",
          delivery_items: "SYN selected controls",
          release_prerequisites:
            "Engineering release remains open; Project receiver owns follow-up",
        }
      : {}),
  };
  await commandHandover(p, id, {
    ...crmBase(),
    expected_version: 1,
    action: "Save",
    content,
    receiving_owner_id: p.actor_id,
    note: "SYN save exact brief",
  });
  return { p, o, id, create, content };
}
async function handoverAction(
  q: Awaited<ReturnType<typeof prepared>>,
  action: string,
  extra: Record<string, unknown> = {},
) {
  const d = await readHandover(q.p, q.id);
  const input = {
    ...crmBase(),
    expected_version: d.record.version,
    action,
    note: `SYN ${action} exact review`,
    ...extra,
  };
  return { input, result: await commandHandover(q.p, q.id, input) };
}
test("CR02 draft/submission/clarification/answer/resolution/acceptance/successor preserves immutable evidence and exact recovery", async () => {
  const q = await prepared();
  assert.equal(
    (await listHandovers(q.p, "Estimating", undefined, true)).items.length,
    0,
  );
  const submit = await handoverAction(q, "Submit"),
    submitted = await readHandover(q.p, q.id);
  assert.equal(submitted.record.state, "Submitted");
  assert.equal(
    (await listHandovers(q.p, "Estimating", undefined, true)).items[0].record
      .content.included_scope,
    q.content.included_scope,
  );
  assert.deepEqual(
    (await commandHandover(q.p, q.id, submit.input)).receipt,
    submit.result.receipt,
  );
  assert.deepEqual(
    await readOperation(q.p, submit.input.operation_id),
    submit.result.receipt,
  );
  await assert.rejects(
    commandHandover(q.p, q.id, { ...submit.input, note: "Different" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.sales_handovers SET content='{}',version=version+1 WHERE id=$1",
      [q.id],
    ),
    /immutable/,
  );
  await handoverAction(q, "Clarify");
  let d = await readHandover(q.p, q.id);
  const question = d.history.at(-1)!.id;
  await handoverAction(q, "Answer", { question_id: question });
  await assert.rejects(
    handoverAction(q, "Accept", { source_hash: d.record.source_hash }),
    code("VersionConflict"),
  );
  await handoverAction(q, "Resolve", { question_id: question });
  d = await readHandover(q.p, q.id);
  await handoverAction(q, "Accept", { source_hash: d.record.source_hash });
  await handoverAction(q, "Successor");
  d = await readHandover(q.p, q.id);
  assert.equal(d.record.revision, 2);
  assert.equal(d.record.state, "Draft");
  assert.ok(d.history.some((e) => e.action === "Accept" && e.revision === 1));
  assert.equal(
    (await listHandovers(q.p, "Estimating", undefined, true)).items[0].record
      .revision,
    1,
  );
  await assert.rejects(
    database().query(
      "DELETE FROM ppo.sales_workflow_events WHERE record_id=$1",
      [q.id],
    ),
    /append-only/i,
  );
});
test("CR03 returns and accepts an exact successor without mutating Won evidence or creating downstream work", async () => {
  const q = await prepared("Won"),
    before = (
      await database().query(
        "SELECT to_jsonb(h) row FROM ppo.opportunity_handovers_due h WHERE opportunity_id=$1",
        [q.o.id],
      )
    ).rows;
  const projects = (
    await database().query("SELECT count(*)::int n FROM ppo.projects")
  ).rows[0].n;
  await handoverAction(q, "Submit");
  await handoverAction(q, "Return");
  await handoverAction(q, "Successor");
  await handoverAction(q, "Submit");
  const d = await readHandover(q.p, q.id),
    accepted = await handoverAction(q, "Accept", {
      source_hash: d.record.source_hash,
    });
  assert.deepEqual(
    await readOperation(q.p, accepted.input.operation_id),
    accepted.result.receipt,
  );
  assert.deepEqual(
    (await commandHandover(q.p, q.id, accepted.input)).receipt,
    accepted.result.receipt,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(h) row FROM ppo.opportunity_handovers_due h WHERE opportunity_id=$1",
        [q.o.id],
      )
    ).rows,
    before,
  );
  assert.equal(
    (await database().query("SELECT count(*)::int n FROM ppo.projects")).rows[0]
      .n,
    projects,
  );
  assert.match(
    (await readHandover(q.p, q.id)).record.content.release_prerequisites,
    /remains open/,
  );
});
test("CR02/03 source drift and stale drafts are rejected without destroying accepted evidence", async () => {
  const q = await prepared();
  await handoverAction(q, "Submit");
  const d = await readHandover(q.p, q.id),
    o = await readOpportunity(q.p, q.o.id);
  await editDealInformation(q.p, o.id, {
    ...crmBase(),
    expected_version: o.version,
    title: o.title,
    primary_person_id: o.primary_person_id,
    contact_unknown_reason: o.contact_unknown_reason,
    value_amount: "123.00",
    expected_close_date: "2031-12-01",
  });
  assert.equal((await readHandover(q.p, q.id)).source_changed, true);
  await assert.rejects(
    handoverAction(q, "Accept", { source_hash: d.record.source_hash }),
    code("VersionConflict"),
  );
  await assert.rejects(
    commandHandover(q.p, q.id, {
      ...crmBase(),
      expected_version: 1,
      action: "Save",
      content: q.content,
      receiving_owner_id: q.p.actor_id,
      note: "SYN stale",
    }),
    code("VersionConflict"),
  );
});
test("Sales detail, queues, direct UUID, history and receipts enforce current workspace/company/site and revoked access", async () => {
  const q = await prepared(),
    other = await principal("second-company");
  await assert.rejects(readHandover(other, q.id), code("RecordUnavailable"));
  assert.equal((await listHandovers(other, "Estimating")).items.length, 0);
  await assert.rejects(
    readHandover({ ...q.p, workspace_id: randomUUID() }, q.id),
    code("RecordUnavailable"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$3,site_id=$3 WHERE workspace_id=$1 AND user_id=$2 AND capability='crm.opportunity.read'",
    [q.p.workspace_id, q.p.actor_id, "70000000-0000-4000-8000-000000000002"],
  );
  await assert.rejects(readHandover(q.p, q.id), code("RecordUnavailable"));
  await assert.rejects(
    readOperation(q.p, q.create.operation_id),
    code("RecordUnavailable"),
  );
  assert.equal((await listHandovers(q.p, "Estimating")).items.length, 0);
});
test("CR04 analytics use only the scoped page and recorded date history; email linking obeys source visibility", async () => {
  const q = await prepared();
  for (const close of ["2031-10-01", "2031-10-08"]) {
    const o = await readOpportunity(q.p, q.o.id);
    await editDealInformation(q.p, o.id, {
      ...crmBase(),
      expected_version: o.version,
      title: o.title,
      primary_person_id: o.primary_person_id,
      contact_unknown_reason: null,
      value_amount: close.endsWith("08") ? null : "0.00",
      expected_close_date: close,
    });
  }
  const page = await listOpportunities(q.p, {
    pipeline_definition_id: q.o.pipeline_definition_id,
    q: q.o.title,
  });
  const insights = pipelineInsights(page.items, page.window.as_of);
  assert.equal(insights.denominator, page.items.length);
  assert.equal(insights.deals.find((d) => d.id === q.o.id)!.slipped_days, 7);
  assert.ok(insights.values.unknown > 0);
  const other = await principal("second-company");
  assert.equal(
    (
      await listOpportunities(other, {
        pipeline_definition_id: q.o.pipeline_definition_id,
        q: q.o.title,
      })
    ).items.length,
    0,
  );
  const messages = await listEmail(q.p, {});
  if (messages.items.length) {
    const m = messages.items[0];
    await linkEmail(q.p, m.id, {
      ...crmBase(),
      expected_version: m.version,
      opportunity_id: q.o.id,
    });
    assert.equal(
      (await listEmail(q.p, { opportunity_id: q.o.id })).items[0].id,
      m.id,
    );
    await assert.rejects(
      listEmail(other, { opportunity_id: q.o.id }),
      code("Forbidden"),
    );
  }
});
test("CR05 issued source -> chosen date -> prepared review -> attributed feedback -> completed review -> closure and correction", async () => {
  const source = await reportIssued(),
    p = source.reviewer,
    id = randomUUID(),
    create = { ...crmBase(), id, source_report_id: source.report.id };
  const opened = await createAftercare(p, create);
  assert.deepEqual((await createAftercare(p, create)).receipt, opened.receipt);
  assert.deepEqual(await readOperation(p, create.operation_id), opened.receipt);
  const act = async (action: string, data: Record<string, unknown> = {}) => {
    const d = await readAftercare(p, id);
    return commandAftercare(p, id, {
      ...crmBase(),
      expected_version: d.record.version,
      action,
      data,
    });
  };
  await assert.rejects(act("Close"), code("VersionConflict"));
  const review = {
    ...emptyReview(),
    due_date: null,
    due_detail: "SYN customer will choose the date; no default interval",
    review_date: "2026-09-24",
    method: "SYN telephone review, customer statements only",
    participants: [
      {
        person_id: CRM.person,
        role: "Recorded customer participant; authority unknown",
      },
    ],
    feedback: [
      {
        person_id: CRM.person,
        basis: "Paraphrased",
        statement: "SYN customer reports usable controls",
      },
    ],
    next_steps: "None",
  };
  await act("SaveReview", { review });
  await act("PrepareReview");
  await act("CompleteReview");
  let d = await readAftercare(p, id);
  assert.equal(d.record.state, "ReviewCompleted");
  assert.equal(d.record.content.review.due_date, null);
  assert.equal(d.agreements.state, "Unavailable");
  const work = {
    ...crmBase(),
    ...crmAction(p.actor_id),
    company_id: CRM.company,
    site_id: CRM.site,
    access_class: "Internal",
    due_at: "2031-10-01T00:00:00.000Z",
    due_needed: false,
    links: [{ object_type: "Organisation", object_id: CRM.org }],
  };
  await createActivity(p, work);
  await act("PrepareService", {
    summary: "SYN pressure concern",
    context: "Recorded customer review",
    impact: "Inspect operation",
    next_activity_id: work.id,
    receiving_owner_id: p.actor_id,
    duplicate_check: true,
  });
  const submission = await act("SubmitService");
  await assert.rejects(act("SubmitService"), code("VersionConflict"));
  await act("ServiceOutcome", {
    outcome: "Unknown",
    note: "SYN receiving response lost; check source before duplicate",
  });
  await assert.rejects(act("Close"), code("VersionConflict"));
  await assert.rejects(act("ReviseService", {}), code("VersionConflict"));
  assert.equal(
    (await readOperation(p, submission.receipt.operation_id)).operation_id,
    submission.receipt.operation_id,
  );
  const cases = (await readAftercare(p, id)).customer.sections.cases.items;
  assert.ok(cases.length, "synthetic source case available");
  await act("ServiceOutcome", {
    outcome: "Accepted",
    receiving_id: cases[0].id,
    note: "SYN receiver confirmed exact existing case; resolution separate",
  });
  await assert.rejects(act("Close"), code("VersionConflict"));
  await activityCommand(
    p,
    work.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN receiving follow-up confirmed",
    },
    "complete",
  );
  await act("Close");
  await act("CorrectReview");
  d = await readAftercare(p, id);
  assert.equal(d.record.revision, 2);
  assert.equal(d.record.state, "Open");
  assert.ok(d.history.some((e) => e.action === "Close"));
  const other = await principal("second-company");
  await assert.rejects(readAftercare(other, id), code("RecordUnavailable"));
  assert.equal((await listAftercare(other)).items.length, 0);
  await assert.rejects(
    readAftercare({ ...p, workspace_id: randomUUID() }, id),
    code("RecordUnavailable"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='shared.internal.read'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(readAftercare(p, id), code("RecordUnavailable"));
  await assert.rejects(
    readOperation(p, create.operation_id),
    code("RecordUnavailable"),
  );
});
test("CR05 source changes, separate training evidence and exact CRM receiving obey command and options authority", async () => {
  const source = await reportIssued(),
    p = source.reviewer,
    id = randomUUID();
  const create = { ...crmBase(), id, source_report_id: source.report.id };
  await createAftercare(p, create);
  const act = async (action: string, data: Record<string, unknown> = {}) => {
    const d = await readAftercare(p, id);
    const input = {
      ...crmBase(),
      expected_version: d.record.version,
      action,
      data,
    };
    return { input, result: await commandAftercare(p, id, input) };
  };
  for (const hidden of [
    await principal("second-company"),
    { ...p, workspace_id: randomUUID() },
  ]) {
    await assert.rejects(
      aftercareOptions(hidden, id),
      code("RecordUnavailable"),
    );
    await assert.rejects(
      commandAftercare(hidden, id, {
        ...crmBase(),
        expected_version: 1,
        action: "PrepareReview",
        data: {},
      }),
      code("RecordUnavailable"),
    );
  }
  await assert.rejects(
    createAftercare(p, { ...create, id: randomUUID() }),
    code("OperationConflict"),
  );
  const choices = await aftercareOptions(p, id);
  assert.ok(choices.assets.length);
  await assert.rejects(
    act("TrainingNeed", {
      need: "SYN hidden asset",
      asset_id: randomUUID(),
      configuration: "SYN unverified",
      material_basis: "SYN no basis",
    }),
    code("RecordUnavailable"),
  );
  const review = {
    ...emptyReview(),
    due_detail: "SYN explicit date choice pending customer confirmation",
    review_date: "2026-09-24",
    method: "SYN telephone, attributed statements only",
    participants: [
      {
        person_id: CRM.person,
        role: "Participant; signing authority not established",
      },
    ],
    feedback: [
      {
        person_id: CRM.person,
        basis: "Paraphrased",
        statement: "SYN controls usable; further instruction requested",
      },
    ],
    next_steps:
      "SYN carry instruction and commercial discussion through owned work",
  };
  await act("SaveReview", { review });
  await assert.rejects(
    commandAftercare(p, id, {
      ...crmBase(),
      expected_version: 1,
      action: "SaveReview",
      data: { review },
    }),
    code("VersionConflict"),
  );
  await act("PrepareReview");
  // A source-owned revision changes independently while the reviewer has it open.
  await database().query(
    "UPDATE ppo.sites SET version=version+1 WHERE workspace_id=$1 AND id=$2",
    [p.workspace_id, CRM.site],
  );
  assert.equal((await readAftercare(p, id)).source_changed, true);
  await assert.rejects(act("CompleteReview"), code("VersionConflict"));
  await act("PrepareReview");
  await act("CompleteReview");
  const work = {
    ...crmBase(),
    ...crmAction(p.actor_id),
    company_id: CRM.company,
    site_id: CRM.site,
    access_class: "Internal",
    due_at: "2031-10-01T00:00:00.000Z",
    due_needed: false,
    links: [{ object_type: "Organisation", object_id: CRM.org }],
  };
  await createActivity(p, work);
  await act("TrainingNeed", {
    need: "SYN instruction on controls",
    asset_id: choices.assets[0].id,
    configuration: "SYN current local configuration",
    material_basis: "SYN operator sheet, recorded issue A",
  });
  assert.equal(
    (await readAftercare(p, id)).record.content.training[0].assessment,
    "Not assessed",
  );
  await assert.rejects(
    act("TrainingDelivery", {
      index: 0,
      note: "SYN premature delivery",
      activity_id: work.id,
    }),
    code("VersionConflict"),
  );
  await act("TrainingArrangement", {
    index: 0,
    date: "2026-09-24",
    note: "SYN customer agreed instruction; no booking created",
  });
  await act("TrainingAttendance", {
    index: 0,
    note: "SYN participant attended",
  });
  await act("TrainingDelivery", {
    index: 0,
    note: "SYN control operation explained using recorded sheet",
    activity_id: work.id,
  });
  await act("TrainingAssessment", {
    index: 0,
    assessment: "Not assessed",
    method: "No competence test conducted",
    limits: "Attendance and instruction do not establish competence",
  });
  await assert.rejects(act("Close"), code("VersionConflict"));
  await act("PrepareCommercial", {
    observation: "SYN customer review",
    need: "SYN later upgrade discussion",
    assumptions: "No renewal terms or customer authority adopted",
    existing_checked: true,
  });
  const referral = {
    summary: "SYN assess a later upgrade",
    context: "Recorded customer discussion",
    impact: "Clarify an option only",
    next_activity_id: work.id,
    receiving_owner_id: p.actor_id,
    duplicate_check: true,
  };
  const before = (
    await database().query("SELECT count(*)::int n FROM ppo.opportunities")
  ).rows[0].n;
  await act("PrepareCrm", referral);
  const submission = await act("SubmitCrm");
  assert.deepEqual(
    (await commandAftercare(p, id, submission.input)).receipt,
    submission.result.receipt,
  );
  assert.deepEqual(
    await readOperation(p, submission.input.operation_id),
    submission.result.receipt,
  );
  await assert.rejects(
    commandAftercare(p, id, {
      ...submission.input,
      reason: "Different intent",
    }),
    code("OperationConflict"),
  );
  assert.equal(
    (await database().query("SELECT count(*)::int n FROM ppo.opportunities"))
      .rows[0].n,
    before,
  );
  await act("CrmOutcome", {
    outcome: "Unknown",
    note: "SYN receiving response not confirmed",
  });
  await assert.rejects(act("ReviseCrm", referral), code("VersionConflict"));
  await act("CrmOutcome", {
    outcome: "Returned",
    note: "SYN receiver requires explicit proposed scope",
  });
  await act("ReviseCrm", {
    ...referral,
    context: "SYN corrected proposed scope; no price or order",
  });
  await act("SubmitCrm");
  const opportunity = crmDiscovery();
  await createOpportunity(p, opportunity);
  const accepted = await act("CrmOutcome", {
    outcome: "Accepted",
    receiving_id: opportunity.id,
    note: "SYN receiver confirms this separate CRM source record",
  });
  assert.equal(
    (await readAftercare(p, id)).record.content.crm_handover?.revision,
    2,
  );
  await activityCommand(
    p,
    work.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN instruction and receiving follow-up confirmed",
    },
    "complete",
  );
  await act("Close");
  const final = await readAftercare(p, id);
  assert.equal(final.record.state, "Closed");
  assert.equal(final.record.content.training[0].assessment, "Not assessed");
  assert.equal((await readOpportunity(p, opportunity.id)).version, 1);
  // Revocation applies to a previously successful receiving receipt as well.
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='crm.opportunity.create'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(
    readOperation(p, accepted.input.operation_id),
    code("RecordUnavailable"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$3,site_id=$3 WHERE workspace_id=$1 AND user_id=$2 AND capability='shared.internal.read'",
    [p.workspace_id, p.actor_id, "70000000-0000-4000-8000-000000000002"],
  );
  for (const read of [
    () => readAftercare(p, id),
    () => aftercareOptions(p, id),
    () => readOperation(p, create.operation_id),
  ])
    await assert.rejects(read(), code("RecordUnavailable"));
  assert.equal((await listAftercare(p)).items.length, 0);
  await assert.rejects(
    commandAftercare(p, id, {
      ...crmBase(),
      expected_version: final.record.version,
      action: "CorrectReview",
      data: {},
    }),
    code("RecordUnavailable"),
  );
});

test("migration 0046 preserves previous ledger and immutable Won obligations on upgrade", async () => {
  await transaction(async (c) => {
    await c.query(
      await readFile(
        new URL("../../db/migrations/0001-recover.sql", import.meta.url),
        "utf8",
      ),
    );
    await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  });
  await migrate(44);
  await seed(44);
  const p = await principal();
  const before = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  await migrate();
  await seed();
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(after.slice(0, -1), before);
  assert.equal(after.at(-1).version, 46);
  assert.deepEqual(
    (
      await database().query(
        "SELECT status FROM ppo.opportunity_handovers_due WHERE workspace_id=$1",
        [p.workspace_id],
      )
    ).rows,
    [],
  );
});
