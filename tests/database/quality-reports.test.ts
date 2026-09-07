import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readReport, reviewReport, presentationBytes } from "../../src/reports/service";
import { readOperation } from "../../src/shared/receipts";
import { submitted, decision, principal } from "../helpers/reports";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable test database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

for (const outcome of ["Returned", "Approved"]) {
  test(`P11 ${outcome} review keeps internal narratives in current Service scope and exact corrections with their author`, async () => {
    const q = await submitted(), cmd = decision(q.report, outcome);
    cmd.remarks = "SYN P11_PRIVATE_REVIEW_CANARY internal Service assessment";
    for (const e of cmd.entry_decisions)
      e.remarks = outcome === "Returned" ? "SYN AUTHOR_CORRECTION: clarify the original finding without new physical work." : "SYN PRIVATE_APPROVAL_REASON internal assessment";
    const receipt = await reviewReport(q.reviewer, q.report.id, cmd);
    const original = (await database().query("SELECT * FROM ppo.report_reviews WHERE report_id=$1", [q.report.id])).rows;
    const staff = (await readReport(q.reviewer, q.report.id)).items[0];
    assert.equal(staff.reviews[0].remarks, cmd.remarks);
    assert.deepEqual(staff.reviews[0].entry_decisions, cmd.entry_decisions);
    for (const p of [q.p, await principal("second-technician")]) {
      const crew = (await readReport(p, q.report.id)).items[0];
      assert.equal(crew.status, outcome === "Approved" ? "Reviewed" : "Returned");
      assert.equal(crew.can_review, false);
      assert.equal(crew.can_issue, false);
      assert.equal("remarks" in crew.reviews[0], false);
      assert.ok(!JSON.stringify(crew).includes("P11_PRIVATE_REVIEW_CANARY"));
      assert.ok(!JSON.stringify(crew).includes("PRIVATE_APPROVAL_REASON"));
      assert.deepEqual(crew.reviews[0].entry_decisions.map((e: { id: string; version: number; decision: string }) => ({ id: e.id, version: e.version, decision: e.decision })),
        cmd.entry_decisions.map(({ id, version, decision }) => ({ id, version, decision })));
      for (const e of crew.reviews[0].entry_decisions)
        if (outcome === "Returned" && p.actor_id === q.p.actor_id) assert.equal(e.remarks, cmd.entry_decisions.find((x) => x.id === e.id)!.remarks);
        else assert.equal("remarks" in e, false);
      if (outcome === "Approved") {
        const b = await presentationBytes(p, q.report.id, staff.presentations[0].id);
        assert.ok(!JSON.stringify(b).includes("P11_PRIVATE_REVIEW_CANARY"));
        assert.ok(!JSON.stringify(b).includes("PRIVATE_APPROVAL_REASON"));
      }
    }
    for (const profile of ["systems", "other-workspace", "second-company"])
      await assert.rejects(readReport(await principal(profile), q.report.id), (e: unknown) => [403, 404].includes((e as { status: number }).status));
    assert.deepEqual(await readOperation(q.reviewer, cmd.operation_id), receipt.receipt);
    await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='report.read'", [q.reviewer.workspace_id, q.reviewer.actor_id]);
    await assert.rejects(readReport(q.reviewer, q.report.id));
    await assert.rejects(readOperation(q.reviewer, cmd.operation_id));
    assert.deepEqual((await database().query("SELECT * FROM ppo.report_reviews WHERE report_id=$1", [q.report.id])).rows, original);
  });
}
