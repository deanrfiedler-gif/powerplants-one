import { createSession } from "../../src/platform/identity";
import {
  readConfiguration,
  readHistory,
  recoveryResult,
} from "../../src/estimating/specialist/reads";
import { readLineage } from "../../src/estimating/specialist/lineage";
import { fixtureProposal } from "../../src/estimating/specialist/fixture-policy";
import {
  previewRebase,
  rebaseSource,
  copyConfiguration,
} from "../../src/estimating/specialist/source";
import { prepareQuote } from "../../src/estimating/service";
import { quoteCommand } from "../helpers/estimating";
import {
  previewDiscoveryChange,
  changeDiscoveryWorkspace,
  readDiscoveryWorkspace,
} from "../../src/estimating/discovery-workspaces";
import {
  previewDiscoveryCosting,
  adoptDiscoveryCosting,
} from "../../src/estimating/cost-basis-service";
import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import {
  saveDraft,
  saveRun,
  createConfiguration,
  adjustResolved,
  previewConfiguration,
  archiveConfiguration,
} from "../../src/estimating/specialist/service";
import {
  configuration,
  draft,
  run,
} from "../../src/estimating/specialist/context";
import {
  applyReceiving,
  previewReceiving,
} from "../../src/estimating/specialist/receiving";
import { resolveOriginal } from "../../src/estimating/specialist/recovery";
import { fixtureIds } from "../../src/estimating/specialist/fixture-policy";
import { readOperation } from "../../src/shared/receipts";
import { readEstimate } from "../../src/estimating/reads";
import { saveEstimate } from "../../src/estimating/service";
import {
  specialistFixture,
  saveFixtureRun,
  receivingInput,
  base,
} from "../helpers/specialist";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const cfgId = fixtureIds.configuration;
test("ES08-T26/T58/T61 durable incomplete drafts retain raw input and exact original recovery", async () => {
  const s = await specialistFixture();
  s.proposal.inputs.span.raw = "-";
  const input = { ...base(), expected_version: 1, proposal: s.proposal },
    saved = await saveDraft(s.p, cfgId, input),
    cfg = await configuration(database(), s.p, cfgId);
  assert.equal(
    (await draft(database(), s.p, cfg)).d.proposal.inputs.span.raw,
    "-",
  );
  assert.deepEqual(await readOperation(s.p, input.operation_id), saved.receipt);
  assert.equal((await saveDraft(s.p, cfgId, input)).replayed, true);
  assert.equal(
    (
      await previewConfiguration(s.p, cfgId, {
        expected_version: 2,
        proposal: s.proposal,
      })
    ).calculation.state,
    "Invalid",
  );
});
test("ES08-T28/T34/T35/T41/T44 synthetic receiving creates exact native lines, keeps manual line and atomically recovers", async () => {
  const s = await specialistFixture(true),
    request = await receivingInput(s.p),
    preview = await previewReceiving(s.p, cfgId, request);
  assert.deepEqual(preview.blockers, []);
  assert.equal(preview.lines.length, 12);
  assert.equal(preview.lines[0].id, s.manualId);
  const before = await readEstimate(s.p, fixtureIds.estimate),
    command = {
      ...base(),
      ...request,
      proposal_signature: preview.proposal_signature,
    },
    result = await applyReceiving(s.p, cfgId, command);
  assert.equal(result.receipt.record_version, 2);
  const after = await readEstimate(s.p, fixtureIds.estimate);
  assert.deepEqual(after.saved.lines[0], before.saved.lines[0]);
  assert.equal(after.saved.cost_total, preview.totals.cost);
  assert.equal(after.saved.sell_total, preview.totals.sell);
  assert.deepEqual(
    await readOperation(s.p, command.operation_id),
    result.receipt,
  );
  assert.equal((await applyReceiving(s.p, cfgId, command)).replayed, true);
});
test("ES08-T43/T63/T64 manual changes/deletion survive lineage and newer run updates evidence even with unchanged money", async () => {
  const s = await specialistFixture(true),
    first = await receivingInput(s.p),
    preview = await previewReceiving(s.p, cfgId, first);
  await applyReceiving(s.p, cfgId, {
    ...base(),
    ...first,
    proposal_signature: preview.proposal_signature,
  });
  const saved = await readEstimate(s.p, fixtureIds.estimate),
    line = saved.saved.lines[1];
  await saveEstimate(s.p, fixtureIds.estimate, {
    ...base(),
    schema_version: 2,
    expected_version: 2,
    title: saved.saved.title,
    scope: saved.saved.scope,
    lines: saved.saved.lines.filter((l) => l.id !== line.id),
    policy: saved.saved.policy,
  });
  const again = await receivingInput(s.p),
    comparison = await previewReceiving(s.p, cfgId, again);
  assert.ok(
    comparison.comparison.some(
      (r) => r.kind === "Deleted" && r.current === null,
    ),
  );
  assert.ok(
    comparison.blockers.some((b) => b.code === "SpecialistReviewRequired"),
  );
});
test("ES08-T46/T59/T60 accepted original survives archive, payload mutation fails", async () => {
  const s = await specialistFixture(true),
    input = await receivingInput(s.p),
    preview = await previewReceiving(s.p, cfgId, input),
    command = {
      ...base(),
      ...input,
      proposal_signature: preview.proposal_signature,
    },
    accepted = await applyReceiving(s.p, cfgId, command);
  await archiveConfiguration(s.p, cfgId, { ...base(), expected_version: 2 });
  assert.deepEqual(
    await readOperation(s.p, command.operation_id),
    accepted.receipt,
  );
  assert.equal((await applyReceiving(s.p, cfgId, command)).replayed, true);
  await assert.rejects(
    applyReceiving(s.p, cfgId, { ...command, reason: "different" }),
    (e: unknown) => (e as { code: string }).code === "OperationConflict",
  );
});
test("ES08-T73 terminal resolution excludes a late original and preserves accepted outcomes", async () => {
  const s = await specialistFixture(),
    operation_id = randomUUID(),
    original = {
      ...base(),
      operation_id,
      expected_version: 1,
      proposal: s.proposal,
    };
  await resolveOriginal(s.p, cfgId, {
    ...base(),
    original_operation_id: operation_id,
    command: "SaveSpecialistDraft",
  });
  await assert.rejects(
    saveDraft(s.p, cfgId, original),
    (e: unknown) => (e as { code: string }).code === "SpecialistOriginalClosed",
  );
  const saved = await saveDraft(s.p, cfgId, {
    ...original,
    operation_id: randomUUID(),
  });
  await resolveOriginal(s.p, cfgId, {
    ...base(),
    original_operation_id: saved.receipt.operation_id,
    command: "SaveSpecialistDraft",
  });
  assert.deepEqual(
    await readOperation(s.p, saved.receipt.operation_id),
    saved.receipt,
  );
});

