import assert from "node:assert/strict";
import { test, after } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { cpqHttp } from "../helpers/cpq-products";
import { cpqQualityHttpScenario } from "../helpers/cpq-quality-http";
import { crmBase } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);

test("compiled quality API uses exact assessments, independent review, private historical reads and actor-bound recovery", async () => {
  const s = await cpqQualityHttpScenario();
  for (const [cookie, path, command, receipt] of [
    [s.cookie, s.path + "/assess", s.assess, s.assessmentReceipt],
    [s.reviewerCookie, s.path + "/review", s.review, s.reviewReceipt],
    [
      s.publisherCookie,
      `cpq/releases/${s.id}/activate`,
      s.activate,
      s.activationReceipt,
    ],
  ] as const) {
    assert.deepEqual(
      await cpqHttp(cookie, `operations/${command.operation_id}`),
      receipt,
    );
    assert.deepEqual(await cpqHttp(cookie, path, command), receipt);
    const changed = await cpqHttp<{ code: string }>(
      cookie,
      path,
      { ...command, reason: "Changed original" },
      409,
    );
    assert.equal(changed.code, "OperationConflict");
  }
  // Activation changed the report's company basis; a new command needs new review.
  assert.equal(
    (
      await cpqHttp<{ code: string }>(
        s.cookie,
        s.path + "/assess",
        {
          ...s.assess,
          ...crmBase(),
          expected_version: s.activationReceipt.record_version,
        },
        409,
      )
    ).code,
    "CpqQualityChanged",
  );
  await cpqHttp(s.cookie, s.path + "?include_private=true", undefined, 422);
  await cpqHttp(s.cookie, s.path + "/review", s.review, 404);
  const origin =
    process.env.PPO_TEST_ORIGIN ??
    `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
  const response = await fetch(`${origin}/api/v1/${s.historicalPath}`, {
    headers: { Cookie: s.cookie },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  const foreign = await fetch(`${origin}/api/v1/${s.path}/assess`, {
    method: "POST",
    headers: {
      Cookie: s.cookie,
      Origin: "https://unrelated.invalid",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(s.assess),
  });
  assert.equal(foreign.status, 403);
  const grants = (
    await database().query<{ id: string; valid_to: Date | null }>(
      "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.read'",
      [s.p.actor_id],
    )
  ).rows;
  try {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1 AND capability='estimating.read'",
      [s.p.actor_id],
    );
    for (const path of [
      s.historicalPath,
      `operations/${s.assess.operation_id}`,
      s.path,
    ])
      await cpqHttp(s.cookie, path, undefined, 404);
    await cpqHttp(s.cookie, s.path + "/assess", s.assess, 404);
  } finally {
    for (const grant of grants)
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
        [grant.id, grant.valid_to],
      );
  }
});
