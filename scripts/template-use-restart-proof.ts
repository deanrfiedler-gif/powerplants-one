import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { canonical } from "../src/platform/operations";
import { digest } from "../src/documents/store";
import { assignUse, readAssignment } from "../src/documents/use/service";
import { selectedTemplate } from "../src/documents/use/policy";
import { readOperation } from "../src/shared/receipts";
import { useFixture } from "../tests/helpers/template-use";
import { principal } from "../tests/helpers/packs";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const path = "verification-evidence/template-use-restart";
const snapshot = async () =>
  Promise.all(
    ["template_use_policies", "template_use_assignments"].map((t) =>
      database()
        .query(
          `SELECT to_jsonb(r) AS value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
        )
        .then((r) => r.rows),
    ),
  );
try {
  if (process.argv[2] === "write") {
    const f = await useFixture(),
      saved = await assignUse(f.publisher, f.use);
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/original.json",
      JSON.stringify({
        command: f.use,
        receipt: saved.receipt,
        rows: await snapshot(),
      }),
    );
    console.log(
      "R4 exact assignment and original receipt retained for restart.",
    );
  } else if (process.argv[2] === "verify") {
    const original = JSON.parse(
        await readFile(path + "/original.json", "utf8"),
      ),
      p = await principal("cs-reviewer");
    const replay = await assignUse(p, original.command);
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.receipt, original.receipt);
    assert.deepEqual(
      await readOperation(p, original.command.operation_id),
      original.receipt,
    );
    assert.deepEqual(await snapshot(), original.rows);
    assert.equal(
      (await selectedTemplate(database(), p.workspace_id, original.command))
        .use_assignment_id,
      original.command.id,
    );
    assert.equal(
      (await readAssignment(p, original.command.id)).assignment.policy_version,
      1,
    );
    const result = {
      result: "Passed",
      scope:
        "R4 exact use policy, immutable assignment, server selection and actor-private recovery after PostgreSQL/process restart",
      evidence_hash: digest(canonical(original)),
    };
    await writeFile(
      path + "/result.json",
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(JSON.stringify(result));
  } else throw Error("Choose write or verify");
} finally {
  await closeDatabase();
}
