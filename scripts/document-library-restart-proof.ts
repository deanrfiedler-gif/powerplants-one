import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { closeDatabase, database } from "../src/platform/database";
import {
  createDocument,
  reviewDocument,
  reviseDocument,
} from "../src/library/commands";
import {
  readDocument,
  documentHistory,
  downloadDocument,
} from "../src/library/reads";
import { readOperation } from "../src/shared/receipts";
import {
  librarySetup,
  libraryInput,
  successor,
  base,
} from "../tests/helpers/library";
import { digest } from "../src/documents/store";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const path = "verification-evidence/document-library-restart",
  json = (v: unknown) => JSON.parse(JSON.stringify(v));
try {
  const { p, reviewer } = await librarySetup();
  if (process.argv[2] === "write") {
    const input = libraryInput(p.actor_id),
      created = await createDocument(p, input);
    const decision = {
      ...base(),
      revision_id: input.revision_id,
      expected_version: 1,
      outcome: "Reviewed",
      purpose: "SYN restart proof",
      rationale: "SYN exact content inspected",
    };
    const reviewed = await reviewDocument(reviewer, input.id, decision),
      next = successor(input, 2);
    const revised = await reviseDocument(p, input.id, next);
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/original.json",
      JSON.stringify({
        input,
        decision,
        next,
        created,
        reviewed,
        revised,
        current: await readDocument(p, input.id),
        history: await documentHistory(p, input.id),
        original_hash: digest(
          (await downloadDocument(p, input.id, input.revision_id)).bytes,
        ),
        ledger: (
          await database().query(
            "SELECT * FROM public.ppo_migrations ORDER BY version",
          )
        ).rows,
      }),
    );
    console.log("Document library restart: synthetic original saved");
  } else if (process.argv[2] === "verify") {
    const proof = JSON.parse(await readFile(path + "/original.json", "utf8"));
    assert.deepEqual(
      json(await readDocument(p, proof.input.id)),
      proof.current,
    );
    assert.deepEqual(
      json(await documentHistory(p, proof.input.id)),
      proof.history,
    );
    assert.deepEqual(
      (await createDocument(p, proof.input)).receipt,
      proof.created.receipt,
    );
    assert.deepEqual(
      (await reviewDocument(reviewer, proof.input.id, proof.decision)).receipt,
      proof.reviewed.receipt,
    );
    assert.deepEqual(
      (await reviseDocument(p, proof.input.id, proof.next)).receipt,
      proof.revised.receipt,
    );
    assert.deepEqual(
      await readOperation(p, proof.input.operation_id),
      proof.created.receipt,
    );
    assert.equal(
      digest(
        (await downloadDocument(p, proof.input.id, proof.input.revision_id))
          .bytes,
      ),
      proof.original_hash,
    );
    assert.deepEqual(
      json(
        (
          await database().query(
            "SELECT * FROM public.ppo_migrations ORDER BY version",
          )
        ).rows,
      ),
      proof.ledger,
    );
    await writeFile(
      path + "/result.json",
      JSON.stringify(
        {
          passed: true,
          exact_original_bytes_retained: true,
          review_and_history_retained: true,
          original_receipts_retained: true,
          migration_ledger_retained: true,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Document library restart: original bytes, review, history, receipts and ledger verified",
    );
  } else throw Error("Choose write or verify");
} finally {
  await closeDatabase();
}