const errorCode = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
async function apply(
  p: Awaited<ReturnType<typeof specialistFixture>>["p"],
  patch: Record<string, unknown> = {},
) {
  const request = { ...(await receivingInput(p)), ...patch },
    preview = await previewReceiving(p, cfgId, request);
  assert.deepEqual(preview.blockers, []);
  return applyReceiving(p, cfgId, {
    ...base(),
    ...request,
    proposal_signature: preview.proposal_signature,
  });
}
test("ES08-T46/T64 unchanged reapply is no-change, new run with equal money advances evidence and earlier quote stays pinned", async () => {
  const s = await specialistFixture(true);
  await apply(s.p);
  const before = await readEstimate(s.p, fixtureIds.estimate),
    quote = quoteCommand(before.saved, 2);
  await prepareQuote(s.p, before.id, quote);
  const same = await receivingInput(s.p),
    samePreview = await previewReceiving(s.p, cfgId, same);
  assert.equal(samePreview.already_current, true);
  await apply(s.p);
  assert.equal((await readEstimate(s.p, before.id)).version, 2);
  await saveFixtureRun(s.p);
  await apply(s.p);
  const after = await readEstimate(s.p, before.id);
  assert.equal(after.version, 3);
  assert.equal(after.saved.cost_total, before.saved.cost_total);
  assert.notEqual(
    after.specialist_contributions[0].run_id,
    before.specialist_contributions[0].run_id,
  );
  assert.equal(after.quotes[0].estimate_version_id, before.saved.id);
  const safe = (
    await database().query(
      "SELECT safe_snapshot FROM ppo.draft_quote_revisions WHERE id=$1",
      [quote.id],
    )
  ).rows[0].safe_snapshot;
  assert.ok(!JSON.stringify(safe).includes("resolved_set"));
  assert.ok(!JSON.stringify(safe).includes("unit_cost"));
});
test("ES08-T37 100 exact lines succeed; 101 fail without changing costs or evidence", async () => {
  const s = await specialistFixture(true),
    e = await readEstimate(s.p, fixtureIds.estimate),
    lines = Array.from({ length: 90 }, (_, i) => ({
      ...e.saved.lines[0],
      id: i ? randomUUID() : s.manualId,
      description: `SYN unrelated allowance ${i}`,
    }));
  await saveEstimate(s.p, e.id, {
    ...base(),
    schema_version: 2,
    expected_version: e.version,
    title: e.saved.title,
    scope: e.saved.scope,
    lines,
    policy: e.saved.policy,
  });
  const request = await receivingInput(s.p),
    preview = await previewReceiving(s.p, cfgId, request);
  assert.equal(preview.lines.length, 101);
  assert.ok(
    preview.blockers.some((x) => x.code === "SpecialistCapacityExceeded"),
  );
  await assert.rejects(
    applyReceiving(s.p, cfgId, {
      ...base(),
      ...request,
      proposal_signature: preview.proposal_signature,
    }),
    errorCode("SpecialistCapacityExceeded"),
  );
  assert.equal((await readEstimate(s.p, e.id)).version, 2);
  await saveEstimate(s.p, e.id, {
    ...base(),
    schema_version: 2,
    expected_version: 2,
    title: e.saved.title,
    scope: e.saved.scope,
    lines: lines.slice(0, 89),
    policy: e.saved.policy,
  });
  await apply(s.p);
  assert.equal((await readEstimate(s.p, e.id)).saved.lines.length, 100);
});
test("ES08-T27/T28/T45 two receiving writers cannot overwrite and stale signature leaves no run", async () => {
  const s = await specialistFixture(true),
    request = await receivingInput(s.p),
    preview = await previewReceiving(s.p, cfgId, request),
    outcomes = await Promise.allSettled(
      [1, 2].map(() =>
        applyReceiving(s.p, cfgId, {
          ...base(),
          ...request,
          proposal_signature: preview.proposal_signature,
        }),
      ),
    );
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal((await readEstimate(s.p, fixtureIds.estimate)).version, 2);
  const cfg = await configuration(database(), s.p, cfgId),
    p = fixtureProposal(true);
  await assert.rejects(
    saveRun(s.p, cfgId, {
      ...base(),
      expected_version: cfg.version,
      proposal: p,
      decisions: [],
      proposal_signature: "0".repeat(64),
    }),
    errorCode("SpecialistPreviewChanged"),
  );
  assert.equal(
    (await configuration(database(), s.p, cfgId)).version,
    cfg.version,
  );
  const old = await run(database(), s.p, cfg, cfg.current_run_id!);
  await assert.rejects(
    database().query(
      "UPDATE ppo.specialist_runs SET snapshot='{}' WHERE id=$1",
      [old.id],
    ),
  );
  assert.deepEqual(await run(database(), s.p, cfg, old.id), old);
});
test("ES08-T38/T65 persisted precision mismatch blocks receiving and exact old resolved set cannot substitute", async () => {
  const s = await specialistFixture(true),
    request = await receivingInput(s.p);
  await adjustResolved(s.p, cfgId, {
    ...base(),
    expected_version: 2,
    resolved_set_id: request.resolved_set_id,
    resolved_set_hash: request.resolved_set_hash,
    changes: [
      {
        key: "CE-LINE-240",
        quantity: "1.0001",
        remove: false,
        reason: "SYN exact precision refusal fixture",
      },
    ],
  });
  await assert.rejects(
    previewReceiving(s.p, cfgId, {
      ...request,
      expected_configuration_version: 3,
    }),
    errorCode("SpecialistPreviewChanged"),
  );
  const preview = await previewReceiving(s.p, cfgId, await receivingInput(s.p));
  assert.ok(
    preview.blockers.some((x) => x.code === "SpecialistPrecisionUnsupported"),
  );
  assert.equal((await readEstimate(s.p, fixtureIds.estimate)).version, 1);
});
test("ES08-T05/T48/T59 current permission revocation refuses reads, preview, export and accepted originals", async () => {
  const s = await specialistFixture(true),
    accepted = await apply(s.p),
    cfg = await configuration(database(), s.p, cfgId);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability IN ('estimating.read','estimating.edit')",
    [s.p.actor_id],
  );
  for (const read of [
    () => readConfiguration(s.p, cfgId, {}),
    () => readHistory(s.p, cfgId, { run_id: cfg.current_run_id!, export: "1" }),
    () => readOperation(s.p, accepted.receipt.operation_id),
    () =>
      previewConfiguration(s.p, cfgId, {
        expected_version: cfg.version,
        proposal: s.proposal,
      }),
  ])
    await assert.rejects(read());
  const other = (await createSession("technician")).principal;
  await assert.rejects(readConfiguration(other, cfgId, {}));
});
test("ES08-T66 corrupt lineage cannot be reused; database mutation test rolls back", async () => {
  const s = await specialistFixture(true);
  await apply(s.p);
  const e = await readEstimate(s.p, fixtureIds.estimate),
    c = await database().connect();
  try {
    await c.query("BEGIN");
    await c.query(
      "ALTER TABLE ppo.estimate_specialist_lineage DISABLE TRIGGER USER",
    );
    await c.query(
      "UPDATE ppo.estimate_specialist_lineage SET content_hash=repeat('0',64) WHERE estimate_version_id=$1",
      [e.saved.id],
    );
    await assert.rejects(
      readLineage(c, s.p, e.saved),
      errorCode("SpecialistEvidenceMismatch"),
    );
  } finally {
    await c.query("ROLLBACK");
    c.release();
  }
  assert.ok(await readLineage(database(), s.p, e.saved));
});
test("ES08-T72/T73 create closure before aggregate existence survives dispatcher lookup and blocks late create", async () => {
  const s = await specialistFixture(),
    id = randomUUID(),
    original = { ...s.create, ...base(), id },
    resolution = {
      ...base(),
      original_operation_id: original.operation_id,
      command: "CreateSpecialistConfiguration",
      estimating_workspace_id: fixtureIds.estimating_workspace,
      revision_id: fixtureIds.revision,
    };
  const accepted = await resolveOriginal(s.p, id, resolution);
  assert.deepEqual(
    await readOperation(s.p, resolution.operation_id),
    accepted.receipt,
  );
  assert.equal(
    (await recoveryResult(s.p, id, { operation_id: resolution.operation_id }))
      .outcome,
    "Closed without acceptance",
  );
  await assert.rejects(
    createConfiguration(s.p, original),
    errorCode("SpecialistOriginalClosed"),
  );
  const newOriginal = { ...original, ...base() };
  await createConfiguration(s.p, newOriginal);
  const resolved = await resolveOriginal(s.p, id, {
    ...resolution,
    ...base(),
    original_operation_id: newOriginal.operation_id,
  });
  assert.ok(await readOperation(s.p, resolved.receipt.operation_id));
});
test("ES08-T73 accepted-versus-close race has one terminal original outcome", async () => {
  const s = await specialistFixture(),
    original = { ...base(), expected_version: 1, proposal: s.proposal },
    resolution = {
      ...base(),
      original_operation_id: original.operation_id,
      command: "SaveSpecialistDraft",
    };
  const outcomes = await Promise.allSettled([
    saveDraft(s.p, cfgId, original),
    resolveOriginal(s.p, cfgId, resolution),
  ]);
  assert.equal(outcomes[1].status, "fulfilled");
  const result = await recoveryResult(s.p, cfgId, {
    operation_id: resolution.operation_id,
  });
  if (result.outcome === "Original accepted") {
    assert.equal(outcomes[0].status, "fulfilled");
    assert.ok(await readOperation(s.p, original.operation_id));
  } else {
    assert.equal(outcomes[0].status, "rejected");
    await assert.rejects(
      saveDraft(s.p, cfgId, original),
      errorCode("SpecialistOriginalClosed"),
    );
  }
});
async function discoverySuccessor(
  p: Awaited<ReturnType<typeof specialistFixture>>["p"],
  kind: "Save" | "Branch",
) {
  const d = await readDiscoveryWorkspace(p, fixtureIds.estimating_workspace),
    o = d.options.find((x) => x.option.id === fixtureIds.option)!,
    input = {
      kind,
      option_id: o.option.id,
      expected_version: d.workspace.version,
      expected_revision_id: o.revision.id,
      discovery: o.revision.input!,
      branch_mode: kind === "Branch" ? "Fresh" : null,
      copy_follow_up: null,
    },
    preview = await previewDiscoveryChange(
      p,
      fixtureIds.estimating_workspace,
      input,
    ),
    command = {
      ...base(),
      ...input,
      revision_id: randomUUID(),
      ...(kind === "Branch"
        ? { new_option_id: randomUUID(), label: "B synthetic screen study" }
        : {}),
      context_hash: preview.context_hash,
      comparison_hash: preview.comparison_hash,
      confirmed_question_ids: preview.required_confirmation_ids,
      configuration_confirmations: preview.configuration_confirmations,
    };
  await changeDiscoveryWorkspace(p, fixtureIds.estimating_workspace, command);
  return command;
}
test("ES08-T33/T36/T67/T69 rebase changes only source/draft; new cost basis carries lineage; cross-alternative copy owns nothing", async () => {
  const s = await specialistFixture(true);
  await apply(s.p);
  const before = await readEstimate(s.p, fixtureIds.estimate),
    oldcfg = await configuration(database(), s.p, cfgId),
    oldrun = await run(database(), s.p, oldcfg, oldcfg.current_run_id!),
    revision = await discoverySuccessor(s.p, "Save"),
    request = {
      expected_version: oldcfg.version,
      revision_id: revision.revision_id,
      coverage: s.create.coverage,
      field_decisions: [],
    },
    preview = await previewRebase(s.p, cfgId, request);
  await rebaseSource(s.p, cfgId, {
    ...base(),
    ...request,
    proposal_signature: preview.proposal_signature,
  });
  const current = await configuration(database(), s.p, cfgId),
    saved = await draft(database(), s.p, current);
  assert.equal(saved.d.binding.revision_id, revision.revision_id);
  assert.equal(current.current_run_id, oldcfg.current_run_id);
  assert.equal(
    Object.values(saved.d.proposal.manual_quantities).filter(
      (x) => x.basis_hash === null,
    ).length,
    14,
  );
  assert.deepEqual(await run(database(), s.p, current, oldrun.id), oldrun);
  assert.equal((await readEstimate(s.p, before.id)).version, before.version);
  const costing = await previewDiscoveryCosting(
    s.p,
    fixtureIds.estimating_workspace,
    { option_id: fixtureIds.option, revision_id: revision.revision_id },
  );
  await adoptDiscoveryCosting(s.p, fixtureIds.estimating_workspace, {
    ...base(),
    estimate_id: before.id,
    option_id: fixtureIds.option,
    revision_id: revision.revision_id,
    expected_workspace_version: saved.g.version,
    expected_estimate_version: before.version,
    context_hash: costing.context_hash,
    title: before.saved.title,
    scope: before.saved.scope,
    lines: before.saved.lines,
    policy: before.saved.policy,
  });
  const newCost = await readEstimate(s.p, before.id);
  assert.equal(newCost.specialist_contributions.length, 11);
  assert.ok(
    newCost.specialist_contributions.every((x) => x.source_basis_changed),
  );
  assert.deepEqual(newCost.saved.lines, before.saved.lines);
  const branch = await discoverySuccessor(s.p, "Branch"),
    g = await readDiscoveryWorkspace(s.p, fixtureIds.estimating_workspace),
    id = randomUUID(),
    copy = {
      ...base(),
      id,
      name: "SYN independent copied screen",
      source_run_id: oldrun.id,
      estimating_workspace_id: fixtureIds.estimating_workspace,
      option_id: branch.new_option_id!,
      revision_id: branch.revision_id,
      coverage: s.create.coverage,
      expected_workspace_version: g.workspace.version,
    };
  const copied = await copyConfiguration(s.p, cfgId, copy),
    view = await readConfiguration(s.p, id, {});
  assert.equal(view.current_run, null);
  assert.equal(view.adoptions.length, 0);
  assert.ok(
    Object.values(view.draft.proposal.inputs).every(
      (x) => x.attribution.kind === "assumption",
    ),
  );
  assert.deepEqual(await readOperation(s.p, copy.operation_id), copied.receipt);
  assert.equal((await readEstimate(s.p, before.id)).version, newCost.version);
});

