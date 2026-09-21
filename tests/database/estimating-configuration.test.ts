import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
  previewDiscoveryChange,
  changeDiscoveryWorkspace,
  readDiscoveryWorkspace,
  readDiscoveryRevision,
  changeDiscoveryOption,
} from "../../src/estimating/discovery-workspaces";
import {
  readDiscoverySummary,
  listDiscoveryHistory,
  compareDiscoverySources,
  listDiscoveryCostVersions,
  readConfigurationEvidence,
} from "../../src/estimating/discovery-reads";
import { readOperation } from "../../src/shared/receipts";
import {
  previewDiscoveryCosting,
  adoptDiscoveryCosting,
} from "../../src/estimating/cost-basis-service";
import { readEstimate } from "../../src/estimating/reads";
import { saveEstimate } from "../../src/estimating/service";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { structuredDiscovery } from "../helpers/estimating-configuration";
import { estimateInput } from "../helpers/estimating";
import { discoveryFormOptions } from "../../src/estimating/discovery-form-options";
import { createFacility } from "../../src/shared/commands";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;

test("ES02-T15/T16: a permitted selected Facility beyond the candidate page is retained, searchable and bounded separately", async () => {
  const p = (await createSession("coordinator")).principal,
    o = crmCreate();
  await createOpportunity(p, o);
  const ids: string[] = [];
  for (let n = 0; n < 101; n++) {
    const id = randomUUID();
    ids.push(id);
    await createFacility(p, {
      ...crmBase(),
      id,
      company_id: CRM.company,
      site_id: CRM.site,
      name: `ZZZ ES02 facility ${String(n).padStart(3, "0")}`,
      parent_facility_id: null,
    });
  }
  const query = { opportunity_id: o.id, site_id: CRM.site };
  const first = await discoveryFormOptions(p, query);
  assert.equal(first.facilities.length, 100);
  assert.equal(first.more.facilities, true);
  assert.ok(!first.facilities.some((f) => f.id === ids[100]));
  const retained = await discoveryFormOptions(p, {
    ...query,
    selected_facility_ids: ids[100],
  });
  assert.equal(retained.facilities.length, 101);
  assert.ok(retained.facilities.some((f) => f.id === ids[100]));
  const search = await discoveryFormOptions(p, {
    ...query,
    search: "ES02 facility 100",
  });
  assert.equal(search.facilities.length, 1);
  assert.equal(search.facilities[0].id, ids[100]);
  await assert.rejects(
    discoveryFormOptions(p, {
      ...query,
      selected_facility_ids: ids.slice(0, 11).join(","),
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    discoveryFormOptions((await createSession("second-company")).principal, {
      ...query,
      selected_facility_ids: ids[100],
    }),
    code("RecordUnavailable"),
  );
});
async function setup(complete = false) {
  const p = (await createSession("coordinator")).principal,
    o = crmCreate();
  await createOpportunity(p, o);
  const discovery = structuredDiscovery(complete),
    preview = await previewDiscoveryCreate(p, {
      opportunity_id: o.id,
      discovery,
    });
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: o.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  };
  await createDiscoveryWorkspace(p, input);
  return { p, o, input };
}
test("ES02-T13/T20/T28/T38: complete configuration saves atomically, reloads and replays one original operation", async () => {
  const s = await setup(),
    r = await readDiscoveryRevision(s.p, s.input.id, s.input.revision_id);
  assert.equal(r.scope_readiness, "Incomplete");
  assert.equal(r.input!.configuration!.systems.length, 4);
  const identities = await database().query(
    "SELECT id FROM ppo.estimating_configuration_entities WHERE estimating_workspace_id=$1",
    [s.input.id],
  );
  assert.ok(identities.rowCount! > 10);
  const replay = await createDiscoveryWorkspace(s.p, s.input);
  assert.equal(replay.replayed, true);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::integer AS n FROM ppo.estimation_revisions WHERE estimating_workspace_id=$1",
        [s.input.id],
      )
    ).rows[0].n,
    1,
  );
  await assert.rejects(
    createDiscoveryWorkspace(s.p, {
      ...s.input,
      reason: "Changed same-key content",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.estimation_revisions SET reason='rewrite' WHERE id=$1",
      [r.id],
    ),
  );
});
test("ES02-T21/T61/T67: exact structured copy remaps owned children consistently through preview and original replay", async () => {
  const s = await setup(true),
    proposal = {
      kind: "Branch",
      branch_mode: "CopyDiscovery",
      option_id: s.input.option_id,
      expected_version: 1,
      expected_revision_id: s.input.revision_id,
      copy_follow_up: {
        owner_id: CRM.owner,
        reason: "Reconfirm copied discovery",
      },
      copy_allocation_id: randomUUID(),
    };
  const a = await previewDiscoveryChange(s.p, s.input.id, proposal),
    b = await previewDiscoveryChange(s.p, s.input.id, proposal);
  assert.equal(a.comparison_hash, b.comparison_hash);
  const input = {
    ...crmBase(),
    ...proposal,
    revision_id: randomUUID(),
    new_option_id: randomUUID(),
    label: "C",
    context_hash: a.context_hash,
    comparison_hash: a.comparison_hash,
    confirmed_question_ids: [],
    configuration_confirmations: [],
  };
  await changeDiscoveryWorkspace(s.p, s.input.id, input);
  assert.equal(
    (await changeDiscoveryWorkspace(s.p, s.input.id, input)).replayed,
    true,
  );
  const copied = await readDiscoveryRevision(
    s.p,
    s.input.id,
    input.revision_id,
  );
  assert.deepEqual(copied.input, a.compiled.input);
  assert.equal(copied.scope_readiness, "Incomplete");
  assert.ok(
    copied.input!.configuration!.systems.every((c) =>
      s.input.discovery.configuration.systems.every((o) => o.id !== c.id),
    ),
  );
  assert.equal(
    (await readDiscoveryWorkspace(s.p, s.input.id)).workspace
      .selected_option_id,
    s.input.option_id,
  );
});
test("ES02-T56/T68: stale configuration acknowledgments and removal of the extension cannot bypass readiness", async () => {
  const s = await setup(true),
    discovery = structuredClone(s.input.discovery);
  discovery.configuration.facts[0].value = "Changed configuration requirement";
  const proposal = {
      kind: "Save",
      option_id: s.input.option_id,
      expected_version: 1,
      expected_revision_id: s.input.revision_id,
      discovery,
    },
    preview = await previewDiscoveryChange(s.p, s.input.id, proposal);
  const command = {
    ...crmBase(),
    ...proposal,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: [],
  };
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, command),
    code("ConfigurationConfirmationRequired"),
  );
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, {
      ...command,
      configuration_confirmations: s.input.configuration_confirmations,
    }),
    code("ConfigurationConfirmationRequired"),
  );
  const legacy = { ...discovery } as { configuration?: unknown };
  delete legacy.configuration;
  await assert.rejects(
    previewDiscoveryChange(s.p, s.input.id, { ...proposal, discovery: legacy }),
    code("ConfigurationRequired"),
  );
  await changeDiscoveryWorkspace(s.p, s.input.id, {
    ...command,
    configuration_confirmations: preview.configuration_confirmations,
  });
  assert.equal(
    (await readDiscoveryWorkspace(s.p, s.input.id)).workspace.version,
    2,
  );
});
test("ES02-T31/T52/T57: saved total survives an incomplete successor, ordinary prices inherit the exact complete basis", async () => {
  const s = await setup(true),
    basis = await previewDiscoveryCosting(s.p, s.input.id, {
      option_id: s.input.option_id,
      revision_id: s.input.revision_id,
    }),
    manual = estimateInput(s.o.id),
    estimate_id = randomUUID();
  await adoptDiscoveryCosting(s.p, s.input.id, {
    ...crmBase(),
    estimate_id,
    option_id: s.input.option_id,
    revision_id: s.input.revision_id,
    expected_workspace_version: 1,
    expected_estimate_version: 0,
    context_hash: basis.context_hash,
    title: manual.title,
    scope: manual.scope,
    lines: [
      {
        ...manual.lines[0],
        quantity: "1",
        unit_sell: "58400.00",
        allowance: false,
      },
    ],
    policy: manual.policy,
  });
  const first = await readEstimate(s.p, estimate_id),
    discovery = structuredClone(s.input.discovery),
    capacity = discovery.configuration.facts.find(
      (f) => f.field === "VerifiedCapacity",
    )!;
  capacity.state = "Unknown";
  capacity.value = null;
  capacity.follow_up = {
    owner_id: CRM.owner,
    reason: "New capacity evidence needed",
  };
  const proposal = {
      kind: "Save",
      option_id: s.input.option_id,
      expected_version: 1,
      expected_revision_id: s.input.revision_id,
      discovery,
    },
    preview = await previewDiscoveryChange(s.p, s.input.id, proposal);
  await changeDiscoveryWorkspace(s.p, s.input.id, {
    ...crmBase(),
    ...proposal,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  const summary = await readDiscoverySummary(s.p, s.input.id, {
    option_id: s.input.option_id,
  });
  assert.equal(summary.status, "Available");
  if (summary.status !== "Available") throw Error("Expected saved costs");
  assert.equal(summary.sell_total, "58400.00");
  assert.equal(summary.basis!.revision_id, s.input.revision_id);
  await saveEstimate(s.p, estimate_id, {
    ...crmBase(),
    schema_version: 2,
    expected_version: 1,
    title: first.saved.title,
    scope: first.saved.scope,
    lines: first.saved.lines,
    policy: first.saved.policy,
  });
  assert.equal(
    (await readEstimate(s.p, estimate_id)).saved.discovery_basis!.revision_id,
    s.input.revision_id,
  );
  assert.deepEqual(
    (await readEstimate(s.p, estimate_id, { version_id: first.saved.id }))
      .saved,
    first.saved,
  );
  const versions = await listDiscoveryCostVersions(s.p, s.input.id, {
    option_id: s.input.option_id,
  });
  assert.equal(versions.items.length, 2);
  const comparison = await compareDiscoverySources(s.p, s.input.id, {
    baseline_id: s.input.revision_id,
    target_id: s.input.revision_id,
    baseline_cost: { estimate_id, version_id: first.saved.id },
    target_cost: { estimate_id, version_id: versions.items[0].id },
  });
  assert.equal(comparison.costs.baseline!.amount, "58400.00");
  assert.equal(
    comparison.costs.target!.discovery_basis!.revision_id,
    s.input.revision_id,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [s.p.actor_id],
  );
  assert.equal((await readDiscoveryWorkspace(s.p, s.input.id)).can_edit, false);
  assert.equal(
    (
      await readDiscoverySummary(s.p, s.input.id, {
        option_id: s.input.option_id,
      })
    ).status,
    "Available",
  );
  await assert.rejects(
    previewDiscoveryCosting(s.p, s.input.id, {
      option_id: s.input.option_id,
      revision_id: s.input.revision_id,
    }),
  );
});
test("ES02-T25/T39: bounded immutable history, exact comparisons and repeated migration/seed preserve saved snapshots", async () => {
  const s = await setup(),
    before = await readDiscoveryWorkspace(s.p, s.input.id);
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await readDiscoveryWorkspace(s.p, s.input.id), before);
  const history = await listDiscoveryHistory(s.p, s.input.id, {
    option_id: s.input.option_id,
  });
  assert.equal(history.items.length, 1);
  assert.equal(history.limit, 20);
  assert.equal(history.next, null);
  assert.deepEqual(
    (
      await compareDiscoverySources(s.p, s.input.id, {
        baseline_id: s.input.revision_id,
        target_id: s.input.revision_id,
      })
    ).differences,
    [],
  );
  await assert.rejects(
    compareDiscoverySources(s.p, s.input.id, {
      baseline_id: s.input.revision_id,
      target_id: randomUUID(),
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    changeDiscoveryOption(s.p, s.input.id, {
      ...crmBase(),
      action: "Archive",
      option_id: s.input.option_id,
      expected_version: 1,
      expected_revision_id: s.input.revision_id,
      expected_selected_option_id: s.input.option_id,
    }),
    code("SelectedOptionRequired"),
  );
});

test("ES02-T26/T27/T29/T50/T68: source versions remain recorded, changed sources require fresh exact review and every new projection rechecks access", async () => {
  const s = await setup(true),
    discovery = structuredClone(s.input.discovery),
    sourceId = discovery.scope.equipment_ids[0];
  const asset = (
    await database().query("SELECT version FROM ppo.assets WHERE id=$1", [
      sourceId,
    ])
  ).rows[0];
  discovery.configuration.evidence[0] = {
    ...discovery.configuration.evidence[0],
    source_type: "Asset",
    source_id: sourceId,
    source_version: asset.version,
  };
  const proposal = {
      kind: "Save",
      option_id: s.input.option_id,
      expected_version: 1,
      expected_revision_id: s.input.revision_id,
      discovery,
    },
    preview = await previewDiscoveryChange(s.p, s.input.id, proposal);
  const accepted = {
    ...crmBase(),
    ...proposal,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  };
  await changeDiscoveryWorkspace(s.p, s.input.id, accepted);
  await database().query(
    "UPDATE ppo.assets SET version=version+1 WHERE id=$1",
    [sourceId],
  );
  const recorded = await readConfigurationEvidence(s.p, s.input.id, {
    revision_id: accepted.revision_id,
  });
  assert.equal(
    recorded.evidence.find(
      (e) => e.id === discovery.configuration.evidence[0].id,
    )!.source_version,
    asset.version,
  );
  assert.equal(
    recorded.current.find((e) => e.source_id === sourceId)!.version,
    asset.version + 1,
  );
  const next = {
    ...proposal,
    expected_version: 2,
    expected_revision_id: accepted.revision_id,
  };
  await assert.rejects(
    previewDiscoveryChange(s.p, s.input.id, next),
    code("ConfigurationSourceChanged"),
  );
  discovery.configuration.evidence[0].source_version = asset.version + 1;
  const revised = await previewDiscoveryChange(s.p, s.input.id, next);
  assert.ok(revised.configuration_confirmations.length > 0);
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, {
      ...accepted,
      ...next,
      ...crmBase(),
      revision_id: randomUUID(),
      context_hash: revised.context_hash,
      comparison_hash: revised.comparison_hash,
    }),
    code("ConfigurationConfirmationRequired"),
  );
  for (const profile of [
    "observer",
    "systems",
    "second-company",
    "other-workspace",
  ]) {
    const p = (await createSession(profile)).principal;
    for (const read of [
      () =>
        readDiscoverySummary(p, s.input.id, { option_id: s.input.option_id }),
      () =>
        listDiscoveryHistory(p, s.input.id, { option_id: s.input.option_id }),
      () =>
        listDiscoveryCostVersions(p, s.input.id, {
          option_id: s.input.option_id,
        }),
      () =>
        readConfigurationEvidence(p, s.input.id, {
          revision_id: accepted.revision_id,
        }),
      () =>
        compareDiscoverySources(p, s.input.id, {
          baseline_id: s.input.revision_id,
          target_id: accepted.revision_id,
        }),
      () => readOperation(p, accepted.operation_id),
    ])
      await assert.rejects(read(), code("RecordUnavailable"));
  }
});

test("ES02-T38/T61/T67: configuration child IDs cannot be borrowed by a fresh option and failed graph insertion rolls back atomically", async () => {
  const s = await setup(true),
    proposal = {
      kind: "Branch",
      branch_mode: "Fresh",
      option_id: s.input.option_id,
      expected_version: 1,
      expected_revision_id: s.input.revision_id,
      discovery: s.input.discovery,
    };
  const preview = await previewDiscoveryChange(s.p, s.input.id, proposal);
  const snapshot = async () =>
    (
      await database().query(
        "SELECT (SELECT count(*) FROM ppo.estimating_configuration_entities) AS entities,(SELECT count(*) FROM ppo.estimation_revisions) AS revisions,(SELECT count(*) FROM ppo.estimating_options) AS options,(SELECT count(*) FROM ppo.operation_receipts) AS receipts,(SELECT count(*) FROM ppo.audit_events) AS audits,(SELECT count(*) FROM ppo.outbox_jobs) AS outbox",
      )
    ).rows[0];
  const before = await snapshot();
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, {
      ...crmBase(),
      ...proposal,
      new_option_id: randomUUID(),
      revision_id: randomUUID(),
      label: "Invalid reused identities",
      context_hash: preview.context_hash,
      comparison_hash: preview.comparison_hash,
      confirmed_question_ids: preview.required_confirmation_ids,
      configuration_confirmations: preview.configuration_confirmations,
    }),
    code("InvalidRelationship"),
  );
  assert.deepEqual(await snapshot(), before);
  await assert.rejects(
    database().query(
      "UPDATE ppo.estimating_configuration_entities SET option_id=$2 WHERE estimating_workspace_id=$1",
      [s.input.id, randomUUID()],
    ),
    code("55000"),
  );
});

