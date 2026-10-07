import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { warrantyCommand } from "../../src/maintenance/warranty";
import { createClaim } from "../../src/maintenance/recovery";
import { prepareWork, receiveResult } from "../../src/maintenance/receiving";
import { workspace } from "../../src/maintenance/reads";
import {
  warranty,
  base,
  CRM,
  rows,
  asset,
  plan,
  principal,
  assessment,
} from "../helpers/maintenance";
import { createAsset } from "../../src/shared/commands";
import {
  previewEquipmentChange,
  proposeEquipmentChange,
  reviewEquipmentChange,
} from "../../src/equipment/changes";
import { planCommand } from "../../src/maintenance/plans";
import { serviceResult } from "../helpers/maintenance-service";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const refused = (e: unknown) =>
  (e as { code: string }).code === "SourceReviewRequired";
test("agreement to due maintenance to reviewed Service outcome preserves the original obligation and exact retry", async () => {
  const a = await plan();
  await planCommand(a.p, a.id, {
    ...base(), expected_version: 2, action: "Generate",
    from: "2026-01-31", until: "2026-01-31",
  });
  const occurrence = (await rows("SELECT * FROM ppo.maintenance_occurrences WHERE plan_id=$1", [a.id]))[0];
  const entitlement = await assessment(a.p, a.revision);
  const prepare = { ...base(), expected_version: 1, assessment_id: entitlement, owner_id: CRM.owner };
  const prepared = await prepareWork(a.p, "due", occurrence.id, prepare);
  const request = (await rows("SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1", [occurrence.id]))[0];
  assert.equal((await rows("SELECT status FROM ppo.tickets WHERE id=$1", [request.ticket_id]))[0].status, "New");
  assert.equal((await rows("SELECT * FROM ppo.work_order_tickets WHERE ticket_id=$1", [request.ticket_id])).length, 0);
  const result = await serviceResult(a.p, request.id, 78);
  assert.equal(result.report.status, "Reviewed");
  const receive = {
    ...base(), expected_version: prepared.receipt.record_version, request_id: request.id,
    report_revision_id: result.report.revisions[0].id, task_mapping: result.mapping,
  };
  await assert.rejects(receiveResult(a.p, "due", occurrence.id, {
    ...receive, operation_id: base().operation_id,
    task_mapping: result.mapping.map((m: { task_id: string; scope_item_id: string; basis: string }) => ({ ...m, scope_item_id: randomUUID() })),
  }), (error: unknown) => (error as { code: string }).code === "InvalidData");
  const accepted = await receiveResult(a.p, "due", occurrence.id, receive);
  assert.deepEqual((await receiveResult(a.p, "due", occurrence.id, receive)).receipt, accepted.receipt);
  assert.deepEqual((await prepareWork(a.p, "due", occurrence.id, prepare)).receipt, prepared.receipt);
  const saved = (await rows("SELECT *, original_due::text AS original_date FROM ppo.maintenance_occurrences WHERE id=$1", [occurrence.id]))[0];
  assert.equal(saved.state, "Completed");
  assert.equal(saved.original_date, "2026-01-31");
  assert.equal(saved.plan_revision_id, occurrence.plan_revision_id);
  assert.equal((await rows("SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1", [occurrence.id])).length, 1);
  assert.equal((await rows("SELECT * FROM ppo.maintenance_service_results WHERE request_id=$1", [request.id])).length, 1);
});
async function request(assetId = asset, remedy = "Investigate") {
  const w = await warranty(assetId);
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 3,
    action: "Plan",
    data: {
      assessment_id: w.entitlement,
      remedy,
      scope: "SYN exact visual observation",
      access_review: "Reviewed observation evidence; no intervention",
      target_date: "2026-10-01",
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
      authority_reference: "SYN Service authority",
      basis: "Bounded exact plan review",
    },
  });
  await prepareWork(w.p, "cases", w.id, {
    ...base(),
    expected_version: 5,
    plan_id: plan.id,
    assessment_id: w.entitlement,
    owner_id: CRM.owner,
  });
  const req = (
    await rows(
      "SELECT * FROM ppo.maintenance_work_requests WHERE resolution_plan_id=$1",
      [plan.id],
    )
  )[0];
  return { ...w, plan, req };
}
test("partial reviewed Service results retain an open remedy and refuse customer resolution", async () => {
  const w = await request(),
    s = await serviceResult(w.p, w.req.id, 49, "Partial");
  await receiveResult(w.p, "cases", w.id, {
    ...base(),
    expected_version: 6,
    request_id: w.req.id,
    report_revision_id: s.report.revisions[0].id,
    task_mapping: s.mapping,
  });
  const d = await workspace(w.p, "cases", w.id);
  assert.equal(d.heading.state, "Open");
  assert.equal(
    (d.sources.results as { outcome: string }[])[0].outcome,
    "Partial",
  );
  await assert.rejects(
    warrantyCommand(w.p, w.id, {
      ...base(),
      expected_version: 7,
      action: "UpdateCustomer",
      data: {
        recipient: "SYN customer",
        content: "Cannot claim completed remedy",
      },
    }),
    refused,
  );
});
test("canonical replacement receives exact completed work, preserves identities and owns future maintenance", async () => {
  const p = await principal(),
    original = randomUUID(),
    successor = randomUUID();
  for (const id of [original, successor])
    await createAsset(p, {
      ...base(),
      id,
      company_id: CRM.company,
      site_id: CRM.site,
      description: "SYN replacement proof equipment",
      identity_status: "Verified",
      manufacturer: "SYN",
      model: "SYN replaceable",
      serial: `SYN-${id}`,
      effective_at: "2026-01-01T00:00:00Z",
      configuration: "SYN initial configuration",
    });
  const maintenance = await plan(original),
    w = await request(original, "Replace");
  const before = await previewEquipmentChange(p, original);
  assert.equal(before.impact.maintenance.replacement_results.length, 0);
  const s = await serviceResult(w.p, w.req.id);
  await receiveResult(w.p, "cases", w.id, {
    ...base(),
    expected_version: 6,
    request_id: w.req.id,
    report_revision_id: s.report.revisions[0].id,
    task_mapping: s.mapping,
  });
  const preview = await previewEquipmentChange(p, original),
    change = randomUUID();
  assert.equal(preview.impact.maintenance.replacement_results.length, 1);
  await proposeEquipmentChange(p, original, {
    ...base(),
    id: change,
    expected_version: preview.impact.asset_version,
    kind: "Replace",
    effective_at: new Date().toISOString(),
    source_reference: "SYN applied replacement",
    source_revision: "1",
    basis_hash: preview.basis_hash,
    successor_id: successor,
    successor_version: 1,
    configuration: null,
    consequences:
      "Exact completed replacement reviewed; future maintenance separately owned",
  });
  await reviewEquipmentChange(p, change, {
    ...base(),
    expected_version: 1,
    decision: "Apply",
  });
  assert.equal(
    (await workspace(p, "plans", maintenance.id)).row.state,
    "ReviewRequired",
  );
  await assert.rejects(
    planCommand(p, maintenance.id, {
      ...base(),
      expected_version: 3,
      action: "Generate",
      from: "2026-01-01",
      until: "2026-02-28",
    }),
    refused,
  );
  await warrantyCommand(p, w.id, {
    ...base(),
    expected_version: 7,
    action: "ReviewReplacement",
    data: {
      equipment_change_id: change,
      owner_id: CRM.owner,
      due_date: "2026-10-01",
    },
  });
  const d = await workspace(p, "cases", w.id),
    replacement = d.history.find((e) => e.action === "ReviewReplacement")!;
  assert.ok(replacement.content.activity_id);
  const assets = await rows(
    "SELECT id,lifecycle_status,predecessor_asset_id,warranty_start,warranty_end FROM ppo.assets WHERE id=ANY($1::uuid[])",
    [[original, successor]],
  );
  assert.equal(
    assets.find((a) => a.id === original).lifecycle_status,
    "Removed",
  );
  assert.equal(
    assets.find((a) => a.id === successor).predecessor_asset_id,
    original,
  );
  assert.equal(assets.find((a) => a.id === successor).warranty_end, null);
  await warrantyCommand(p, w.id, {
    ...base(),
    expected_version: 8,
    action: "UpdateCustomer",
    data: {
      recipient: "SYN customer",
      content: "SYN exact replacement result; successor warranty unresolved",
    },
  });
  const updated = await workspace(p, "cases", w.id),
    update = (updated.sources.updates as { id: string }[])[0];
  await warrantyCommand(p, w.id, {
    ...base(),
    expected_version: 9,
    action: "CustomerResponse",
    data: {
      update_id: update.id,
      response: "Accepted",
      evidence: "SYN exact acceptance",
    },
  });
  await warrantyCommand(p, w.id, {
    ...base(),
    expected_version: 10,
    action: "ResolveCustomer",
    data: {
      basis:
        "Completed replacement, exact response and owned maintenance review",
    },
  });
  assert.equal((await workspace(p, "cases", w.id)).row.state, "Resolved");
  await assessment(p, null, "2026-09-01", w.id, 11, "Disputed", original);
  await assert.rejects(
    warrantyCommand(p, w.id, {
      ...base(),
      expected_version: 12,
      action: "ResolveCustomer",
      data: {
        basis: "Old replacement cannot override a new disputed decision",
      },
    }),
    refused,
  );
});
test("completed exact Service remedy needs current customer update and response; recovery stays outstanding", async () => {
  const w = await request(),
    s = await serviceResult(w.p, w.req.id);
  const cmd = {
    ...base(),
    expected_version: 6,
    request_id: w.req.id,
    report_revision_id: s.report.revisions[0].id,
    task_mapping: s.mapping,
  };
  const result = await receiveResult(w.p, "cases", w.id, cmd);
  assert.deepEqual(
    (await receiveResult(w.p, "cases", w.id, cmd)).receipt,
    result.receipt,
  );
  const claim = randomUUID();
  await createClaim(w.p, {
    ...base(),
    id: claim,
    case_id: w.id,
    expected_case_version: 7,
    assessment_id: w.entitlement,
    supplier_id: CRM.org,
    scope: "SYN independent supplier review",
    claimed_minor: 10000,
    currency: "AUD",
    tax_basis: "ExcludingTax",
    owner_id: CRM.owner,
    due_date: "2026-10-15",
  });
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 7,
    action: "UpdateCustomer",
    data: {
      recipient: "SYN customer",
      content: "SYN reviewed observation and exact remedy result",
    },
  });
  let d = await workspace(w.p, "cases", w.id);
  const update = (d.sources.updates as { id: string }[])[0];
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 8,
    action: "CustomerResponse",
    data: {
      update_id: update.id,
      response: "Accepted",
      evidence: "SYN exact customer acceptance evidence",
    },
  });
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 9,
    action: "ResolveCustomer",
    data: { basis: "Reviewed completed remedy and exact accepted update" },
  });
  d = await workspace(w.p, "cases", w.id);
  assert.equal(d.heading.customer_outcome, "Resolved");
  assert.equal(d.heading.recovery, "Prepared");
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 10,
    action: "UpdateCustomer",
    data: {
      recipient: "SYN customer",
      content: "SYN successor customer update",
    },
  });
  await assert.rejects(
    warrantyCommand(w.p, w.id, {
      ...base(),
      expected_version: 11,
      action: "CustomerResponse",
      data: {
        update_id: update.id,
        response: "Accepted",
        evidence: "Older update refused",
      },
    }),
    refused,
  );
  d = await workspace(w.p, "cases", w.id);
  const next = (d.sources.updates as { id: string }[])[0];
  await warrantyCommand(w.p, w.id, {
    ...base(),
    expected_version: 11,
    action: "CustomerResponse",
    data: {
      update_id: next.id,
      response: "Reservations",
      evidence: "SYN question retained",
      owner_id: CRM.owner,
      due_date: "2026-10-10",
      next_action: "Resolve customer's retained question",
    },
  });
  d = await workspace(w.p, "cases", w.id);
  assert.ok((d.sources.responses as { followup_id: string }[])[0].followup_id);
  assert.equal(d.heading.state, "Open");
  await assert.rejects(
    warrantyCommand(w.p, w.id, {
      ...base(),
      expected_version: 12,
      action: "ResolveCustomer",
      data: { basis: "Reservations remain owned" },
    }),
    refused,
  );
});
