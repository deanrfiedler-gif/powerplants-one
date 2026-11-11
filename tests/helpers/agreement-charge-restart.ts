// Synthetic-only, two-process proof. The caller stops/restarts the compiled app
// and PostgreSQL between write and verify; this script never simulates a restart.
import assert from "node:assert/strict";
import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  readlink,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { agreementCommand } from "../../src/maintenance/agreements";
import { localConfig } from "../../src/platform/config";
import { database, closeDatabase } from "../../src/platform/database";
import { httpAcceptance } from "./acceptance-http";
import { agreementChargeFixture, base } from "./agreement-charge-finance";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
const phase = process.argv[2];
assert.ok(phase === "write" || phase === "verify");
const directory = process.argv[3];
assert.ok(directory, "Supply a private local evidence directory");
const h = httpAcceptance(localConfig().origin);
type Operation = {
  profile: string;
  path: string;
  command: Record<string, unknown>;
  receipt: unknown;
};
async function application() {
  const pid = Number(process.env.PPO_RESTART_SERVER_PID);
  assert.ok(
    Number.isSafeInteger(pid) && pid > 0,
    "Supply the compiled server PID",
  );
  const command = await readFile(`/proc/${pid}/cmdline`, "utf8");
  assert.ok(
    command.includes("scripts/local-server.ts") &&
      command.includes("--compiled"),
  );
  assert.equal(
    await readlink(`/proc/${pid}/cwd`),
    process.cwd(),
    "Use the compiled application from this checkout",
  );
  const stat = await readFile(`/proc/${pid}/stat`, "utf8");
  // Tie the supplied process to the exact loopback listener used by h.call.
  const sockets = new Set<string>();
  for (const fd of await readdir(`/proc/${pid}/fd`)) {
    try {
      const target = await readlink(`/proc/${pid}/fd/${fd}`);
      const match = /^socket:\[(\d+)\]$/.exec(target);
      if (match) sockets.add(match[1]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const endpoint = `0100007F:${localConfig().port.toString(16).toUpperCase().padStart(4, "0")}`;
  const listeners = (await readFile(`/proc/${pid}/net/tcp`, "utf8"))
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/));
  assert.ok(
    listeners.some(
      (row) => row[1] === endpoint && row[3] === "0A" && sockets.has(row[9]),
    ),
    "The compiled PID must own the configured HTTP loopback listener",
  );
  return {
    pid,
    started: stat.slice(stat.lastIndexOf(")") + 2).split(" ")[19],
    build: (await readFile(".next/BUILD_ID", "utf8")).trim(),
    origin: localConfig().origin,
  };
}
const postmaster = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text value"))
    .rows[0].value as string;
async function snapshot() {
  const result: Record<string, unknown> = {};
  result.migration_ledger = (
    await database().query(
      "SELECT to_jsonb(x) row FROM public.ppo_migrations x ORDER BY version",
    )
  ).rows;
  for (const name of [
    "service_agreements",
    "agreement_revisions",
    "agreement_scope",
    "agreement_charge_lines",
    "maintenance_events",
    "finance_handoffs",
    "finance_revisions",
    "finance_lines",
    "finance_allocation_holds",
    "finance_reviews",
    "finance_processing_attempts",
    "finance_outcomes",
    "finance_simulator_targets",
    "finance_simulator_results",
    "finance_reconciliations",
    "finance_events",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ])
    result[name] = (
      await database().query(
        `SELECT to_jsonb(x) row FROM ppo.${name} x ORDER BY to_jsonb(x)::text`,
      )
    ).rows;
  return result;
}
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function act(
  operations: Operation[],
  profile: string,
  path: string,
  command: Record<string, unknown>,
  status = 201,
) {
  const r = await h.call(profile, path, command);
  assert.equal(r.status, status, JSON.stringify(r.body));
  operations.push({ profile, path, command, receipt: r.body });
}
try {
  if (phase === "write") {
    const f = await agreementChargeFixture(),
      cmd = f.draft(),
      path = `finance/handoffs/${cmd.id}`,
      operations: Operation[] = [];
    const read = async () => (await h.call("finance", path)).body;
    await act(operations, "finance", "finance/handoffs", cmd);
    let r = await read();
    assert.equal(r.lines[0].claim_amount, "4800.00");
    await act(operations, "finance", path + "/submit", {
      ...base(),
      expected_version: r.handoff.version,
    });
    r = await read();
    await act(operations, "finance-reviewer", path + "/review", {
      ...base(),
      expected_version: r.handoff.version,
      revision_id: r.handoff.current_revision_id,
      source_hash: r.revisions[0].source_hash,
      decision: "Approved",
    });
    r = await read();
    await act(operations, "finance-processor", path + "/begin-processing", {
      ...base(),
      expected_version: r.handoff.version,
      scenario: "AcceptedThenTimeout",
    });
    r = await read();
    await act(operations, "finance-processor", path + "/record-outcome", {
      ...base(),
      expected_version: r.handoff.version,
      attempt_id: r.handoff.active_attempt_id,
      action: "Dispatch",
    });
    r = await read();
    assert.equal(r.handoff.status, "OutcomeUnknown");
    const revised = await agreementCommand(f.owner, f.id, {
      ...base(),
      expected_version: 2,
      action: "Revise",
      content: {
        ...f.content,
        title: "SYN successor before restart; original charge retained",
      },
    });
    await agreementCommand(f.reviewer, f.id, {
      ...base(),
      expected_version: revised.receipt.record_version,
      action: "Approve",
      authority_reference:
        "SYN independently approved successor before restart",
    });
    const agreement = (
      await database().query(
        "SELECT version FROM ppo.service_agreements WHERE id=$1",
        [f.id],
      )
    ).rows[0];
    await act(
      operations,
      "finance-reviewer",
      `maintenance/agreements/${f.id}`,
      {
        ...base(),
        expected_version: agreement.version,
        action: "Withdraw",
        authority_reference:
          "SYN subsequent withdrawal; recover original outcome only",
      },
      200,
    );
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(
      `${directory}/checkpoint.json`,
      JSON.stringify({
        id: cmd.id,
        path,
        operations,
        nextDraft: f.draft([f.second]),
        evidence: await snapshot(),
        application: await application(),
        postmaster: await postmaster(),
      }),
      { mode: 0o600 },
    );
    console.log(
      "Saved OutcomeUnknown with superseded and withdrawn source and six original HTTP receipts. Restart compiled app and PostgreSQL before verify.",
    );
  } else {
    const saved = JSON.parse(
      await readFile(`${directory}/checkpoint.json`, "utf8"),
    ) as {
      id: string;
      path: string;
      operations: Operation[];
      nextDraft: Record<string, unknown>;
      evidence: unknown;
      application: Awaited<ReturnType<typeof application>>;
      postmaster: string;
    };
    const currentApp = await application(),
      currentDb = await postmaster();
    assert.equal(
      currentApp.build,
      saved.application.build,
      "Use the same compiled build after restart",
    );
    assert.notDeepEqual(
      currentApp,
      saved.application,
      "Restart the actual compiled application",
    );
    await assert.rejects(
      readFile(`/proc/${saved.application.pid}/stat`, "utf8"),
      (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT",
      "The original application process must have exited before recovery",
    );
    assert.notEqual(
      currentDb,
      saved.postmaster,
      "Restart the actual PostgreSQL instance",
    );
    assert.deepEqual(await snapshot(), saved.evidence);
    // The restarted local gateway requires fresh sign-ins. Account for their
    // exact audit additions before asserting that command replay is inert.
    const profiles = [
      "finance",
      "finance-reviewer",
      "finance-processor",
      "finance-reconciler",
      "second-company",
    ];
    for (const profile of profiles) await h.call(profile, "finance/handoffs");
    const beforeReplay = await snapshot();
    const original = saved.evidence as Record<string, unknown>;
    for (const key of Object.keys(beforeReplay))
      if (key !== "audit_events")
        assert.deepEqual(beforeReplay[key], original[key], key);
    type Audit = {
      row: {
        id: string;
        object_type: string;
        operation_id: string | null;
        outcome: string;
        details: { profile?: string };
      };
    };
    const oldAudit = original.audit_events as Audit[],
      newAudit = beforeReplay.audit_events as Audit[];
    const oldIds = new Set(oldAudit.map((a) => a.row.id));
    assert.deepEqual(
      newAudit.filter((a) => oldIds.has(a.row.id)),
      oldAudit,
    );
    const additions = newAudit.filter((a) => !oldIds.has(a.row.id));
    assert.equal(additions.length, profiles.length);
    for (const { row } of additions) {
      assert.equal(row.object_type, "Session");
      assert.equal(row.operation_id, null);
      assert.equal(row.outcome, "Accepted");
    }
    assert.deepEqual(
      additions.map((a) => a.row.details.profile).sort(),
      [...profiles].sort(),
    );
    for (const o of saved.operations) {
      const replay = await h.call(o.profile, o.path, o.command);
      assert.equal(replay.status, 200, JSON.stringify(replay.body));
      assert.deepEqual(replay.body, o.receipt);
      const lookup = await h.call(
        o.profile,
        `operations/${o.command.operation_id}`,
      );
      assert.equal(lookup.status, 200);
      assert.deepEqual(lookup.body, o.receipt);
    }
    assert.deepEqual(
      await snapshot(),
      beforeReplay,
      "Replay must leave the entire source/Finance/audit/receipt graph unchanged",
    );
    assert.ok(
      [403, 404].includes((await h.call("second-company", saved.path)).status),
    );
    const newEffect = await h.call(
      "finance",
      "finance/handoffs",
      saved.nextDraft,
    );
    assert.equal(newEffect.status, 409);
    assert.equal(newEffect.body.code, "AgreementSourceChanged");
    let r = (await h.call("finance-processor", saved.path)).body;
    assert.equal(r.handoff.status, "OutcomeUnknown");
    assert.equal(
      (
        await h.call("finance", saved.path + "/cancel", {
          ...base(),
          expected_version: r.handoff.version,
        })
      ).status,
      409,
    );
    assert.deepEqual(
      await snapshot(),
      beforeReplay,
      "Refused new effects must not mutate historical recovery evidence",
    );
    const recovery: Operation[] = [];
    await act(recovery, "finance-processor", saved.path + "/record-outcome", {
      ...base(),
      expected_version: r.handoff.version,
      attempt_id: r.handoff.active_attempt_id,
      action: "LookupOriginal",
    });
    r = (await h.call("finance-reconciler", saved.path)).body;
    await act(recovery, "finance-reconciler", saved.path + "/reconcile", {
      ...base(),
      expected_version: r.handoff.version,
      outcome_id: r.outcomes[0].id,
      basis: "SYN exact historical agreement charge after actual restart",
    });
    r = (await h.call("finance-reconciler", saved.path)).body;
    assert.equal(r.handoff.status, "Reconciled");
    assert.equal(r.reconciliations[0].result, "Matched");
    assert.equal(r.targets.length, 1);
    assert.equal(r.attempts.length, 1);
    assert.equal(r.targets[0].lines[0].amount, "4800.00");
    assert.equal(r.targets[0].lines[0].currency, "AUD");
    assert.deepEqual(
      (
        await database().query(
          "SELECT state FROM ppo.finance_allocation_holds WHERE handoff_id=$1",
          [saved.id],
        )
      ).rows,
      [{ state: "Consumed" }],
    );
    assert.deepEqual(
      await application(),
      currentApp,
      "Keep the proven listener through recovery",
    );
    const final = await snapshot();
    for (const o of recovery) {
      const replay = await h.call(o.profile, o.path, o.command);
      assert.equal(replay.status, 200);
      assert.deepEqual(replay.body, o.receipt);
    }
    assert.deepEqual(await snapshot(), final);
    await writeFile(
      `${directory}/verified.json`,
      JSON.stringify(
        {
          passed: true,
          source_superseded_before_restart: true,
          original_receipts: saved.operations.length,
          new_session_audit_rows: additions.length,
          recovery_receipts: recovery.length,
          graph_before: hash(saved.evidence),
          graph_after: hash(final),
          application_before: saved.application,
          application_after: currentApp,
          postmaster_before: saved.postmaster,
          postmaster_after: currentDb,
          target_count: 1,
          attempts: 1,
          amount: "4800.00",
          currency: "AUD",
          hold: "Consumed",
          result: "Matched",
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Actual app/PostgreSQL restart, exact receipt replay, historical lookup and reconciliation passed without duplicate effects.",
    );
  }
} finally {
  await closeDatabase();
}