test("ES08-T40/T42 kept manual overrides and retained removals require reconciliation on later receiving", async () => {
  const s = await specialistFixture(true);
  await apply(s.p);
  let saved = await readEstimate(s.p, fixtureIds.estimate);
  const contribution = saved.specialist_contributions.find(
    (c) => c.key === "CE-LINE-240",
  )!;
  await saveEstimate(s.p, saved.id, {
    ...base(),
    schema_version: 2,
    expected_version: saved.version,
    title: saved.saved.title,
    scope: saved.saved.scope,
    policy: saved.saved.policy,
    lines: saved.saved.lines.map((l) =>
      l.id === contribution.line_id ? { ...l, quantity: "999" } : l,
    ),
  });
  await apply(s.p, {
    decisions: [
      {
        key: "CE-LINE-240",
        choice: "keep",
        reason: "SYN retain estimator override",
      },
    ],
  });
  let preview = await previewReceiving(s.p, cfgId, await receivingInput(s.p));
  assert.equal(
    preview.comparison.find((r) => r.key === "CE-LINE-240")?.kind,
    "Manual edit",
  );
  assert.ok(
    preview.blockers.some((b) => b.code === "SpecialistReviewRequired"),
  );
  let request = await receivingInput(s.p);
  await adjustResolved(s.p, cfgId, {
    ...base(),
    expected_version: request.expected_configuration_version,
    resolved_set_id: request.resolved_set_id,
    resolved_set_hash: request.resolved_set_hash,
    changes: [
      {
        key: "CE-LINE-240",
        quantity: null,
        remove: true,
        reason: "SYN removed generated contribution",
      },
    ],
  });
  request = await receivingInput(s.p);
  request.price_and_unit_proposals = request.price_and_unit_proposals.filter(
    (p) => p.key !== "CE-LINE-240",
  );
  preview = await previewReceiving(s.p, cfgId, {
    ...request,
    decisions: [
      { key: "CE-LINE-240", choice: "retain", reason: "SYN retained removal" },
    ],
  });
  assert.deepEqual(preview.blockers, []);
  await applyReceiving(s.p, cfgId, {
    ...base(),
    ...request,
    decisions: [
      { key: "CE-LINE-240", choice: "retain", reason: "SYN retained removal" },
    ],
    proposal_signature: preview.proposal_signature,
  });
  saved = await readEstimate(s.p, saved.id);
  assert.equal(
    saved.specialist_contributions.find((c) => c.key === "CE-LINE-240")
      ?.disposition,
    "RetainedManual",
  );
  // Resolve the configuration-level deletion explicitly when its generated row returns.
  const cfg = await configuration(database(), s.p, cfgId),
    proposal = fixtureProposal(),
    decisions = [
      {
        key: "CE-LINE-240",
        choice: "restore" as const,
        reason: "SYN returning generated row",
      },
    ];
  const calculated = await previewConfiguration(s.p, cfgId, {
    expected_version: cfg.version,
    proposal,
    decisions,
  });
  await saveRun(s.p, cfgId, {
    ...base(),
    expected_version: cfg.version,
    proposal,
    decisions,
    proposal_signature: calculated.proposal_signature,
  });
  preview = await previewReceiving(s.p, cfgId, await receivingInput(s.p));
  assert.equal(
    preview.comparison.find((r) => r.key === "CE-LINE-240")?.kind,
    "Manual edit",
  );
  assert.equal(
    preview.comparison.find((r) => r.key === "CE-LINE-240")?.required,
    true,
  );
  assert.equal(
    preview.lines.filter((l) => l.id === contribution.line_id).length,
    0,
  ); // withheld pending decision, not duplicated
});
