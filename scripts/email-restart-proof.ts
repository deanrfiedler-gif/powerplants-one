import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { reset } from "./database";
import { emailDemoFixtures } from "./email-demo-fixtures";
import { closeDatabase, database } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { createSession } from "../src/platform/identity";
import {
  linkEmail,
  createEmailFollowup,
  readEmail,
  readCalendar,
} from "../src/email/service";
import { readOpportunity } from "../src/crm/reads";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database only");
const folder = "verification-evidence/email-calendar-restart",
  path = folder + "/original.json";
try {
  if (process.argv[2] === "write") {
    process.env.PPO_ALLOW_RESET = "dispose-synthetic";
    process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
    await reset();
    await emailDemoFixtures();
    const p = (await createSession("coordinator")).principal,
      message = "ec000000-0000-4000-8000-000000000001",
      opportunity = "ec200000-0000-4000-8000-000000000001";
    await linkEmail(p, message, {
      operation_id: randomUUID(),
      schema_version: 1,
      reason: "SYN restart proof explicit link",
      expected_version: 1,
      opportunity_id: opportunity,
    });
    const input = {
      operation_id: randomUUID(),
      schema_version: 1,
      reason: "SYN restart proof follow-up",
      expected_version: 2,
      activity_id: randomUUID(),
      summary: "SYN Survive PostgreSQL restart",
      due_at: "2026-09-08T23:00:00Z",
    };
    const result = await createEmailFollowup(p, message, input);
    await mkdir(folder, { recursive: true });
    await writeFile(
      path,
      JSON.stringify(
        {
          p,
          message,
          opportunity,
          input,
          result,
          head: process.env.PPO_SOURCE_HEAD,
        },
        null,
        2,
      ),
    );
  } else if (process.argv[2] === "verify") {
    const v = JSON.parse(await readFile(path, "utf8"));
    assert.equal(
      (await readEmail(v.p, v.message)).followup_id,
      v.input.activity_id,
    );
    assert.ok(
      (await readOpportunity(v.p, v.opportunity)).actions.some(
        (a) => a.id === v.input.activity_id,
      ),
    );
    assert.ok(
      (await readCalendar(v.p, { day: "2026-09-09" })).activities.some(
        (a) => a.id === v.input.activity_id,
      ),
    );
    const retried = await createEmailFollowup(v.p, v.message, v.input);
    assert.equal(retried.replayed, true);
    assert.deepEqual(retried.receipt, v.result.receipt);
    assert.equal(
      (
        await database().query(
          "SELECT count(*)::int n FROM ppo.activities WHERE id=$1",
          [v.input.activity_id],
        )
      ).rows[0].n,
      1,
    );
    await writeFile(
      folder + "/verified.json",
      JSON.stringify(
        {
          verified: true,
          head: process.env.PPO_SOURCE_HEAD,
          run: process.env.GITHUB_RUN_ID,
        },
        null,
        2,
      ),
    );
  } else throw Error("Use write or verify");
  console.log("Email Calendar restart phase passed:", process.argv[2]);
} finally {
  await closeDatabase();
}
