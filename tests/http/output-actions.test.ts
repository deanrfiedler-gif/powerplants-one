import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import { httpAcceptance } from "../helpers/acceptance-http";
import { queued, rows, base } from "../helpers/packs";
import { reviewed } from "../helpers/reports";
import { started } from "../helpers/field";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

test("DK03-HTTP03 InProgress detail agrees with distribution; a discarded response recovers exactly", async () => {
  const q = await started(),
    h = httpAcceptance(localConfig().origin),
    path = `document-outputs/${q.pack.id}`;
  assert.equal(q.job.status, "InProgress");
  const detail = await h.call("coordinator", path + "?kind=JobPack");
  assert.equal(detail.status, 200);
  assert.equal(detail.body.selected_issue.pack_applicable, true);
  const recipient = (
    await rows(
      "SELECT id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id",
      [q.issue_id],
    )
  )[0];
  const prepare = {
    ...base(),
    attempt_id: randomUUID(),
    issue_id: q.issue_id,
    recipient_id: recipient.id,
    expected_version: q.pack.version,
  };
  const envelope = (action: string, command: unknown) => ({
    kind: "JobPack",
    action,
    command,
  });
  const response = await fetch(
    localConfig().origin + "/api/v1/" + path + "/actions",
    {
      method: "POST",
      headers: {
        cookie: await h.cookie("coordinator"),
        origin: localConfig().origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envelope("PrepareDistribution", prepare)),
    },
  );
  assert.equal(response.status, 201);
  // The committed response body is deliberately discarded before original recovery.
  await response.body?.cancel();
  const recovered = await h.call(
    "coordinator",
    path + "/operations?kind=JobPack&operation_id=" + prepare.operation_id,
  );
  assert.equal(recovered.status, 200);
  const replay = await h.call(
    "coordinator",
    path + "/actions",
    envelope("PrepareDistribution", prepare),
  );
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, recovered.body);
  const sent = await h.call(
    "coordinator",
    path + "/actions",
    envelope("RecordDistribution", {
      ...base(),
      attempt_id: prepare.attempt_id,
      expected_attempt_version: 1,
      outcome: "SimulatedSent",
      evidence:
        "SYN only; in-progress appointment and exact audience checked again.",
    }),
  );
  assert.equal(sent.status, 201, JSON.stringify(sent.body));
  const context = await h.call("coordinator", path + "/actions?kind=JobPack");
  assert.equal(context.body.distribution_attempts.length, 1);
  assert.equal(context.body.distribution_attempts[0].sent_at, null);
  assert.equal(context.body.distribution_attempts[0].delivered_at, null);
  assert.ok(
    !JSON.stringify(context.body).match(
      /store_key|render_snapshot|lease_token/,
    ),
  );
  assert.ok(
    [403, 404].includes(
      (await h.call("second-company", path + "?kind=JobPack")).status,
    ),
  );
});
for (const kind of ["JobPack", "ServiceReport"] as const)
  test(`DK03-HTTP02 compiled ${kind} issue, original recovery and recipient reconciliation`, async () => {
    const h = httpAcceptance(localConfig().origin);
    let id: string, cmd: object;
    if (kind === "JobPack") {
      const q = await queued();
      id = q.pack.id;
      cmd = q.cmd;
    } else {
      const q = await reviewed(),
        r = q.report;
      id = r.id;
      cmd = {
        ...base(),
        expected_version: r.version,
        revision_id: r.revisions[0].id,
        review_id: r.reviews[0].id,
        template_id: r.template.id,
        template_version: r.template.version,
      };
    }
    const path = `document-outputs/${id}/actions`,
      body = (action: string, command: unknown) => ({ kind, action, command });
    const queuedResult = await h.call(
      "coordinator",
      path,
      body("RequestIssue", cmd),
    );
    assert.equal(
      queuedResult.status,
      kind === "JobPack" ? 200 : 202,
      JSON.stringify(queuedResult.body),
    );
    const replay = await h.call("coordinator", path, body("RequestIssue", cmd));
    assert.equal(replay.status, 200);
    assert.deepEqual(replay.body, queuedResult.body);
    const context = await h.call("coordinator", path + `?kind=${kind}`);
    assert.equal(context.status, 200);
    const recover = await h.call(
      "coordinator",
      path,
      body("RecoverIssue", { job_id: context.body.jobs[0].id }),
    );
    assert.equal(recover.status, 200, JSON.stringify(recover.body));
    assert.equal(recover.body.state, "Issued");
    assert.equal(recover.body.availability, "Available");
    const current = await h.call("coordinator", path + `?kind=${kind}`);
    const issue = current.body.current_issue_id;
    const recipient = (
      await rows(
        kind === "JobPack"
          ? "SELECT id AS recipient_id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id"
          : "SELECT recipient_id FROM ppo.report_issues WHERE id=$1",
        [issue],
      )
    )[0].recipient_id;
    const prepare = {
      ...base(),
      attempt_id: randomUUID(),
      issue_id: issue,
      recipient_id: recipient,
      expected_version: current.body.version,
    };
    const accepted = await h.call(
      "coordinator",
      path,
      body("PrepareDistribution", prepare),
    );
    assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
    const uncertain = {
      ...base(),
      attempt_id: prepare.attempt_id,
      expected_attempt_version: 1,
      outcome: "OutcomeUnknown",
      evidence: "SYN controlled interrupted distribution observation.",
    };
    assert.equal(
      (await h.call("coordinator", path, body("RecordDistribution", uncertain)))
        .status,
      201,
    );
    assert.equal(
      (
        await h.call(
          "coordinator",
          path,
          body("PrepareDistribution", {
            ...prepare,
            ...base(),
            attempt_id: randomUUID(),
          }),
        )
      ).status,
      409,
    );
    const reconciliation = {
      ...base(),
      attempt_id: prepare.attempt_id,
      expected_attempt_version: 2,
      outcome: "SimulatedSent",
      evidence: "SYN resolved against the original attempt; simulation only.",
    };
    assert.equal(
      (
        await h.call(
          "coordinator",
          path,
          body("ReconcileDistribution", reconciliation),
        )
      ).status,
      201,
    );
    assert.equal(
      (
        await h.call(
          "coordinator",
          path,
          body("ReconcileDistribution", reconciliation),
        )
      ).status,
      200,
    );
    const history = await h.call("coordinator", path + `?kind=${kind}`),
      attempt = history.body.distribution_attempts[0];
    assert.deepEqual(
      attempt.events.map((e: { state: string }) => e.state),
      ["Prepared", "OutcomeUnknown", "SimulatedSent"],
    );
    assert.equal(attempt.sent_at, null);
    assert.equal(attempt.delivered_at, null);
    const original = await h.call(
      "coordinator",
      `document-outputs/${id}/operations?kind=${kind}&operation_id=${prepare.operation_id}`,
    );
    assert.equal(original.status, 200);
    assert.deepEqual(original.body, accepted.body);
    assert.ok(
      [403, 404].includes(
        (await h.call("second-company", path + `?kind=${kind}`)).status,
      ),
    );
    assert.ok(
      [403, 404].includes(
        (
          await h.call(
            "assigned-technician",
            path,
            body("PrepareDistribution", prepare),
          )
        ).status,
      ),
    );
    assert.equal(
      (
        await h.call(
          "coordinator",
          path + "?unrecognised=1",
          body("PrepareDistribution", prepare),
        )
      ).status,
      422,
    );
    assert.equal(
      (await h.call("coordinator", path, body("ApproveEverything", {}))).status,
      422,
    );
    assert.equal(
      (
        await h.call(
          "coordinator",
          path,
          body("ReconcileDistribution", {
            ...reconciliation,
            outcome: "Delivered",
          }),
        )
      ).status,
      422,
    );
    assert.ok(
      !JSON.stringify(history.body).match(
        /store_key|render_snapshot|lease_token/,
      ),
    );
    const forged = await fetch(localConfig().origin + "/api/v1/" + path, {
      method: "POST",
      headers: {
        cookie: await h.cookie("coordinator"),
        origin: "https://invalid.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body("PrepareDistribution", prepare)),
    });
    assert.equal(forged.status, 403);
  });
