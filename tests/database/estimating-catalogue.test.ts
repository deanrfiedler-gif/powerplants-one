import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
  previewDiscoveryChange,
  changeDiscoveryWorkspace,
  readDiscoveryRevision,
} from "../../src/estimating/discovery-workspaces";
import {
  compareDiscoverySources,
  readDiscoverySummary,
} from "../../src/estimating/discovery-reads";
import { discoveryFormOptions } from "../../src/estimating/discovery-form-options";
import {
  previewDiscoveryCosting,
  adoptDiscoveryCosting,
} from "../../src/estimating/cost-basis-service";
import { readEstimate } from "../../src/estimating/reads";
import { prepareQuote } from "../../src/estimating/service";
import { readOperation } from "../../src/shared/receipts";
import {
  equipmentCategories,
  equipmentCatalogueDefinition,
} from "../../src/estimating/equipment-catalogue";
import { crmBase, crmCreate, CRM } from "../helpers/crm";
import { structuredDiscovery } from "../helpers/estimating-configuration";
import {
  catalogueDiscovery,
  classifySyntheticConfiguration,
} from "../helpers/estimating-catalogue";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { recoverSchema } from "../helpers/recover-schema";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
const rows = async (table: string) =>
  (
    await database().query(
      // Later seeds 107 (readiness), 108 (Conversations) and 110 (agent ask) are proved in readiness-gate.test.ts, conversations-upgrade.test.ts and assistant-upgrade.test.ts.
      `SELECT to_jsonb(r) AS row FROM ${table} r${table === "ppo.seed_receipts" ? " WHERE r.version NOT IN (107,108,110,120, 121)" : table === "ppo.permission_grants" ? " WHERE r.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(r)::text`,
    )
  ).rows;
async function setup(discovery = catalogueDiscovery(true)) {
  const p = (await createSession("coordinator")).principal,
    opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const preview = await previewDiscoveryCreate(p, {
    opportunity_id: opportunity.id,
    discovery,
  });
  const command = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  };
  const result = await createDiscoveryWorkspace(p, command);
  return { p, opportunity, command, result };
}

test("ES02-CAT-05: the SQL guard enforces all 108 family/category pairs and successor evidence requirements", async () => {
  const c = catalogueDiscovery(true).configuration;
  // Exercise the installed trigger's version dispatch, including SQL NULL's
  // three-valued logic, without reaching unrelated revision/evidence guards.
  for (const invalidConfiguration of [
    {},
    { ...c, schema_version: null },
    { ...c, definition_id: null },
    { ...c, schema_version: "2" },
    { ...c, schema_version: 1 },
    { ...c, definition_id: "PPO-ES02-CONFIG-r03" },
  ])
    await assert.rejects(
      transaction(async (client) => {
        await client.query(
          "CREATE TEMP TABLE catalogue_probe(kind text,input jsonb,workspace_id uuid,predecessor_id uuid) ON COMMIT DROP; CREATE TRIGGER catalogue_probe_guard BEFORE INSERT ON catalogue_probe FOR EACH ROW EXECUTE FUNCTION ppo.check_estimating_configuration()",
        );
        await client.query(
          "INSERT INTO catalogue_probe VALUES('Discovery',$1,$2,NULL)",
          [
            JSON.stringify({ configuration: invalidConfiguration }),
            CRM.workspace,
          ],
        );
      }),
      (e: unknown) => (e as { code: string }).code === "23514",
    );
  for (const category of equipmentCategories) {
    c.systems[0].family = category.family;
    c.systems[0].category_id = category.id;
    await database().query(
      "SELECT ppo.validate_configuration_catalogue($1::jsonb,NULL)",
      [JSON.stringify(c)],
    );
    c.systems[0].family = category.family === "Water" ? "Climate" : "Water";
    await assert.rejects(
      database().query(
        "SELECT ppo.validate_configuration_catalogue($1::jsonb,NULL)",
        [JSON.stringify(c)],
      ),
      code("23514"),
    );
  }
  const old = structuredDiscovery(true).configuration,
    next = classifySyntheticConfiguration(old);
  next.facts = next.facts.filter((f) => f.field !== "VerifiedCapacity");
  await assert.rejects(
    database().query("SELECT ppo.validate_configuration_catalogue($1,$2)", [
      JSON.stringify(next),
      JSON.stringify(old),
    ]),
    code("23514"),
  );
  await assert.rejects(
    database().query("SELECT ppo.validate_configuration_catalogue($1,$2)", [
      JSON.stringify(old),
      JSON.stringify(classifySyntheticConfiguration(old)),
    ]),
    code("23514"),
  );
});

