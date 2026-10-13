import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { closeDatabase, database } from "../src/platform/database";
import { listOutputs, readOutput } from "../src/outputs/reads";
import { readOperation } from "../src/shared/receipts";
import { reportIssued } from "../tests/helpers/reports";
import type { Principal } from "../src/platform/identity";
import { outputSnapshot } from "../tests/helpers/output-register";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const path = "verification-evidence/output-register-restart";
const json = (v: unknown) => JSON.parse(JSON.stringify(v));
const stable = <T extends { as_at: string }>(value: T) => ({
  ...value,
  as_at: undefined,
});
async function capture(p: Principal, pack: string, report: string) {
  return json({
    register: stable(await listOutputs(p)),
    pack: stable(await readOutput(p, pack, { kind: "JobPack" })),
    report: stable(await readOutput(p, report, { kind: "ServiceReport" })),
    business_rows: await outputSnapshot(),
    ledger: (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
  });
}
try {
  if (process.argv[2] === "write") {
    const q = await reportIssued();
    const receipt = await readOperation(q.p, q.cmd.operation_id);
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/original.json",
      JSON.stringify({
        pack_id: q.pack.id,
        report_id: q.report.id,
        operation_id: q.cmd.operation_id,
        reader: q.reviewer,
        author: q.p,
        receipt,
        original: await capture(q.reviewer, q.pack.id, q.report.id),
      }),
    );
    console.log(
      "DK03 restart: original native identities, exact hashes, receipts and ledger saved",
    );
  } else if (process.argv[2] === "verify") {
    const proof = JSON.parse(await readFile(path + "/original.json", "utf8"));
    assert.deepEqual(
      await capture(proof.reader, proof.pack_id, proof.report_id),
      proof.original,
    );
    assert.deepEqual(
      json(await readOperation(proof.author, proof.operation_id)),
      proof.receipt,
    );
    await writeFile(
      path + "/result.json",
      JSON.stringify(
        {
          passed: true,
          native_identities_and_exact_hashes_retained: true,
          original_receipt_retained: true,
          business_rows_unchanged: true,
          migration_ledger_unchanged: true,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "DK03 restart: exact native outputs, original receipt, business rows and ledger verified",
    );
  } else throw Error("Choose write or verify");
} finally {
  await closeDatabase();
}
