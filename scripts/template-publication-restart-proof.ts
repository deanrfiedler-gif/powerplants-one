import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import {
  publishTemplate,
  readPublication,
} from "../src/documents/publication/service";
import { readOperation } from "../src/shared/receipts";
import { reviewedDraft } from "../tests/helpers/template-publication";
import { principal, grantDraft } from "../tests/helpers/template-drafts";
import { canonical } from "../src/platform/operations";
import { digest } from "../src/documents/store";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const path = "verification-evidence/template-publication-restart";
const snapshot = async (id: string) =>
  (
    await database().query(
      "SELECT to_jsonb(p) AS value FROM ppo.template_publications p WHERE id=$1",
      [id],
    )
  ).rows;
try {
  if (process.argv[2] === "write") {
    const f = await reviewedDraft(),
      saved = await publishTemplate(f.publisher, f.input.id, f.command);
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/original.json",
      JSON.stringify({
        proposal_id: f.input.id,
        command: f.command,
        receipt: saved.receipt,
        rows: await snapshot(f.command.id),
      }),
    );
    console.log(
      "R3 exact publication and original receipt retained for restart.",
    );
  } else if (process.argv[2] === "verify") {
    const s = JSON.parse(await readFile(path + "/original.json", "utf8")),
      p = await principal("cs-reviewer");
    await grantDraft(p, ["template.publish", "pack.check"]);
    const replay = await publishTemplate(p, s.proposal_id, s.command);
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.receipt, s.receipt);
    assert.deepEqual(await readOperation(p, s.command.operation_id), s.receipt);
    assert.deepEqual(await snapshot(s.command.id), s.rows);
    assert.equal(
      (await readPublication(p, s.command.id)).runtime_support,
      "Supported",
    );
    const result = {
      result: "Passed",
      scope:
        "R3 immutable publication and actor-private original recovery after PostgreSQL/process restart",
      evidence_hash: digest(canonical(s)),
      use_assigned: false,
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