test("ES02-CAT-06: opt-in catalogue, saved r02 input, independent authority and original receipt recovery", async () => {
  const s = await setup();
  const original = await readDiscoveryRevision(
    s.p,
    s.command.id,
    s.command.revision_id,
  );
  assert.equal(
    original.input!.configuration!.definition_id,
    equipmentCatalogueDefinition,
  );
  assert.equal(original.scope_readiness, "Complete");
  assert.equal((await createDiscoveryWorkspace(s.p, s.command)).replayed, true);
  assert.deepEqual(
    await readOperation(s.p, s.command.operation_id),
    s.result.receipt,
  );
  const query = { opportunity_id: s.opportunity.id, site_id: CRM.site };
  assert.equal(
    (await discoveryFormOptions(s.p, query)).configuration_catalogue,
    undefined,
  );
  const options = await discoveryFormOptions(s.p, {
    ...query,
    configuration_definition: equipmentCatalogueDefinition,
  });
  assert.equal(
    options.configuration_catalogue!.families.reduce(
      (n, f) => n + f.categories.length,
      0,
    ),
    108,
  );
  for (const profile of ["observer", "second-company", "other-workspace"]) {
    const p = (await createSession(profile)).principal;
    await assert.rejects(
      previewDiscoveryCreate(p, {
        opportunity_id: s.opportunity.id,
        discovery: s.command.discovery,
      }),
    );
    await assert.rejects(
      discoveryFormOptions(p, {
        ...query,
        configuration_definition: equipmentCatalogueDefinition,
      }),
    );
  }
  const changed = structuredClone(s.command);
  changed.discovery.configuration.systems[0].category_id =
    "controls-priva-connext";
  await assert.rejects(
    createDiscoveryWorkspace(s.p, changed),
    code("OperationConflict"),
  );
  const proposal = {
    kind: "Save",
    option_id: s.command.option_id,
    expected_version: 1,
    expected_revision_id: s.command.revision_id,
    discovery: changed.discovery,
  };
  const preview = await previewDiscoveryChange(s.p, s.command.id, proposal);
  const command = {
    ...crmBase(),
    ...proposal,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: s.command.configuration_confirmations,
  };
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.command.id, command),
    code("ConfigurationConfirmationRequired"),
  );
  command.configuration_confirmations = preview.configuration_confirmations;
  await changeDiscoveryWorkspace(s.p, s.command.id, command);
  assert.equal(
    (await changeDiscoveryWorkspace(s.p, s.command.id, command)).replayed,
    true,
  );
  assert.deepEqual(
    await readDiscoveryRevision(s.p, s.command.id, s.command.revision_id),
    original,
  );
  const basis = await previewDiscoveryCosting(s.p, s.command.id, {
    option_id: s.command.option_id,
    revision_id: command.revision_id,
  });
  const manual = estimateInput(s.opportunity.id),
    estimateId = randomUUID();
  await adoptDiscoveryCosting(s.p, s.command.id, {
    ...crmBase(),
    estimate_id: estimateId,
    option_id: s.command.option_id,
    revision_id: command.revision_id,
    expected_workspace_version: 2,
    expected_estimate_version: 0,
    context_hash: basis.context_hash,
    title: manual.title,
    scope: manual.scope,
    lines: manual.lines.map((line) => ({ ...line, allowance: false })),
    policy: manual.policy,
  });
  const saved = (await readEstimate(s.p, estimateId)).saved;
  await prepareQuote(s.p, estimateId, quoteCommand(saved));
  assert.equal(
    (
      await database().query(
        "SELECT revision_id FROM ppo.estimate_discovery_bases WHERE estimate_version_id=$1",
        [saved.id],
      )
    ).rows[0].revision_id,
    command.revision_id,
  );
  const quotation = await database().query(
    "SELECT * FROM ppo.draft_quote_revisions WHERE estimate_version_id=$1",
    [saved.id],
  );
  assert.equal(quotation.rowCount, 1);
});

