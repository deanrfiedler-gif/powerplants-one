import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  commercialFixture,
  approvedBasis,
  variation,
  commercialAction,
} from "../helpers/project-commercial";
import { commandCommercial } from "../../src/projects/commercial/commands";
import {
  readCommercial,
  readCommercialFinance,
} from "../../src/projects/commercial/reads";
import { readCommercialPicker } from "../../src/projects/commercial/options";
import { commercialUIFixture } from "../helpers/project-commercial-ui";
import { AppError } from "../../src/platform/errors";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("PJ05 UI reads: named users, retained reasons, complete counts, latest order, exact-source choices and independent review", async () => {
  const f = await commercialFixture();
  await approvedBasis(f);
  const first = variation(f, "12.00", "11.00"),
    second = variation(f, null, null);
  await commandCommercial(f.owner, f.project.id, first);
  await commandCommercial(f.owner, f.project.id, second);
  await commandCommercial(f.owner, f.project.id, {
    ...commercialAction(first.id, 1, "Submit"),
    reason: "SYN retained separate reason",
    note: "SYN submission note",
  });
  const list = await readCommercial(f.owner, f.project.id, {
    kind: "Variation",
    limit: "1",
  });
  assert.equal(list.items![0].id, first.id);
  assert.equal(list.counts, null);
  assert.ok(list.next_cursor);
  const next = await readCommercial(f.owner, f.project.id, {
    kind: "Variation",
    limit: "1",
    cursor: list.next_cursor!,
  });
  assert.equal(next.items![0].id, second.id);
  const all = await readCommercial(f.owner, f.project.id);
  assert.equal(all.counts!.Variation, 2);
  assert.equal(all.counts!.Basis, 1);
  const detail = await readCommercial(f.owner, f.project.id, { id: first.id });
  assert.equal(detail.current!.reason, "SYN retained separate reason");
  assert.equal(detail.current!.note, "SYN submission note");
  assert.equal(detail.current!.owner_name, f.owner.display_name);
  assert.equal(detail.current!.recorded_by_name, f.owner.display_name);
  assert.equal(detail.can_decide, false);
  assert.equal(detail.independent_review_required, true);
  assert.equal(
    (await readCommercial(f.reviewer, f.project.id, { id: first.id }))
      .can_decide,
    true,
  );
  assert.ok(
    (
      await readCommercialPicker(f.owner, f.project.id, { picker: "handovers" })
    ).items.some((x) => x.id === f.handover),
  );
  assert.ok(
    (
      await readCommercialPicker(f.owner, f.project.id, {
        picker: "quotations",
        handover_id: f.handover,
      })
    ).items.some((x) => x.id === f.release.id),
  );
  assert.ok(
    (
      await readCommercialPicker(f.owner, f.project.id, { picker: "documents" })
    ).items.some((x) => x.id === f.document.id),
  );
  assert.ok(
    (
      await readCommercialPicker(f.owner, f.project.id, { picker: "owners" })
    ).items.some((x) => x.id === f.owner.actor_id),
  );
  await assert.rejects(
    readCommercialPicker(f.reviewer, f.project.id, { picker: "owners" }),
  );
  await assert.rejects(
    readCommercialPicker(f.owner, f.project.id, {
      picker: "quotations",
      handover_id: randomUUID(),
    }),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='document.read'",
    [f.owner.workspace_id, f.owner.actor_id],
  );
  const partial = await readCommercial(f.owner, f.project.id);
  assert.equal(partial.completeness, "Partial");
  assert.equal(partial.counts, null);
  assert.equal(partial.items!.length, 0);
});

test("PJ05 screen fixture reconciles Finance definitions, blocked satisfaction, unchanged receipt retry and both Finance duties", async () => {
  const { f, entries, notice } = await commercialUIFixture();
  const list = await readCommercial(f.owner, f.project.id);
  assert.deepEqual(
    list.items!.find((row) => row.id === entries.obligation)!.activity_counts,
    { open: 1, closed: 0 },
  );
  assert.equal(
    list.items!.find((row) => row.id === entries.original_notice)!
      .correction_status,
    "Corrected",
  );
  assert.equal(
    list.items!.find((row) => row.id === entries.notice)!.correction_status,
    "Latest",
  );
  assert.equal(
    (
      await readCommercial(f.owner, f.project.id, {
        id: entries.original_notice,
      })
    ).current!.correction_status,
    "Corrected",
  );
  await assert.rejects(
    commandCommercial(f.owner, f.project.id, {
      ...notice,
      ...commercialAction(randomUUID(), 0, "Create"),
      predecessor_id: entries.original_notice,
    }),
    (error: unknown) =>
      error instanceof AppError && error.code === "CorrectionExists",
  );
  const finance = await readCommercialFinance(f.owner, f.project.id);
  assert.equal(finance.definition, "PJ05-FD08");
  assert.equal(finance.original_control_value, "350.00");
  assert.equal(finance.approved_change_value, "10850.00"); // 12480 - 1150 - 480
  assert.equal(finance.adjusted_control_value, "11200.00"); // 350 + 10850
  assert.equal(finance.priced_pending!.value, "6920.00");
  assert.equal(finance.requested_pending!.value, null);
  assert.equal(finance.requested_pending!.known_subtotal, "7400.00");
  assert.equal(finance.disputed!.value, "3260.00");
  assert.equal(finance.breakdown.length, 8); // rejected/withdrawn retained but excluded from sums
  await assert.rejects(
    commandCommercial(
      f.owner,
      f.project.id,
      commercialAction(entries.obligation, 1, "Satisfy"),
    ),
    (error: unknown) =>
      error instanceof AppError && error.code === "OpenActions",
  );
  assert.equal(
    (await readCommercial(f.owner, f.project.id, { id: entries.obligation }))
      .current!.state,
    "Open",
  );
  const action = {
    ...commercialAction(entries.submitted, 2, "Decide"),
    outcome: "Approved",
  };
  const saved = await commandCommercial(f.reviewer, f.project.id, action);
  const retried = await commandCommercial(f.reviewer, f.project.id, action);
  assert.deepEqual(retried.receipt, saved.receipt);
  assert.equal(
    (await readCommercial(f.reviewer, f.project.id, { id: entries.submitted }))
      .current!.version,
    3,
  );
  for (const capability of ["finance.read", "shared.finance.read"]) {
    const grants = await database().query(
      "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability=$3 RETURNING *",
      [f.owner.workspace_id, f.owner.actor_id, capability],
    );
    assert.ok(grants.rowCount);
    await assert.rejects(
      readCommercialFinance(f.owner, f.project.id),
      (error: unknown) =>
        error instanceof AppError && [403, 404].includes(error.status),
    );
    await database().query(
      "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_recordset(NULL::ppo.permission_grants,$1::jsonb)",
      [JSON.stringify(grants.rows)],
    );
  }
});
