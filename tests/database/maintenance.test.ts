import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  createAgreement,
  agreementCommand,
} from "../../src/maintenance/agreements";
import { currentAssessment } from "../../src/maintenance/assessments";
import { planCommand, occurrenceCommand } from "../../src/maintenance/plans";
import { prepareWork, receiveResult } from "../../src/maintenance/receiving";
import { createRenewal, renewalCommand } from "../../src/maintenance/renewals";
import { warrantyCommand } from "../../src/maintenance/warranty";
import { createClaim, recoveryCommand } from "../../src/maintenance/recovery";
import {
  workspace,
  register,
  options,
  renewalSource,
} from "../../src/maintenance/reads";
import { readOperation } from "../../src/shared/receipts";
import { createAsset } from "../../src/shared/commands";
import {
  previewEquipmentChange,
  proposeEquipmentChange,
  reviewEquipmentChange,
} from "../../src/equipment/changes";
import {
  agreement,
  plan,
  warranty,
  assessment,
  principal,
  base,
  rows,
  source,
  CRM,
} from "../helpers/maintenance";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code =
  (...codes: string[]) =>
  (e: unknown) =>
    codes.includes((e as { code: string }).code);
test("MA01 typed identity, exact receipt, commercial duty, scope and immutable source", async () => {
  const a = await agreement();
  assert.equal(
    (await register(a.p, "agreements", { q: "no-matching-synthetic-term" }))
      .items.length,
    0,
  );
  assert.equal(
    (await workspace(a.p, "agreements", a.id)).heading.state,
    "Current",
  );
  assert.deepEqual(
    (await createAgreement(a.p, a.cmd)).receipt,
    await readOperation(a.p, a.cmd.operation_id),
  );
  await assert.rejects(
    createAgreement(a.p, {
      ...a.cmd,
      content: { ...a.content, title: "changed" },
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    agreementCommand(a.p, a.id, {
      ...base(),
      expected_version: 2,
      action: "Withdraw",
      authority_reference: "SYN",
    }),
    code("Forbidden", "RecordUnavailable"),
  );
  await assert.rejects(
    workspace(await principal("other-workspace"), "agreements", a.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    workspace(await principal("second-company"), "agreements", a.id),
    code("RecordUnavailable", "Forbidden"),
  );
  assert.equal(
    (await register(await principal("observer"), "agreements")).can_create,
    false,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.agreement_revisions SET reason='rewrite' WHERE id=$1",
      [a.revision],
    ),
  );
  assert.equal((await options(a.p)).assets.length > 0, true);
  await agreementCommand(a.p, a.id, {
    ...base(),
    expected_version: 2,
    action: "Revise",
    content: { ...a.content, title: "SYN proposed successor" },
  });
  assert.equal(
    (await workspace(a.p, "agreements", a.id)).heading.state,
    "Proposed",
  );
});
test("MA02 a later decision or source revision makes old entitlement historical", async () => {
  const a = await agreement(),
    first = await assessment(a.p, a.revision),
    second = await assessment(a.p, a.revision);
  await assert.rejects(
    currentAssessment(database(), a.p, first),
    code("SourceReviewRequired"),
  );
  assert.equal(
    (await workspace(a.p, "coverage", first)).heading.state,
    "Historical",
  );
  await currentAssessment(database(), a.p, second);
  await agreementCommand(a.p, a.id, {
    ...base(),
    expected_version: 2,
    action: "Revise",
    content: { ...a.content, source: { ...source(), revision: "2" } },
  });
  await assert.rejects(
    currentAssessment(database(), a.p, second),
    code("SourceReviewRequired"),
  );
});
test("MA02 omitted area cannot bypass the equipment's physical facility exclusion", async () => {
  const a = await agreement();
  const content = {
    ...a.content,
    sites: a.content.sites.map((s) => ({
      ...s,
      excluded_facility_ids: ["72000000-0000-4000-8000-000000000001"],
    })),
  };
  await agreementCommand(a.p, a.id, {
    ...base(),
    expected_version: 2,
    action: "Revise",
    content,
  });
  await agreementCommand(await principal("finance-reviewer"), a.id, {
    ...base(),
    expected_version: 3,
    action: "Approve",
    authority_reference: "SYN explicitly excluded physical area",
  });
  const revision = (
    await rows(
      "SELECT current_revision_id FROM ppo.service_agreements WHERE id=$1",
      [a.id],
    )
  )[0].current_revision_id;
  await assert.rejects(assessment(a.p, revision), code("InvalidData"));
  const unknown = await assessment(
    a.p,
    revision,
    "2026-01-31",
    null,
    undefined,
    "Unknown",
  );
  assert.equal(
    (await workspace(a.p, "coverage", unknown)).heading.state,
    "Unknown",
  );
});
test("MA03/04 overlapping and concurrent generation, deferral and exact request retries", async () => {
  const a = await plan(),
    generate = {
      ...base(),
      expected_version: 2,
      action: "Generate",
      from: "2026-01-01",
      until: "2026-04-30",
    };
  const receipts = await Promise.all([
    planCommand(a.p, a.id, generate),
    planCommand(a.p, a.id, generate),
  ]);
  assert.deepEqual(receipts[0].receipt, receipts[1].receipt);
  await planCommand(a.p, a.id, {
    ...base(),
    expected_version: 3,
    action: "Generate",
    from: "2026-02-01",
    until: "2026-05-31",
  });
  const os = await rows(
    "SELECT id,original_due::text,plan_revision_id FROM ppo.maintenance_occurrences WHERE plan_id=$1 ORDER BY original_due",
    [a.id],
  );
  assert.deepEqual(
    os.map((x) => x.original_due),
    ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31"],
  );
  await occurrenceCommand(a.p, os[0].id, {
    ...base(),
    expected_version: 1,
    action: "Defer",
    target_date: "2026-02-03",
    source_reference: "SYN agreed window",
    owner_id: CRM.owner,
  });
  const due = await workspace(a.p, "due", os[0].id);
  assert.equal(due.heading.due, "2026-02-03");
  assert.equal(
    (due.row as typeof due.row & { original_due: string }).original_due,
    "2026-01-31",
  );
  const entitlement = await assessment(a.p, a.revision),
    cmd = {
      ...base(),
      expected_version: 2,
      assessment_id: entitlement,
      owner_id: CRM.owner,
    };
  const result = await prepareWork(a.p, "due", os[0].id, cmd);
  assert.deepEqual(
    (await prepareWork(a.p, "due", os[0].id, cmd)).receipt,
    result.receipt,
  );
  assert.equal(
    (
      await rows(
        "SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1",
        [os[0].id],
      )
    ).length,
    1,
  );
  const req = (
    await rows(
      "SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1",
      [os[0].id],
    )
  )[0];
  assert.equal(
    (
      await rows("SELECT status FROM ppo.tickets WHERE id=$1", [req.ticket_id])
    )[0].status,
    "New",
  );
  assert.equal(
    (
      await rows("SELECT * FROM ppo.work_order_tickets WHERE ticket_id=$1", [
        req.ticket_id,
      ])
    ).length,
    0,
  );
  await assert.rejects(
    occurrenceCommand(a.p, os[0].id, {
      ...base(),
      expected_version: result.receipt.record_version,
      action: "Cancel",
      source_reference: "SYN",
      owner_id: CRM.owner,
    }),
    code("SourceReviewRequired"),
  );
  await assert.rejects(
    receiveResult(a.p, "due", os[0].id, {
      ...base(),
      expected_version: result.receipt.record_version,
      request_id: req.id,
      report_revision_id: randomUUID(),
      task_mapping: [
        {
          task_id: a.content.tasks[0].id,
          scope_item_id: randomUUID(),
          basis: "Unrelated report refused",
        },
      ],
    }),
    code("SourceReviewRequired"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.maintenance_occurrences SET original_due='2027-01-01' WHERE id=$1",
      [os[0].id],
    ),
  );
  await planCommand(a.p, a.id, {
    ...base(),
    expected_version: 4,
    action: "Revise",
    content: {
      ...a.content,
      effective_from: "2026-06-01",
      interval: "Quarterly",
      task_set_revision: "2",
    },
  });
  await planCommand(a.p, a.id, {
    ...base(),
    expected_version: 5,
    action: "Review",
  });
  await planCommand(a.p, a.id, {
    ...base(),
    expected_version: 6,
    action: "Generate",
    from: "2026-06-01",
    until: "2026-11-30",
  });
  assert.equal(
    (
      await rows(
        "SELECT plan_revision_id FROM ppo.maintenance_occurrences WHERE id=$1",
        [os[0].id],
      )
    )[0].plan_revision_id,
    os[0].plan_revision_id,
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT original_due::text FROM ppo.maintenance_occurrences WHERE plan_id=$1 AND original_due>='2026-06-01' ORDER BY original_due",
        [a.id],
      )
    ).map((x) => x.original_due),
    ["2026-07-31", "2026-10-31"],
  );
});
test("MA05 separate CRM and Service owners, proposals do not extend source terms", async () => {
  const a = await agreement(),
    id = randomUUID();
  await createRenewal(a.p, {
    ...base(),
    id,
    agreement_revision_id: a.revision,
    site_id: CRM.site,
    owner_id: CRM.owner,
    review_from: "2028-10-01",
    next_date: "2028-10-15",
    next_action: "Review relationship and unresolved work",
  });
  for (const [i, action] of [
    "Proposal",
    "CrmHandoff",
    "ServiceHandoff",
  ].entries())
    await renewalCommand(a.p, id, {
      ...base(),
      expected_version: i + 1,
      action,
      proposal: "SYN proposed continuation, not accepted",
      next_action: "Owned review",
      next_date: "2028-10-15",
      owner_id: CRM.owner,
    });
  const r = await workspace(a.p, "renewals", id);
  assert.equal(r.heading.state, "Proposal");
  const links = await rows(
    "SELECT kind FROM ppo.activities WHERE id IN (SELECT crm_activity_id FROM ppo.renewal_reviews WHERE id=$1 UNION SELECT service_activity_id FROM ppo.renewal_reviews WHERE id=$1) ORDER BY kind",
    [id],
  );
  assert.deepEqual(
    links.map((x) => x.kind),
    ["RelationshipReview", "TechnicalFollowUp"],
  );
  assert.equal((await workspace(a.p, "agreements", a.id)).row.version, 2);
  const aftercare = await renewalSource(a.p, CRM.org);
  assert.equal(aftercare.state, "Available");
  assert.deepEqual(aftercare.agreements.map((item: { id: string }) => item.id), [a.id]);
  assert.deepEqual(aftercare.items.map((item: { id: string }) => item.id), [id]);
  await rows("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='maintenance.read'", [a.p.actor_id]);
  const restricted = await renewalSource(a.p, CRM.org);
  assert.equal(restricted.state, "Restricted");
  assert.deepEqual(restricted.agreements, []);
  assert.deepEqual(restricted.items, []);
});
test("MA06 exact evidence, stale assessment, separate goodwill and exact plan authority", async () => {
  const w = await warranty();
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 3,
    action: "Plan",
    data: {
      assessment_id: w.entitlement,
      remedy: "Repair",
      scope: "SYN repair exact circuit",
      access_review: "Separate access review required",
      target_date: "2026-10-15",
      owner_id: CRM.owner,
    },
  });
  const plan = (await workspace(w.p, "cases", w.id)).sources.plan as {
    id: string;
  };
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 4,
    action: "Authority",
    data: {
      plan_id: plan.id,
      decision: "Approved",
      authority_reference: "SYN Service duty",
      basis: "Exact source reviewed",
    },
  });
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 5,
    action: "Plan",
    data: {
      assessment_id: w.entitlement,
      remedy: "Repair",
      scope: "SYN different circuit",
      access_review: "Review access again",
      target_date: "2026-10-15",
      owner_id: CRM.owner,
    },
  });
  await assert.rejects(
    prepareWork(w.p, "cases", w.id, {
      ...base(),
      expected_version: 6,
      plan_id: plan.id,
      assessment_id: w.entitlement,
      owner_id: CRM.owner,
    }),
    code("SourceReviewRequired"),
  );
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 6,
    action: "AddEvidence",
    data: { source: { ...source(), reference: "SYN-PHOTO-01" } },
  });
  await assert.rejects(
    warrantyCommand(w.p, w.id, {
      ...base(),
      expected_version: 7,
      action: "AddEvidence",
      data: { source: { ...source(), reference: "syn-photo-01" } },
    }),
    code("Conflict", "DuplicateRecord", "Duplicate", "RelationshipConflict"),
  );
  await assert.rejects(
    currentAssessment(database(), w.p, w.entitlement),
    code("SourceReviewRequired"),
  );
  await assert.rejects(
    warrantyCommand(w.p, w.id, {
      ...base(),
      expected_version: 7,
      action: "ResolveCustomer",
      data: { basis: "No completed remedy or response" },
    }),
    code("SourceReviewRequired"),
  );
});
test("MA07 supplier evidence chronology, partial approval, credit reference and independent disposition", async () => {
  const w = await warranty(),
    id = randomUUID();
  await createClaim(w.p, {
    ...base(),
    id,
    case_id: w.id,
    expected_case_version: 3,
    assessment_id: w.entitlement,
    supplier_id: CRM.org,
    scope: "SYN exact recovery package",
    claimed_minor: 10000,
    currency: "AUD",
    tax_basis: "ExcludingTax",
    owner_id: CRM.owner,
    due_date: "2026-10-01",
  });
  const evidence = {
    reference: "SYN-CLAIM-SUBMISSION",
    source_date: "2026-09-02",
    evidence: "Synthetic external evidence only",
  };
  await assert.rejects(
    recoveryCommand(w.p, id, {
      ...base(),
      expected_version: 1,
      action: "Response",
      data: {
        ...evidence,
        response: "Approved",
        approved_minor: 10000,
        owner_id: CRM.owner,
        due_date: "2026-10-01",
      },
    }),
    code("SourceReviewRequired"),
  );
  await recoveryCommand(w.p, id, {
    ...base(),
    expected_version: 1,
    action: "Submission",
    data: evidence,
  });
  await recoveryCommand(w.p, id, {
    ...base(),
    expected_version: 2,
    action: "Response",
    data: {
      ...evidence,
      reference: "SYN-PARTIAL",
      source_date: "2026-09-03",
      response: "PartiallyApproved",
      approved_minor: 6000,
      owner_id: CRM.owner,
      due_date: "2026-10-01",
    },
  });
  const d = await workspace(w.p, "recovery", id),
    approval = d.history.find((x) => x.action === "Response")!;
  const credit = {
    ...evidence,
    reference: "SYN-ERP-CREDIT-01",
    source_date: "2026-09-04",
    approval_event_id: approval.id,
    erp_company_key: "SYN-ERP-COMPANY-01",
    amount_minor: 4000,
    reconciliation_state: "EvidenceLinked",
  };
  const finance = await principal("finance-reconciler"),
    cmd = { ...base(), expected_version: 3, action: "Credit", data: credit };
  await assert.rejects(
    recoveryCommand(w.p, id, cmd),
    code("RecordUnavailable", "Forbidden"),
  );
  const receipt = await recoveryCommand(finance, id, cmd);
  assert.deepEqual(
    (await recoveryCommand(finance, id, cmd)).receipt,
    receipt.receipt,
  );
  await assert.rejects(
    recoveryCommand(finance, id, {
      ...base(),
      expected_version: 4,
      action: "Credit",
      data: {
        ...credit,
        reference: credit.reference.toLowerCase(),
        amount_minor: 1000,
      },
    }),
    code("Conflict", "DuplicateRecord", "Duplicate", "RelationshipConflict"),
  );
  await assert.rejects(
    recoveryCommand(finance, id, {
      ...base(),
      expected_version: 4,
      action: "Credit",
      data: { ...credit, amount_minor: 3000, reference: "SYN-EXCESS" },
    }),
    code("ValidationFailed", "InvalidData"),
  );
  await recoveryCommand(w.p, id, {
    ...base(),
    expected_version: 4,
    action: "ReturnEvidence",
    data: { ...evidence, stage: "Authorised" },
  });
  await assert.rejects(
    recoveryCommand(w.p, id, {
      ...base(),
      expected_version: 5,
      action: "ReturnEvidence",
      data: { ...evidence, stage: "Disposed" },
    }),
    code("ValidationFailed", "InvalidData"),
  );
  await recoveryCommand(finance, id, {
    ...base(),
    expected_version: 5,
    action: "CloseUnrecovered",
    data: { ...evidence, source_date: "2026-09-05" },
  });
  const end = (
    await rows(
      "SELECT claimed_minor,approved_minor,credited_minor,unrecovered_minor FROM ppo.supplier_claims WHERE id=$1",
      [id],
    )
  )[0];
  assert.deepEqual(end, {
    claimed_minor: "10000",
    approved_minor: "6000",
    credited_minor: "4000",
    unrecovered_minor: "6000",
  });
  assert.equal((await workspace(w.p, "cases", w.id)).heading.state, "Open");
});
test("current action revocation blocks original operation receipt replay", async () => {
  const a = await agreement();
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='maintenance.manage'",
    [CRM.owner],
  );
  try {
    await assert.rejects(
      createAgreement(a.p, a.cmd),
      code("RecordUnavailable", "Forbidden"),
    );
    await assert.rejects(
      readOperation(a.p, a.cmd.operation_id),
      code("RecordUnavailable", "Forbidden"),
    );
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='maintenance.manage'",
      [CRM.owner],
    );
  }
});
test("AT-33 relocation and retirement retain original obligations and require future-plan review", async () => {
  const p = await principal();
  for (const kind of ["Relocate", "Retire"]) {
    const assetId = randomUUID();
    await createAsset(p, {
      ...base(),
      id: assetId,
      company_id: CRM.company,
      site_id: CRM.site,
      description: `SYN ${kind} maintenance evidence`,
      identity_status: "Verified",
      effective_at: "2026-01-01T00:00:00Z",
      configuration: "SYN original configuration",
    });
    const a = await plan(assetId);
    await planCommand(p, a.id, {
      ...base(),
      expected_version: 2,
      action: "Generate",
      from: "2026-01-01",
      until: "2026-03-31",
    });
    const original = await rows(
      "SELECT to_jsonb(t) AS row FROM ppo.maintenance_occurrences t WHERE plan_id=$1 ORDER BY original_due",
      [a.id],
    );
    const impact = await previewEquipmentChange(p, assetId),
      change = randomUUID();
    await proposeEquipmentChange(p, assetId, {
      ...base(),
      id: change,
      expected_version: impact.impact.asset_version,
      kind,
      effective_at: new Date().toISOString(),
      source_reference: "SYN exact physical change",
      source_revision: "1",
      basis_hash: impact.basis_hash,
      consequences:
        "Owned future maintenance review; retain original obligations",
      ...(kind === "Relocate"
        ? { site_id: "70000000-0000-4000-8000-000000000002" }
        : {}),
    });
    await reviewEquipmentChange(p, change, {
      ...base(),
      expected_version: 1,
      decision: "Apply",
    });
    assert.equal(
      (await workspace(p, "plans", a.id)).row.state,
      "ReviewRequired",
    );
    assert.deepEqual(
      await rows(
        "SELECT to_jsonb(t) AS row FROM ppo.maintenance_occurrences t WHERE plan_id=$1 ORDER BY original_due",
        [a.id],
      ),
      original,
    );
    await assert.rejects(
      planCommand(p, a.id, {
        ...base(),
        expected_version: 4,
        action: "Generate",
        from: "2026-04-01",
        until: "2026-05-31",
      }),
      code("SourceReviewRequired", "InvalidData"),
    );
  }
});