test("ES02-T25/T62: history beyond twenty revisions uses stable disjoint pages and exact permitted sources", async () => {
  const s = await setup(),
    discovery = structuredClone(s.input.discovery);
  let revision = s.input.revision_id;
  for (let version = 1; version < 23; version++) {
    discovery.configuration.systems[0].proposed_work = `Synthetic scope revision ${version + 1}`;
    const proposal = {
        kind: "Save",
        option_id: s.input.option_id,
        expected_version: version,
        expected_revision_id: revision,
        discovery,
      },
      preview = await previewDiscoveryChange(s.p, s.input.id, proposal);
    revision = randomUUID();
    await changeDiscoveryWorkspace(s.p, s.input.id, {
      ...crmBase(),
      ...proposal,
      revision_id: revision,
      context_hash: preview.context_hash,
      comparison_hash: preview.comparison_hash,
      confirmed_question_ids: preview.required_confirmation_ids,
      configuration_confirmations: preview.configuration_confirmations,
    });
  }
  const newest = await listDiscoveryHistory(s.p, s.input.id, {
    option_id: s.input.option_id,
  });
  const older = await listDiscoveryHistory(s.p, s.input.id, {
    option_id: s.input.option_id,
    before: String(newest.next),
  });
  assert.equal(newest.items.length, 20);
  assert.equal(older.items.length, 3);
  assert.equal(older.next, null);
  assert.equal(
    new Set([...newest.items, ...older.items].map((r) => r.id)).size,
    23,
  );
  assert.equal(older.items.at(-1)!.id, s.input.revision_id);
});