test("ES02-CAT-07: populated 0084 upgrade preserves exact originals, explicit reclassification, costing lineage and copy recovery", async () => {
  await recoverSchema();
  await database().query(
    "DROP TABLE IF EXISTS public.ppo_migrations,public.ppo_demo_migrations",
  );
  await migrate(84);
  await seed(84);
  const s = await setup(structuredDiscovery(true));
  const basis = await previewDiscoveryCosting(s.p, s.command.id, {
    option_id: s.command.option_id,
    revision_id: s.command.revision_id,
  });
  const manual = estimateInput(s.opportunity.id),
    estimateId = randomUUID();
  await adoptDiscoveryCosting(s.p, s.command.id, {
    ...crmBase(),
    estimate_id: estimateId,
    option_id: s.command.option_id,
    revision_id: s.command.revision_id,
    expected_workspace_version: 1,
    expected_estimate_version: 0,
    context_hash: basis.context_hash,
    title: manual.title,
    scope: manual.scope,
    lines: manual.lines.map((l) => ({ ...l, allowance: false })),
    policy: manual.policy,
  });
  const saved = (await readEstimate(s.p, estimateId)).saved;
  await prepareQuote(s.p, estimateId, quoteCommand(saved));
  const tables = [
    "ppo.estimation_revisions",
    "ppo.estimating_configuration_entities",
    "ppo.estimate_versions",
    "ppo.draft_quote_revisions",
    "ppo.operation_receipts",
    "ppo.permission_grants",
    "ppo.users",
    "ppo.seed_receipts",
    "ppo.audit_events",
  ];
  const snapshot = () => Promise.all(tables.map(rows)),
    before = await snapshot(),
    oldLedger = await rows("public.ppo_migrations");
  const old = await readDiscoveryRevision(
    s.p,
    s.command.id,
    s.command.revision_id,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  const ledger = await rows("public.ppo_migrations");
  assert.deepEqual(
    ledger.filter((r) => r.row.version < 85),
    oldLedger,
  );
  assert.deepEqual(
    // rows() orders complete JSON snapshots; checksums can change that order.
    // Compare the exact added version set numerically, retaining raw ledger checks above/below.
    ledger
      .filter((r) => r.row.version >= 85)
      .map((r) => r.row.version)
      .sort((a, b) => a - b),
    [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123],
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(await rows("public.ppo_migrations"), ledger);
  assert.deepEqual(
    await readDiscoveryRevision(s.p, s.command.id, s.command.revision_id),
    old,
  );
  assert.equal((await createDiscoveryWorkspace(s.p, s.command)).replayed, true);
  const discovery = {
    ...s.command.discovery,
    configuration: classifySyntheticConfiguration(
      s.command.discovery.configuration,
    ),
  };
  const capacity = discovery.configuration.facts.find(
    (f) => f.field === "VerifiedCapacity",
  )!;
  capacity.state = "Unknown";
  capacity.value = null;
  capacity.follow_up = {
    owner_id: CRM.owner,
    reason: "Verify capacity independently",
  };
  const proposal = {
    kind: "Save",
    option_id: s.command.option_id,
    expected_version: 1,
    expected_revision_id: s.command.revision_id,
    discovery,
  };
  const preview = await previewDiscoveryChange(s.p, s.command.id, proposal);
  assert.equal(preview.compiled.scope_readiness, "Incomplete");
  const command = {
    ...crmBase(),
    ...proposal,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  };
  await changeDiscoveryWorkspace(s.p, s.command.id, command);
  const current = await readDiscoveryRevision(
    s.p,
    s.command.id,
    command.revision_id,
  );
  assert.equal(current.scope_readiness, "Incomplete");
  assert.deepEqual(
    await readDiscoveryRevision(s.p, s.command.id, s.command.revision_id),
    old,
  );
  assert.deepEqual((await readEstimate(s.p, estimateId)).saved, saved);
  assert.equal(
    (
      await readDiscoverySummary(s.p, s.command.id, {
        option_id: s.command.option_id,
      })
    ).status,
    "Available",
  );
  const compared = await compareDiscoverySources(s.p, s.command.id, {
    baseline_id: s.command.revision_id,
    target_id: command.revision_id,
  });
  assert.ok(JSON.stringify(compared).includes("category_id"));
  const copyProposal = {
    kind: "Branch",
    branch_mode: "CopyDiscovery",
    option_id: s.command.option_id,
    expected_version: 2,
    expected_revision_id: command.revision_id,
    copy_allocation_id: randomUUID(),
    copy_follow_up: {
      owner_id: CRM.owner,
      reason: "Review copied catalogue scope",
    },
  };
  const copyPreview = await previewDiscoveryChange(
    s.p,
    s.command.id,
    copyProposal,
  );
  const copy = {
    ...crmBase(),
    ...copyProposal,
    revision_id: randomUUID(),
    new_option_id: randomUUID(),
    label: "Catalogue copy",
    context_hash: copyPreview.context_hash,
    comparison_hash: copyPreview.comparison_hash,
    confirmed_question_ids: [],
    configuration_confirmations: [],
  };
  await changeDiscoveryWorkspace(s.p, s.command.id, copy);
  assert.equal(
    (await changeDiscoveryWorkspace(s.p, s.command.id, copy)).replayed,
    true,
  );
  const copied = await readDiscoveryRevision(
    s.p,
    s.command.id,
    copy.revision_id,
  );
  for (const system of copied.input!.configuration!.systems) {
    const source = current.input!.configuration!.systems.find(
      (x) => x.id === system.lineage!.entity_id,
    )!;
    assert.equal(system.category_id, source.category_id);
    assert.equal(system.family, source.family);
    assert.notEqual(system.id, source.id);
  }
  assert.equal(copied.scope_readiness, "Incomplete");
});