test("MA06 goodwill is separate from entitlement and Service authority; withdrawal blocks receiving", async () => {
  const w = await warranty(),
    finance = await principal("finance-reviewer");
  const entitlement = await assessment(
    w.p,
    null,
    "2026-09-01",
    w.id,
    3,
    "Disputed",
  );
  const data = {
    assessment_id: entitlement,
    remedy: "Repair",
    scope: "SYN disputed exact repair",
    access_review: "SYN controlled intervention",
    target_date: "2026-10-01",
    owner_id: CRM.owner,
  };
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 4,
    action: "Plan",
    data,
  });
  const plan = (await workspace(w.p, "cases", w.id)).sources.plan as {
    id: string;
  };
  const decision = {
    plan_id: plan.id,
    decision: "Approved",
    authority_reference: "SYN exact separate decision",
    basis: "Retained disputed entitlement",
  };
  await assert.rejects(
    warrantyCommand(w.p, w.id, {
      ...base(),
      expected_version: 5,
      action: "Authority",
      data: decision,
    }),
    code("SourceReviewRequired"),
  );
  await assert.rejects(
    warrantyCommand(w.p, w.id, {
      ...base(),
      expected_version: 5,
      action: "Goodwill",
      data: decision,
    }),
    code("RecordUnavailable", "Forbidden"),
  );
  await warrantyCommand(finance, w.id, {
    ...base(),
    expected_version: 5,
    action: "Goodwill",
    data: decision,
  });
  assert.equal(
    (await workspace(w.p, "coverage", entitlement)).heading.state,
    "Disputed",
  );
  const request = {
    assessment_id: entitlement,
    plan_id: plan.id,
    owner_id: CRM.owner,
  };
  await assert.rejects(
    prepareWork(w.p, "cases", w.id, {
      ...base(),
      expected_version: 6,
      ...request,
    }),
    code("SourceReviewRequired"),
  );
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 6,
    action: "Authority",
    data: decision,
  });
  await warrantyCommand(finance, w.id, {
    ...base(),
    expected_version: 7,
    action: "Goodwill",
    data: { ...decision, decision: "Declined" },
  });
  await assert.rejects(
    prepareWork(w.p, "cases", w.id, {
      ...base(),
      expected_version: 8,
      ...request,
    }),
    code("SourceReviewRequired"),
  );
  await warrantyCommand(finance, w.id, {
    ...base(),
    expected_version: 8,
    action: "Goodwill",
    data: decision,
  });
  await prepareWork(w.p, "cases", w.id, {
    ...base(),
    expected_version: 9,
    ...request,
  });
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 10,
    action: "Plan",
    data: { ...data, scope: "SYN changed repair scope" },
  });
  await assert.rejects(
    warrantyCommand(w.p, w.id, {
      ...base(),
      expected_version: 11,
      action: "Authority",
      data: decision,
    }),
    code("SourceReviewRequired"),
  );
  const current = (await workspace(w.p, "cases", w.id)).sources.plan as {
    id: string;
  };
  await assert.rejects(
    prepareWork(w.p, "cases", w.id, {
      ...base(),
      expected_version: 11,
      ...request,
      plan_id: current.id,
    }),
    code("SourceReviewRequired"),
  );
});
