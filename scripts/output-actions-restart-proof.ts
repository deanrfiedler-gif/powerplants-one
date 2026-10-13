import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { closeDatabase } from "../src/platform/database";
import {
  prepareDistribution,
  recordDistributionOutcome,
  readDistribution,
} from "../src/outputs/distribution";
import { recoverOutputOperation } from "../src/outputs/actions";
import { reportIssued } from "../tests/helpers/reports";
import { queued, rows, base } from "../tests/helpers/packs";
import { readPack } from "../src/documents/packs";
import { processRenderJob } from "../src/documents/worker";
import { readOutput } from "../src/outputs/reads";
import { outputSnapshot } from "../tests/helpers/output-register";
import type { Principal } from "../src/platform/identity";
import type { OutputKind } from "../src/outputs/model";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const path = "verification-evidence/output-actions-restart",
  json = (v: unknown) => JSON.parse(JSON.stringify(v));
type Proof = {
  p: Principal;
  kind: OutputKind;
  id: string;
  prepare: {
    operation_id: string;
    attempt_id: string;
    issue_id: string;
    recipient_id: string;
    expected_version: number;
    schema_version: number;
    reason: string;
  };
  receipt: unknown;
  history: unknown;
  exact: unknown;
};
try {
  if (process.argv[2] === "write") {
    const report = await reportIssued(),
      pack = await queued(10);
    await processRenderJob(pack.pack.jobs[0].id);
    const current = (await readPack(pack.p, pack.pack.id)).items[0];
    const specs = [
      {
        p: pack.p,
        kind: "JobPack" as const,
        id: current.id,
        version: current.version,
        issue: current.current_issue_id,
        recipient: (
          await rows(
            "SELECT id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id",
            [current.current_issue_id],
          )
        )[0].id,
      },
      {
        p: report.reviewer,
        kind: "ServiceReport" as const,
        id: report.report.id,
        version: report.report.version,
        issue: report.report.issues[0].id,
        recipient: report.report.recipient_id,
      },
    ];
    const originals: Proof[] = [];
    for (const s of specs) {
      const prepare = {
        ...base(),
        attempt_id: randomUUID(),
        issue_id: s.issue,
        recipient_id: s.recipient,
        expected_version: s.version,
      };
      const accepted = await prepareDistribution(s.p, s.kind, s.id, prepare);
      await recordDistributionOutcome(s.p, s.kind, s.id, {
        ...base(),
        attempt_id: prepare.attempt_id,
        expected_attempt_version: 1,
        outcome: "OutcomeUnknown",
        evidence: "SYN original uncertain attempt before process restart.",
      });
      originals.push({
        p: s.p,
        kind: s.kind,
        id: s.id,
        prepare,
        receipt: accepted.receipt,
        history: await readDistribution(s.p, s.kind, s.id),
        exact: (await readOutput(s.p, s.id, { kind: s.kind })).selected_issue,
      });
    }
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/original.json",
      JSON.stringify({
        originals,
        business: await outputSnapshot(),
        ledger: await rows(
          "SELECT * FROM public.ppo_migrations ORDER BY version",
        ),
      }),
    );
    console.log(
      "DK03 action originals and unknown recipient attempts retained before restart",
    );
  } else if (process.argv[2] === "verify") {
    const saved = JSON.parse(await readFile(path + "/original.json", "utf8"));
    assert.deepEqual(json(await outputSnapshot()), saved.business);
    assert.deepEqual(
      json(await rows("SELECT * FROM public.ppo_migrations ORDER BY version")),
      saved.ledger,
    );
    for (const s of saved.originals as Proof[]) {
      assert.deepEqual(
        json(await readDistribution(s.p, s.kind, s.id)),
        s.history,
      );
      assert.deepEqual(
        json((await readOutput(s.p, s.id, { kind: s.kind })).selected_issue),
        s.exact,
      );
      assert.deepEqual(
        json(
          await recoverOutputOperation(s.p, s.id, {
            kind: s.kind,
            operation_id: s.prepare.operation_id,
          }),
        ),
        s.receipt,
      );
      assert.deepEqual(
        json((await prepareDistribution(s.p, s.kind, s.id, s.prepare)).receipt),
        s.receipt,
      );
      await assert.rejects(
        prepareDistribution(s.p, s.kind, s.id, {
          ...s.prepare,
          ...base(),
          attempt_id: randomUUID(),
        }),
        (e: unknown) =>
          (e as { code: string }).code === "DistributionRecoveryRequired",
      );
      const cmd = {
        ...base(),
        attempt_id: s.prepare.attempt_id,
        expected_attempt_version: 2,
        outcome: "SimulatedSent",
        evidence:
          "SYN additive reconciliation after PostgreSQL and application restart.",
      };
      const result = await recordDistributionOutcome(
        s.p,
        s.kind,
        s.id,
        cmd,
        true,
      );
      assert.deepEqual(
        (await recordDistributionOutcome(s.p, s.kind, s.id, cmd, true)).receipt,
        result.receipt,
      );
      const history = await readDistribution(s.p, s.kind, s.id);
      assert.equal(history.length, 1);
      assert.equal(history[0].events.length, 3);
      assert.equal(history[0].sent_at, null);
      assert.equal(history[0].delivered_at, null);
    }
    const result = {
      passed: true,
      families: 2,
      exact_outputs_and_original_receipts_retained: true,
      unknown_outcomes_block_replacement: true,
      reconciliation_additive_and_repeat_safe: true,
      real_delivery_claimed: false,
    };
    await writeFile(
      path + "/result.json",
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(result);
  } else throw Error("Choose write or verify");
} finally {
  await closeDatabase();
}
