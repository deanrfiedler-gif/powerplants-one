import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import {
  createProposal,
  reviseProposal,
  reviewProposal,
} from "../src/documents/drafts/commands";
import { readProposal, proposalHistory } from "../src/documents/drafts/reads";
import { readOperation } from "../src/shared/receipts";
import {
  setupDraft,
  draftInput,
  revisionInput,
  reviewCommand,
} from "../tests/helpers/template-drafts";
import { canonical } from "../src/platform/operations";
import { digest } from "../src/documents/store";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const path = "verification-evidence/template-drafts-restart";
const snapshot = async (id: string) =>
  (
    await database().query(
      "SELECT to_jsonb(e) AS value FROM ppo.template_proposal_events e WHERE proposal_id=$1 ORDER BY proposal_version",
      [id],
    )
  ).rows;
try {
  if (process.argv[2] === "write") {
    const { p, reviewer } = await setupDraft(),
      input = await draftInput(p);
    const created = await createProposal(p, input);
    const revision = await revisionInput(p, input.id),
      revised = await reviseProposal(p, input.id, revision);
    const review = await reviewCommand(reviewer, input.id),
      reviewed = await reviewProposal(reviewer, input.id, review);
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/original.json",
      JSON.stringify({
        input,
        revision,
        review,
        receipts: [created.receipt, revised.receipt, reviewed.receipt],
        events: await snapshot(input.id),
      }),
    );
    console.log(
      "R2 exact originals retained for PostgreSQL and process restart.",
    );
  } else if (process.argv[2] === "verify") {
    const { p, reviewer } = await setupDraft(),
      s = JSON.parse(await readFile(path + "/original.json", "utf8"));
    const outcomes = [
      await createProposal(p, s.input),
      await reviseProposal(p, s.input.id, s.revision),
      await reviewProposal(reviewer, s.input.id, s.review),
    ];
    for (let i = 0; i < 3; i++) {
      assert.equal(outcomes[i].replayed, true);
      assert.deepEqual(outcomes[i].receipt, s.receipts[i]);
      assert.deepEqual(
        await readOperation(i === 2 ? reviewer : p, s.receipts[i].operation_id),
        s.receipts[i],
      );
    }
    assert.deepEqual(await snapshot(s.input.id), s.events);
    const detail = await readProposal(p, s.input.id);
    assert.equal(detail.proposal.state, "Reviewed");
    assert.equal(detail.revision.id, s.revision.revision_id);
    assert.equal(
      (await proposalHistory(p, s.input.id, { kind: "Revision" })).items.length,
      2,
    );
    const result = {
      result: "Passed",
      scope:
        "DK-06 R2 exact typed evidence and actor-private original receipts after PostgreSQL and application-process restart",
      evidence_hash: digest(canonical(s)),
      publication_eligible: false,
    };
    await writeFile(
      path + "/result.json",
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(JSON.stringify(result));
  } else throw Error("Choose write or verify.");
} finally {
  await closeDatabase();
}
